// Interface text in English (default) and Italian.

import { KEYWORDS, VALUES, findKeyword, findValue, keywordWord, valueWord } from './words.js';

export const UI = {
  en: {
    tagline: 'Write a cat. Watch it come alive. See it in real code.',
    program: 'Your program',
    examples: 'Examples',
    pickExample: 'Load an example…',
    stage: 'Your cats',
    realCode: 'The same cats in real languages',
    problems: 'Messages',
    allGood: 'No problems: your cats are ready.',
    line: 'Line',
    sex: 'Sex',
    coat: 'Coat',
    dna: 'DNA',
    lifespan: 'Lifespan',
    days: 'days',
    cheatsheet: 'Words you can use',
    cheatsheetHint: 'Anything you leave out is picked from the cat\'s name: the same name always gives the same cat.',
    female: 'female',
    male: 'male',
    noCats: 'Write a cat on the left to see it here.',
    footer: 'A prototype. The shared world, kittens and the cemetery come next.',
  },
  it: {
    tagline: 'Scrivi un gatto. Guardalo prendere vita. Vedilo in codice vero.',
    program: 'Il tuo programma',
    examples: 'Esempi',
    pickExample: 'Carica un esempio…',
    stage: 'I tuoi gatti',
    realCode: 'Gli stessi gatti nei linguaggi veri',
    problems: 'Messaggi',
    allGood: 'Nessun problema: i tuoi gatti sono pronti.',
    line: 'Riga',
    sex: 'Sesso',
    coat: 'Mantello',
    dna: 'DNA',
    lifespan: 'Durata della vita',
    days: 'giorni',
    cheatsheet: 'Parole che puoi usare',
    cheatsheetHint: 'Quello che non scrivi lo sceglie il nome del gatto: lo stesso nome dà sempre lo stesso gatto.',
    female: 'femmina',
    male: 'maschio',
    noCats: 'Scrivi un gatto a sinistra per vederlo qui.',
    footer: 'Un prototipo. Il mondo condiviso, i gattini e il cimitero arrivano dopo.',
  },
};

const kw = (id, lang) => keywordWord(id, lang);

// Error and note messages. Each function gets the message params and the language.
export const MESSAGES = {
  missing_name: {
    en: () => `A cat needs a name: write it after "cat", like "cat Luna".`,
    it: () => `Un gatto ha bisogno di un nome: scrivilo dopo "gatto", per esempio "gatto Luna".`,
  },
  bad_name: {
    en: (p) => `"${p.name}" can't be a name. Use letters, numbers and spaces, up to 20 characters.`,
    it: (p) => `"${p.name}" non può essere un nome. Usa lettere, numeri e spazi, fino a 20 caratteri.`,
  },
  too_many_cats: {
    en: (p) => `You can have up to ${p.max} cats at a time.`,
    it: (p) => `Puoi avere al massimo ${p.max} gatti alla volta.`,
  },
  missing_colon: {
    en: (p) => `"${p.word}" needs a colon and a value, like "${p.word}: …".`,
    it: (p) => `"${p.word}" vuole i due punti e un valore, per esempio "${p.word}: …".`,
  },
  unknown_line: {
    en: (p) => `I don't understand "${p.text}".` + (p.suggestion ? ` Did you mean "${p.suggestion}"?` : ''),
    it: (p) => `Non capisco "${p.text}".` + (p.suggestion ? ` Forse intendevi "${p.suggestion}"?` : ''),
  },
  unknown_keyword: {
    en: (p) => `I don't know "${p.word}".` + (p.suggestion ? ` Did you mean "${p.suggestion}"?` : ''),
    it: (p) => `Non conosco "${p.word}".` + (p.suggestion ? ` Forse intendevi "${p.suggestion}"?` : ''),
  },
  no_cat_yet: {
    en: () => `This property doesn't belong to any cat yet. Start with "cat Name".`,
    it: () => `Questa proprietà non appartiene ancora a nessun gatto. Comincia con "gatto Nome".`,
  },
  duplicate_property: {
    en: (p) => `"${kw(p.key, 'en')}" is already set on line ${p.first}.`,
    it: (p) => `"${kw(p.key, 'it')}" è già scritto alla riga ${p.first}.`,
  },
  missing_value: {
    en: (p) => `"${kw(p.key, 'en')}" needs a value after the colon.`,
    it: (p) => `"${kw(p.key, 'it')}" vuole un valore dopo i due punti.`,
  },
  unknown_value: {
    en: (p) =>
      `"${p.word}" is not a ${kw(p.key, 'en')} value.` +
      (p.suggestion ? ` Did you mean "${p.suggestion}"?` : '') +
      ` You can use: ${Object.values(VALUES[p.key]).map((v) => v.en).join(', ')}.`,
    it: (p) =>
      `"${p.word}" non è un valore valido per ${kw(p.key, 'it')}.` +
      (p.suggestion ? ` Forse intendevi "${p.suggestion}"?` : '') +
      ` Puoi usare: ${Object.values(VALUES[p.key]).map((v) => v.it).join(', ')}.`,
  },
  too_many_colors: {
    en: () => `A cat can have at most 3 colours.`,
    it: () => `Un gatto può avere al massimo 3 colori.`,
  },
  empty_program: {
    en: () => `The program is empty. Start with "cat Name".`,
    it: () => `Il programma è vuoto. Comincia con "gatto Nome".`,
  },
  white_only: {
    en: () => `In this game a cat needs at least one colour besides white: orange, black, grey or cream.`,
    it: () => `In questo gioco un gatto ha bisogno di almeno un colore oltre al bianco: arancione, nero, grigio o crema.`,
  },
  mixed_dilution: {
    en: () =>
      `Genetics: grey and cream come from the dilution gene, which lightens the whole coat. A cat can't be black or orange and also grey or cream. Try "black, orange" or "grey, cream".`,
    it: () =>
      `Genetica: grigio e crema vengono dal gene della diluizione, che schiarisce tutto il mantello. Un gatto non può essere nero o arancione e insieme grigio o crema. Prova "nero, arancione" oppure "grigio, crema".`,
  },
  male_tortie: {
    en: () =>
      `Genetics: the orange gene is on the X chromosome. A male has only one X, so he is orange OR black-based, never both. Only females can be tortoiseshell or calico.`,
    it: () =>
      `Genetica: il gene dell'arancione sta sul cromosoma X. Un maschio ha una sola X, quindi è arancione OPPURE a base nera, mai tutti e due. Solo le femmine possono essere tartarugate o calico.`,
  },
  tortie_is_female: {
    en: () => `Orange and black together: this cat must be female, so I made her one.`,
    it: () => `Arancione e nero insieme: questa gatta deve essere femmina, quindi l'ho fatta femmina.`,
  },
  orange_always_tabby: {
    en: () => `Fun fact: orange and cream cats always show tabby stripes, even with the solid gene.`,
    it: () => `Curiosità: i gatti arancioni e crema mostrano sempre le strisce, anche con il gene della tinta unita.`,
  },
};

export function message(entry, lang) {
  const m = MESSAGES[entry.code];
  return m ? m[lang](entry.params || {}) : entry.code;
}

export function coatName(cat, lang) {
  const { coat } = cat;
  const words = coat.colors.map((c) => valueWord('colors', c, lang));
  const parts = [];
  if (coat.calico) parts.push(lang === 'it' ? 'calico' : 'calico');
  else if (coat.tortie) parts.push(lang === 'it' ? 'tartarugata' : 'tortoiseshell');
  else parts.push(words[0]);
  if (coat.tabby) parts.push(lang === 'it' ? 'tigrato' : 'tabby');
  if (coat.white && !coat.calico) parts.push(lang === 'it' ? 'con bianco' : 'with white');
  const all = coat.calico ? [...words, valueWord('colors', 'white', lang)] : words;
  const and = lang === 'it' ? ' e ' : ' and ';
  const detail = coat.tortie ? ` (${all.slice(0, -1).join(', ')}${and}${all.at(-1)})` : '';
  return parts.join(' ') + detail;
}

// Rewrites a program's keywords and values in the other language.
// Lines it doesn't understand are left exactly as they are.
export function translateProgram(source, lang) {
  return source
    .split('\n')
    .map((line) => {
      const m = line.match(/^(\s*)([^:#]+?)(\s*:\s*)([^#]*?)(\s*(#.*)?)$/);
      if (m) {
        const key = findKeyword(m[2]);
        if (!key || key === 'cat') return line;
        const parts = m[4].split(/\s*,\s*/);
        const translated = parts.map((w) => {
          const id = findValue(key, w);
          return id ? valueWord(key, id, lang) : w;
        });
        return `${m[1]}${kw(key, lang)}${m[3]}${translated.join(', ')}${m[5]}`;
      }
      const c = line.match(/^(\s*)(\S+)(\s+.*)$/);
      if (c && findKeyword(c[2]) === 'cat') return `${c[1]}${kw('cat', lang)}${c[3]}`;
      return line;
    })
    .join('\n');
}

export const EXAMPLES = [
  {
    id: 'luna',
    label: { en: 'Luna, a calico', it: 'Luna, una calico' },
    code: `cat Luna\n  sex: female\n  colors: orange, black, white\n  eyes: happy\n  tail: long\n`,
  },
  {
    id: 'tiger',
    label: { en: 'Tiger, an orange tabby', it: 'Tiger, un rosso tigrato' },
    code: `cat Tiger\n  sex: male\n  colors: orange\n  pattern: tabby\n  body: long\n`,
  },
  {
    id: 'three',
    label: { en: 'Three cats', it: 'Tre gatti' },
    code: `cat Smoke\n  colors: grey\n  pattern: solid\n  eyes: sleepy\n\ncat Biscuit\n  colors: cream, white\n  ears: round\n\ncat Pepper\n  colors: black, white\n  mouth: tongue\n`,
  },
  {
    id: 'random',
    label: { en: 'A cat chosen by its name', it: 'Un gatto scelto dal nome' },
    code: `cat Whiskers\n`,
  },
  {
    id: 'bug',
    label: { en: 'Find the bug: a calico male', it: 'Trova l\'errore: un maschio calico' },
    code: `cat Oscar\n  sex: male\n  colors: orange, black, white\n`,
  },
];

export function exampleCode(example, lang) {
  return lang === 'en' ? example.code : translateProgram(example.code, lang);
}

export { KEYWORDS, VALUES };
