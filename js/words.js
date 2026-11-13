// Keywords and values of the cat language, in English and Italian.
// Each entry has the English word, the Italian word and extra aliases.
// The rest of the code only works with the canonical id (the object key).

export const KEYWORDS = {
  cat: { en: 'cat', it: 'gatto', alias: ['kitty', 'micio'] },
  sex: { en: 'sex', it: 'sesso', alias: [] },
  colors: { en: 'colors', it: 'colori', alias: ['colours', 'color', 'colour', 'colore'] },
  pattern: { en: 'pattern', it: 'motivo', alias: [] },
  eyes: { en: 'eyes', it: 'occhi', alias: [] },
  ears: { en: 'ears', it: 'orecchie', alias: [] },
  mouth: { en: 'mouth', it: 'muso', alias: ['bocca'] },
  tail: { en: 'tail', it: 'coda', alias: [] },
  body: { en: 'body', it: 'corpo', alias: [] },
};

// Properties in the order they are written in examples and translations.
export const PROPERTY_ORDER = ['sex', 'colors', 'pattern', 'eyes', 'ears', 'mouth', 'tail', 'body'];

export const VALUES = {
  sex: {
    female: { en: 'female', it: 'femmina', alias: ['f'] },
    male: { en: 'male', it: 'maschio', alias: ['m'] },
  },
  colors: {
    orange: { en: 'orange', it: 'arancione', alias: ['red', 'ginger', 'rosso', 'rossa'] },
    black: { en: 'black', it: 'nero', alias: ['nera'] },
    grey: { en: 'grey', it: 'grigio', alias: ['gray', 'blue', 'blu', 'grigia'] },
    cream: { en: 'cream', it: 'crema', alias: [] },
    white: { en: 'white', it: 'bianco', alias: ['bianca'] },
  },
  pattern: {
    solid: { en: 'solid', it: 'tinta unita', alias: ['plain', 'unito', 'unita'] },
    tabby: { en: 'tabby', it: 'tigrato', alias: ['striped', 'tigrata', 'a strisce'] },
  },
  eyes: {
    normal: { en: 'normal', it: 'normali', alias: [] },
    happy: { en: 'happy', it: 'felici', alias: [] },
    sleepy: { en: 'sleepy', it: 'assonnati', alias: [] },
    surprised: { en: 'surprised', it: 'sorpresi', alias: [] },
    squint: { en: 'squint', it: 'strizzati', alias: [] },
  },
  ears: {
    pointy: { en: 'pointy', it: 'a punta', alias: [] },
    round: { en: 'round', it: 'tonde', alias: [] },
    folded: { en: 'folded', it: 'piegate', alias: [] },
  },
  mouth: {
    neutral: { en: 'neutral', it: 'neutro', alias: [] },
    smile: { en: 'smile', it: 'sorriso', alias: [] },
    tongue: { en: 'tongue', it: 'linguaccia', alias: [] },
  },
  tail: {
    short: { en: 'short', it: 'corta', alias: [] },
    medium: { en: 'medium', it: 'media', alias: [] },
    long: { en: 'long', it: 'lunga', alias: [] },
  },
  body: {
    small: { en: 'small', it: 'piccolo', alias: [] },
    medium: { en: 'medium', it: 'medio', alias: [] },
    long: { en: 'long', it: 'lungo', alias: [] },
  },
};

const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');

function lookup(table, word) {
  const w = norm(word);
  for (const [id, entry] of Object.entries(table)) {
    if (entry.en === w || entry.it === w || entry.alias.includes(w)) return id;
  }
  return null;
}

export const findKeyword = (word) => lookup(KEYWORDS, word);
export const findValue = (prop, word) => lookup(VALUES[prop], word);

export const keywordWord = (id, lang) => KEYWORDS[id][lang];
export const valueWord = (prop, id, lang) => VALUES[prop][id][lang];

// All words a person could mean, used for "did you mean" suggestions.
export function allWords(table) {
  return Object.values(table).flatMap((e) => [e.en, e.it]);
}
