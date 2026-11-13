// Reads cats written in a small part of Python, JavaScript, C or C++.
//
// Only the shapes the game itself writes are understood:
//   creating a cat, setting a property, adding it to the world, calling a method.
// Everything else gets an error that tries to teach something.

import { tokenize } from './tokens.js';
import {
  KEYWORDS,
  VALUES,
  ADVANCED,
  findKeyword,
  findValue,
  findAdvanced,
  findAdvancedValue,
  allWords,
  allAdvancedWords,
} from '../words.js';
import { suggest } from '../parser.js';
import { valueCode } from '../translate.js';

const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} '-]{0,19}$/u;
export const MAX_CATS = 3;

const CLASS = ['Cat', 'Gatto'];
const WORLD = ['world', 'mondo'];
const ADD = ['add', 'aggiungi'];
const C_ADD = ['world_add', 'mondo_aggiungi'];
const MEOW = ['meow', 'miagola'];
const C_MEOW = ['cat_meow', 'gatto_miagola'];
const NAME = ['name', 'nome'];

const CONFIG = {
  python: { bools: { True: true, False: false }, wrongBools: ['true', 'false'], list: ['[', ']'], semicolon: false },
  javascript: { bools: { true: true, false: false }, wrongBools: ['True', 'False'], list: ['[', ']'], semicolon: false },
  c: { bools: { true: true, false: false }, wrongBools: ['True', 'False'], list: ['{', '}'], semicolon: true },
  cpp: { bools: { true: true, false: false }, wrongBools: ['True', 'False'], list: ['{', '}'], semicolon: true },
};

class Stop extends Error {
  constructor(line, code, params = {}) {
    super(code);
    this.entry = { line, code, params };
  }
}

export function parseReal(source, lang) {
  const cfg = CONFIG[lang];
  const errors = [];
  const notes = [];
  const vars = new Map();
  const cats = [];
  let tokens;
  try {
    tokens = tokenize(source, lang);
  } catch (e) {
    if (e.entry) return { cats: [], errors: [e.entry], notes: [] };
    throw e;
  }
  let i = 0;

  const peek = (o = 0) => tokens[i + o];
  const next = () => tokens[i++];
  const show = (t) => (t.type === 'eof' ? 'the end' : t.type === 'string' ? `"${t.value}"` : t.value);
  const expect = (value, what) => {
    const t = next();
    if (t.value !== value || t.type === 'string') throw new Stop(t.line, 'expected', { expected: what || value, found: show(t) });
    return t;
  };
  const expectIdent = (what) => {
    const t = next();
    if (t.type !== 'ident') throw new Stop(t.line, 'expected', { expected: what, found: show(t) });
    return t;
  };
  const endStatement = (line) => {
    const t = peek();
    if (t.value === ';' && t.type === 'punct') {
      next();
      return;
    }
    if (cfg.semicolon) throw new Stop(line, 'missing_semicolon');
  };
  const skipLine = (line) => {
    while (peek().type !== 'eof' && peek().line === line) next();
  };

  // ---- values ----
  function value() {
    const t = next();
    if (t.type === 'string' || t.type === 'number') return { kind: t.type, value: t.value, line: t.line };
    if (t.type === 'punct' && t.value === '-' && peek().type === 'number') {
      const n = next();
      return { kind: 'number', value: -n.value, line: t.line };
    }
    if (t.type === 'punct' && (t.value === '[' || t.value === '{')) {
      const close = t.value === '[' ? ']' : '}';
      const items = [];
      while (peek().value !== close || peek().type === 'string') {
        items.push(value());
        if (peek().value === ',' && peek().type === 'punct') next();
        else break;
      }
      expect(close);
      return { kind: 'list', open: t.value, items, line: t.line };
    }
    if (t.type === 'ident') {
      if (peek().value === '::') {
        next();
        const v = expectIdent('a value after ::');
        return { kind: 'scoped', type: t.value, value: v.value, line: t.line };
      }
      if (t.value in cfg.bools) return { kind: 'bool', value: cfg.bools[t.value], line: t.line };
      return { kind: 'ident', value: t.value, line: t.line };
    }
    throw new Stop(t.line, 'expected', { expected: 'a value', found: show(t) });
  }

  // ---- turning a value into a property ----
  function word(node, key, advanced) {
    // returns the canonical id of an enum value written in this language's form
    const find = (w) => (advanced ? findAdvancedValue(key, w) : findValue(key, w));
    const wrong = () => {
      throw new Stop(node.line, 'wrong_form', { key, advanced, lang, example: exampleFor(key, advanced) });
    };
    if (lang === 'python' || lang === 'javascript') {
      if (node.kind !== 'string') {
        if (node.kind === 'ident' && find(node.value.replace(/_/g, ' '))) {
          throw new Stop(node.line, 'needs_quotes', { word: node.value });
        }
        wrong();
      }
      return find(node.value) || unknownValue(node, node.value, key, advanced);
    }
    if (lang === 'c') {
      if (node.kind === 'string' && find(node.value)) wrong();
      if (node.kind !== 'ident') wrong();
      return find(node.value.toLowerCase().replace(/_/g, ' ')) || unknownValue(node, node.value, key, advanced);
    }
    // C++
    if (node.kind !== 'scoped') wrong();
    const w = node.value
      .replace(/(?!^)([A-Z])/g, ' $1')
      .toLowerCase();
    return find(w) || unknownValue(node, node.value, key, advanced);
  }

  function unknownValue(node, raw, key, advanced) {
    const table = advanced ? ADVANCED[key].values : VALUES[key];
    throw new Stop(node.line, 'unknown_value', {
      key,
      advanced,
      word: raw,
      suggestion: suggest(raw.toLowerCase(), allWords(table)),
    });
  }

  function exampleFor(key, advanced) {
    const table = advanced ? ADVANCED[key].values : VALUES[key];
    const first = Object.keys(table)[0];
    const v = valueCode(lang, key, first, 'en', advanced);
    return key === 'colors' ? valueCode(lang, key, [first], 'en', advanced) : v;
  }

  function setField(cat, fieldTok, node) {
    const field = fieldTok.value;
    const line = fieldTok.line;
    if (NAME.includes(field)) {
      if (cat.name !== undefined) throw new Stop(line, 'name_fixed');
      if (node.kind !== 'string') throw new Stop(line, 'name_string');
      setName(cat, node.value, line);
      return;
    }
    const basic = findKeyword(field);
    if (basic && basic !== 'cat') {
      if (basic === 'colors') {
        if (node.kind !== 'list') {
          throw new Stop(line, 'expected_list', { example: exampleFor('colors', false) });
        }
        const ids = [];
        for (const item of node.items) {
          const id = word(item, 'colors', false);
          if (!ids.includes(id)) ids.push(id);
        }
        if (!ids.length) throw new Stop(line, 'empty_colors');
        if (ids.length > 3) throw new Stop(line, 'too_many_colors');
        cat.props.colors = { value: ids, line };
      } else {
        cat.props[basic] = { value: word(node, basic, false), line };
      }
      return;
    }
    const adv = findAdvanced(field);
    if (adv) {
      const def = ADVANCED[adv];
      if (def.type === 'enum') {
        cat.adv[adv] = { value: word(node, adv, true), line };
      } else if (def.type === 'bool') {
        if (node.kind === 'ident' && cfg.wrongBools.includes(node.value)) {
          throw new Stop(line, lang === 'python' ? 'python_bool' : 'lower_bool', { word: node.value });
        }
        if (node.kind !== 'bool') throw new Stop(line, 'wrong_type', { key: adv, type: 'bool' });
        cat.adv[adv] = { value: node.value, line };
      } else {
        if (node.kind !== 'number') throw new Stop(line, 'wrong_type', { key: adv, type: def.type });
        if (def.type === 'int' && !Number.isInteger(node.value)) throw new Stop(line, 'wrong_type', { key: adv, type: 'int' });
        if (node.value < def.min || node.value > def.max) {
          throw new Stop(line, 'out_of_range', { key: adv, min: def.min, max: def.max });
        }
        cat.adv[adv] = { value: node.value, line };
      }
      return;
    }
    throw new Stop(line, 'unknown_field', {
      word: field,
      suggestion: suggest(field, [...allWords(KEYWORDS).filter((w) => w !== 'cat' && w !== 'gatto'), ...allAdvancedWords(), ...NAME]),
    });
  }

  function setName(cat, name, line) {
    if (!NAME_PATTERN.test(name)) throw new Stop(line, 'bad_name', { name });
    if (cats.some((c) => c.name === name)) throw new Stop(line, 'duplicate_name', { name });
    cat.name = name;
  }

  function newCat(varTok) {
    if (vars.has(varTok.value) && !vars.get(varTok.value).broken) throw new Stop(varTok.line, 'redeclared', { name: varTok.value });
    const cat = { varName: varTok.value, name: undefined, line: varTok.line, props: {}, adv: {}, actions: [], added: false, addLine: null };
    // registered now, so a mistake inside the declaration doesn't also make
    // every later line say "unknown variable"
    cat.broken = true;
    vars.set(varTok.value, cat);
    return cat;
  }

  function finishCat(cat) {
    if (cat.name === undefined) throw new Stop(cat.line, 'missing_name_field');
    delete cat.broken;
    cats.push(cat);
  }

  function catVar(tok) {
    const cat = vars.get(tok.value);
    if (!cat) {
      throw new Stop(tok.line, 'unknown_variable', {
        name: tok.value,
        suggestion: suggest(tok.value, [...vars.keys()]),
      });
    }
    if (cat.broken) throw new Stop(tok.line, 'silent');
    return cat;
  }

  function addToWorld(cat, line) {
    if (cat.added) {
      notes.push({ line, code: 'already_added', params: { name: cat.name } });
      return;
    }
    if (cats.filter((c) => c.added).length >= MAX_CATS) throw new Stop(line, 'too_many_cats', { max: MAX_CATS });
    cat.added = true;
    cat.addLine = line;
  }

  function meow(cat, node, line) {
    if (node.kind !== 'string') throw new Stop(line, 'meow_string');
    cat.actions.push({ type: 'meow', text: node.value.slice(0, 24), line });
  }

  // ---- statements ----
  function statement() {
    const t = peek();
    const line = t.line;

    // JavaScript: const luna = new Cat({ ... });
    if (lang === 'javascript' && t.type === 'ident' && ['const', 'let', 'var'].includes(t.value)) {
      next();
      const v = expectIdent('a variable name');
      expect('=');
      const n = next();
      if (n.value !== 'new') {
        throw new Stop(n.line, CLASS.includes(n.value) ? 'missing_new' : 'expected', { expected: 'new Cat(', found: show(n) });
      }
      expectClass();
      expect('(');
      expect('{');
      const cat = newCat(v);
      while (!(peek().value === '}' && peek().type === 'punct')) {
        const f = expectIdent('a property name');
        expect(':');
        setField(cat, f, value());
        if (peek().value === ',' && peek().type === 'punct') next();
        else break;
      }
      expect('}');
      expect(')');
      finishCat(cat);
      endStatement(line);
      return;
    }

    // C: Cat luna = { .name = "Luna", ... };   C++: Cat luna("Luna");
    if ((lang === 'c' || lang === 'cpp') && t.type === 'ident' && CLASS.includes(t.value) && peek(1).type === 'ident') {
      next();
      const v = next();
      const cat = newCat(v);
      if (lang === 'c') {
        expect('=');
        expect('{');
        while (!(peek().value === '}' && peek().type === 'punct')) {
          expect('.', '.property');
          const f = expectIdent('a property name');
          expect('=');
          setField(cat, f, value());
          if (peek().value === ',' && peek().type === 'punct') next();
          else break;
        }
        expect('}');
      } else {
        expect('(');
        const name = next();
        if (name.type !== 'string') throw new Stop(name.line, 'name_string');
        setName(cat, name.value, name.line);
        expect(')');
      }
      finishCat(cat);
      endStatement(line);
      return;
    }

    // C: world_add(&world, &luna);  cat_meow(&luna, "hi");
    if (lang === 'c' && t.type === 'ident' && peek(1).value === '(') {
      next();
      next();
      if (C_ADD.includes(t.value)) {
        expect('&', '&world');
        const w = expectIdent('world');
        if (!WORLD.includes(w.value)) throw new Stop(w.line, 'expected', { expected: 'world', found: w.value });
        expect(',');
        expect('&', '&');
        addToWorld(catVar(expectIdent('a cat variable')), line);
        expect(')');
      } else if (C_MEOW.includes(t.value)) {
        expect('&', '&');
        const cat = catVar(expectIdent('a cat variable'));
        expect(',');
        meow(cat, value(), line);
        expect(')');
      } else {
        throw new Stop(line, 'unknown_function', { name: t.value, suggestion: suggest(t.value, [...C_ADD, ...C_MEOW]) });
      }
      endStatement(line);
      return;
    }

    // Python: luna = Cat(name="Luna", ...)
    if (lang === 'python' && t.type === 'ident' && peek(1).value === '=' && peek(1).type === 'punct') {
      const v = next();
      next();
      expectClass();
      expect('(');
      const cat = newCat(v);
      while (!(peek().value === ')' && peek().type === 'punct')) {
        const f = expectIdent('a property name');
        const eq = next();
        if (eq.value !== '=') {
          throw new Stop(eq.line, eq.value === ':' ? 'python_colon' : 'expected', { expected: '=', found: show(eq) });
        }
        setField(cat, f, value());
        if (peek().value === ',' && peek().type === 'punct') next();
        else break;
      }
      expect(')');
      finishCat(cat);
      endStatement(line);
      return;
    }

    // luna.speed = 3   world.add(luna)   luna.meow("hi")
    if (t.type === 'ident' && peek(1).value === '.' && peek(1).type === 'punct') {
      const target = next();
      next();
      const member = expectIdent('a property or method name');
      if (peek().value === '(' && peek().type === 'punct') {
        next();
        if (WORLD.includes(target.value)) {
          if (!ADD.includes(member.value)) {
            throw new Stop(member.line, 'unknown_method', { name: member.value, suggestion: suggest(member.value, ADD) });
          }
          addToWorld(catVar(expectIdent('a cat variable')), line);
        } else {
          const cat = catVar(target);
          if (!MEOW.includes(member.value)) {
            throw new Stop(member.line, 'unknown_method', { name: member.value, suggestion: suggest(member.value, MEOW) });
          }
          meow(cat, value(), line);
        }
        expect(')');
        endStatement(line);
        return;
      }
      expect('=');
      setField(catVar(target), member, value());
      endStatement(line);
      return;
    }

    throw new Stop(line, 'unknown_statement', { found: show(t) });
  }

  function expectClass() {
    const c = next();
    if (!CLASS.includes(c.value)) {
      throw new Stop(c.line, 'expected', { expected: 'Cat', found: show(c) });
    }
  }

  const OPEN = ['(', '[', '{'];
  const CLOSE = [')', ']', '}'];

  while (peek().type !== 'eof') {
    const start = i;
    try {
      statement();
    } catch (e) {
      if (!e.entry) throw e;
      if (e.entry.code !== 'silent') errors.push(e.entry);
      // skip the whole broken statement, brackets included, so one mistake
      // gives one message instead of a cascade
      i = start;
      let depth = 0;
      let lastLine = peek().line;
      while (peek().type !== 'eof') {
        const t = peek();
        if (i > start && t.line > lastLine && depth <= 0) break;
        if (t.type === 'punct' && OPEN.includes(t.value)) depth++;
        if (t.type === 'punct' && CLOSE.includes(t.value)) depth--;
        lastLine = t.line;
        next();
        if (t.type === 'punct' && t.value === ';' && depth <= 0) break;
      }
    }
  }

  for (const cat of cats) {
    if (!cat.added && !errors.length) notes.push({ line: cat.line, code: 'not_added', params: { name: cat.name, lang } });
  }
  if (!cats.length && !errors.length) errors.push({ line: 1, code: 'empty_program' });
  return { cats, errors, notes };
}
