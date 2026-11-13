// Shows the same cat program in Python, JavaScript, C and C++.
// Every output line remembers which line of the cat program it comes from,
// so the page can highlight matching lines.

import { PROPERTY_ORDER, keywordWord, valueWord } from './words.js';

const NAMES = {
  en: { Cat: 'Cat', world: 'world', add: 'add', name: 'name', rest: 'everything else is picked from the name' },
  it: { Cat: 'Gatto', world: 'mondo', add: 'aggiungi', name: 'nome', rest: 'il resto lo sceglie il nome' },
};

const TYPE_NAMES = {
  en: { sex: 'Sex', colors: 'Color', pattern: 'Pattern', eyes: 'Eyes', ears: 'Ears', mouth: 'Mouth', tail: 'Tail', body: 'Body' },
  it: { sex: 'Sesso', colors: 'Colore', pattern: 'Motivo', eyes: 'Occhi', ears: 'Orecchie', mouth: 'Muso', tail: 'Coda', body: 'Corpo' },
};

const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

function variable(name) {
  const v = plain(name).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
  return /^[0-9]/.test(v) ? `cat_${v}` : v || 'cat';
}

const constant = (word) => plain(word).toUpperCase().replace(/[^A-Z0-9]+/g, '_');
const pascal = (word) =>
  plain(word)
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');

function propsOf(cat) {
  return PROPERTY_ORDER.filter((k) => cat.props[k]).map((k) => ({ key: k, ...cat.props[k] }));
}

function values(p, lang) {
  return Array.isArray(p.value) ? p.value.map((v) => valueWord(p.key, v, lang)) : [valueWord(p.key, p.value, lang)];
}

const field = (key, lang) => keywordWord(key, lang);

function python(cats, lang) {
  const N = NAMES[lang];
  const out = [];
  cats.forEach((cat, i) => {
    const v = variable(cat.name);
    if (i) out.push({ text: '', src: null });
    out.push({ text: `# ${N.rest}`, src: null });
    out.push({ text: `${v} = ${N.Cat}(`, src: cat.line });
    out.push({ text: `    ${N.name}="${cat.name}",`, src: cat.line });
    for (const p of propsOf(cat)) {
      const vals = values(p, lang).map((w) => `"${w}"`);
      const rhs = p.key === 'colors' ? `[${vals.join(', ')}]` : vals[0];
      out.push({ text: `    ${field(p.key, lang)}=${rhs},`, src: p.line });
    }
    out.push({ text: ')', src: cat.line });
    out.push({ text: `${N.world}.${N.add}(${v})`, src: cat.line });
  });
  return out;
}

function javascript(cats, lang) {
  const N = NAMES[lang];
  const out = [];
  cats.forEach((cat, i) => {
    const v = variable(cat.name);
    if (i) out.push({ text: '', src: null });
    out.push({ text: `// ${N.rest}`, src: null });
    out.push({ text: `const ${v} = new ${N.Cat}({`, src: cat.line });
    out.push({ text: `  ${N.name}: "${cat.name}",`, src: cat.line });
    for (const p of propsOf(cat)) {
      const vals = values(p, lang).map((w) => `"${w}"`);
      const rhs = p.key === 'colors' ? `[${vals.join(', ')}]` : vals[0];
      out.push({ text: `  ${field(p.key, lang)}: ${rhs},`, src: p.line });
    }
    out.push({ text: '});', src: cat.line });
    out.push({ text: `${N.world}.${N.add}(${v});`, src: cat.line });
  });
  return out;
}

function c(cats, lang) {
  const N = NAMES[lang];
  const out = [];
  cats.forEach((cat, i) => {
    const v = variable(cat.name);
    if (i) out.push({ text: '', src: null });
    out.push({ text: `/* ${N.rest} */`, src: null });
    out.push({ text: `${N.Cat} ${v} = {`, src: cat.line });
    out.push({ text: `    .${N.name} = "${cat.name}",`, src: cat.line });
    for (const p of propsOf(cat)) {
      const vals = values(p, lang).map(constant);
      const rhs = p.key === 'colors' ? `{ ${vals.join(', ')} }` : vals[0];
      out.push({ text: `    .${field(p.key, lang)} = ${rhs},`, src: p.line });
    }
    out.push({ text: '};', src: cat.line });
    out.push({ text: `${N.world}_${N.add}(&${N.world}, &${v});`, src: cat.line });
  });
  return out;
}

function cpp(cats, lang) {
  const N = NAMES[lang];
  const T = TYPE_NAMES[lang];
  const out = [];
  cats.forEach((cat, i) => {
    const v = variable(cat.name);
    if (i) out.push({ text: '', src: null });
    out.push({ text: `// ${N.rest}`, src: null });
    out.push({ text: `${N.Cat} ${v}("${cat.name}");`, src: cat.line });
    for (const p of propsOf(cat)) {
      const vals = values(p, lang).map((w) => `${T[p.key]}::${pascal(w)}`);
      const rhs = p.key === 'colors' ? `{ ${vals.join(', ')} }` : vals[0];
      out.push({ text: `${v}.${field(p.key, lang)} = ${rhs};`, src: p.line });
    }
    out.push({ text: `${N.world}.${N.add}(${v});`, src: cat.line });
  });
  return out;
}

export const LANGUAGES = [
  { id: 'python', label: 'Python', make: python },
  { id: 'javascript', label: 'JavaScript', make: javascript },
  { id: 'c', label: 'C', make: c },
  { id: 'cpp', label: 'C++', make: cpp },
];

export function translate(cats, lang) {
  return Object.fromEntries(LANGUAGES.map((l) => [l.id, l.make(cats, lang)]));
}
