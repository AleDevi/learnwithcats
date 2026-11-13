// Writes cats in any of the five languages: the cat language, Python,
// JavaScript, C and C++. Every output line remembers which line of the
// program it comes from, so the page can highlight matching lines.

import { PROPERTY_ORDER, ADVANCED, ADVANCED_ORDER, keywordWord, valueWord } from './words.js';

const NAMES = {
  en: { Cat: 'Cat', world: 'world', add: 'add', name: 'name', meow: 'meow', catMeow: 'cat_meow', rest: 'everything else is picked from the name', only: 'only in real languages', says: 'says' },
  it: { Cat: 'Gatto', world: 'mondo', add: 'aggiungi', name: 'nome', meow: 'miagola', catMeow: 'gatto_miagola', rest: 'il resto lo sceglie il nome', only: 'solo nei linguaggi veri', says: 'dice' },
};

const TYPE_NAMES = {
  en: { species: 'Species', sex: 'Sex', colors: 'Color', pattern: 'Pattern', eyes: 'Eyes', ears: 'Ears', mouth: 'Mouth', tail: 'Tail', body: 'Body', eye_color: 'EyeColor', tabby_type: 'TabbyType', collar: 'Collar' },
  it: { species: 'Specie', sex: 'Sesso', colors: 'Colore', pattern: 'Motivo', eyes: 'Occhi', ears: 'Orecchie', mouth: 'Muso', tail: 'Coda', body: 'Corpo', eye_color: 'ColoreOcchi', tabby_type: 'TipoTigratura', collar: 'Collare' },
};

const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const constant = (word) => plain(word).toUpperCase().replace(/[^A-Z0-9]+/g, '_');
const pascal = (word) =>
  plain(word)
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');
const quote = (s) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

export function variable(name) {
  const v = plain(name).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
  return /^[0-9]/.test(v) ? `cat_${v}` : v || 'cat';
}

function enumWord(key, id, ui, advanced) {
  return advanced ? ADVANCED[key].values[id][ui] : valueWord(key, id, ui);
}

// One value written the way `lang` writes it.
export function valueCode(lang, key, value, ui, advanced = false) {
  if (Array.isArray(value)) {
    const items = value.map((v) => valueCode(lang, key, v, ui, advanced));
    if (lang === 'cat') return items.join(', ');
    return lang === 'python' || lang === 'javascript' ? `[${items.join(', ')}]` : `{ ${items.join(', ')} }`;
  }
  const type = advanced ? ADVANCED[key].type : 'enum';
  if (type === 'bool') return lang === 'python' ? (value ? 'True' : 'False') : String(value);
  if (type === 'number' || type === 'int') return String(value);
  const word = enumWord(key, value, ui, advanced);
  if (lang === 'cat') return word;
  if (lang === 'python' || lang === 'javascript') return quote(word);
  if (lang === 'c') return constant(word);
  return `${TYPE_NAMES[ui][key]}::${pascal(word)}`;
}

export function fieldName(lang, key, ui, advanced) {
  if (!advanced) return keywordWord(key, ui);
  const names = ADVANCED[key][ui];
  return lang === 'javascript' || lang === 'cpp' ? names.camel : names.snake;
}

function fieldsOf(cat) {
  const basic = PROPERTY_ORDER.filter((k) => cat.props[k]).map((k) => ({ key: k, advanced: false, ...cat.props[k] }));
  const adv = ADVANCED_ORDER.filter((k) => cat.adv && cat.adv[k]).map((k) => ({ key: k, advanced: true, ...cat.adv[k] }));
  return [...basic, ...adv];
}

function catLanguage(cats, ui) {
  const N = NAMES[ui];
  const out = [];
  cats.forEach((cat, i) => {
    if (i) out.push({ text: '', src: null });
    out.push({ text: `${keywordWord('cat', ui)} ${cat.name}`, src: cat.line });
    for (const f of fieldsOf(cat)) {
      const label = f.advanced ? ADVANCED[f.key][ui].label : keywordWord(f.key, ui);
      const text = `${f.advanced ? '  # ' : '  '}${label}: ${valueCode('cat', f.key, f.value, ui, f.advanced)}${f.advanced ? `  (${N.only})` : ''}`;
      out.push({ text, src: f.line });
    }
    for (const a of cat.actions || []) out.push({ text: `  # ${cat.name} ${N.says}: "${a.text}"  (${N.only})`, src: a.line });
  });
  return out;
}

function python(cats, ui) {
  const N = NAMES[ui];
  const out = [];
  cats.forEach((cat, i) => {
    const v = cat.varName || variable(cat.name);
    if (i) out.push({ text: '', src: null });
    out.push({ text: `# ${N.rest}`, src: null });
    out.push({ text: `${v} = ${N.Cat}(`, src: cat.line });
    out.push({ text: `    ${N.name}=${quote(cat.name)},`, src: cat.line });
    for (const f of fieldsOf(cat)) {
      out.push({ text: `    ${fieldName('python', f.key, ui, f.advanced)}=${valueCode('python', f.key, f.value, ui, f.advanced)},`, src: f.line });
    }
    out.push({ text: ')', src: cat.line });
    if (cat.added !== false) out.push({ text: `${N.world}.${N.add}(${v})`, src: cat.addLine ?? cat.line });
    for (const a of cat.actions || []) out.push({ text: `${v}.${N.meow}(${quote(a.text)})`, src: a.line });
  });
  return out;
}

function javascript(cats, ui) {
  const N = NAMES[ui];
  const out = [];
  cats.forEach((cat, i) => {
    const v = cat.varName || variable(cat.name);
    if (i) out.push({ text: '', src: null });
    out.push({ text: `// ${N.rest}`, src: null });
    out.push({ text: `const ${v} = new ${N.Cat}({`, src: cat.line });
    out.push({ text: `  ${N.name}: ${quote(cat.name)},`, src: cat.line });
    for (const f of fieldsOf(cat)) {
      out.push({ text: `  ${fieldName('javascript', f.key, ui, f.advanced)}: ${valueCode('javascript', f.key, f.value, ui, f.advanced)},`, src: f.line });
    }
    out.push({ text: '});', src: cat.line });
    if (cat.added !== false) out.push({ text: `${N.world}.${N.add}(${v});`, src: cat.addLine ?? cat.line });
    for (const a of cat.actions || []) out.push({ text: `${v}.${N.meow}(${quote(a.text)});`, src: a.line });
  });
  return out;
}

function c(cats, ui) {
  const N = NAMES[ui];
  const out = [];
  cats.forEach((cat, i) => {
    const v = cat.varName || variable(cat.name);
    if (i) out.push({ text: '', src: null });
    out.push({ text: `/* ${N.rest} */`, src: null });
    out.push({ text: `${N.Cat} ${v} = {`, src: cat.line });
    out.push({ text: `    .${N.name} = ${quote(cat.name)},`, src: cat.line });
    for (const f of fieldsOf(cat)) {
      out.push({ text: `    .${fieldName('c', f.key, ui, f.advanced)} = ${valueCode('c', f.key, f.value, ui, f.advanced)},`, src: f.line });
    }
    out.push({ text: '};', src: cat.line });
    if (cat.added !== false) out.push({ text: `${N.world}_${N.add}(&${N.world}, &${v});`, src: cat.addLine ?? cat.line });
    for (const a of cat.actions || []) out.push({ text: `${N.catMeow}(&${v}, ${quote(a.text)});`, src: a.line });
  });
  return out;
}

function cpp(cats, ui) {
  const N = NAMES[ui];
  const out = [];
  cats.forEach((cat, i) => {
    const v = cat.varName || variable(cat.name);
    if (i) out.push({ text: '', src: null });
    out.push({ text: `// ${N.rest}`, src: null });
    out.push({ text: `${N.Cat} ${v}(${quote(cat.name)});`, src: cat.line });
    for (const f of fieldsOf(cat)) {
      out.push({ text: `${v}.${fieldName('cpp', f.key, ui, f.advanced)} = ${valueCode('cpp', f.key, f.value, ui, f.advanced)};`, src: f.line });
    }
    if (cat.added !== false) out.push({ text: `${N.world}.${N.add}(${v});`, src: cat.addLine ?? cat.line });
    for (const a of cat.actions || []) out.push({ text: `${v}.${N.meow}(${quote(a.text)});`, src: a.line });
  });
  return out;
}

export const LANGUAGES = [
  { id: 'cat', label: 'Cat', make: catLanguage },
  { id: 'python', label: 'Python', make: python },
  { id: 'javascript', label: 'JavaScript', make: javascript },
  { id: 'c', label: 'C', make: c },
  { id: 'cpp', label: 'C++', make: cpp },
];

export const REAL_LANGUAGES = ['python', 'javascript', 'c', 'cpp'];

export function translate(cats, ui) {
  return Object.fromEntries(LANGUAGES.map((l) => [l.id, l.make(cats, ui)]));
}

// The program text in another language, ready to put in the editor.
export function programIn(cats, lang, ui) {
  const lines = LANGUAGES.find((l) => l.id === lang).make(cats, ui).map((l) => l.text);
  return `${lines.join('\n')}\n`;
}
