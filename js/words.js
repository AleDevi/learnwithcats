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
  species: { en: 'species', it: 'specie', alias: [] },
};

// Properties in the order they are written in examples and translations.
export const PROPERTY_ORDER = ['species', 'sex', 'colors', 'pattern', 'eyes', 'ears', 'mouth', 'tail', 'body'];

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
  species: {
    cat: { en: 'cat', it: 'gatto', alias: ['house cat', 'gatto di casa'] },
    lion: { en: 'lion', it: 'leone', alias: [] },
    cheetah: { en: 'cheetah', it: 'ghepardo', alias: [] },
    lynx: { en: 'lynx', it: 'lince', alias: [] },
    tiger: { en: 'tiger', it: 'tigre', alias: [] },
    snow_leopard: { en: 'snow leopard', it: 'leopardo delle nevi', alias: ['snowleopard', 'snow_leopard'] },
  },
};

// Which language unlocks which special feline. The snow leopard needs all four.
export const SPECIES_UNLOCK = {
  lion: ['python'],
  cheetah: ['javascript'],
  lynx: ['c'],
  tiger: ['cpp'],
  snow_leopard: ['python', 'javascript', 'c', 'cpp'],
};

// Options that only exist when you write in a real programming language.
// `snake` names are used in Python and C, `camel` names in JavaScript and C++.
export const ADVANCED = {
  eye_color: {
    en: { snake: 'eye_color', camel: 'eyeColor', label: 'eye colour' },
    it: { snake: 'colore_occhi', camel: 'coloreOcchi', label: 'colore degli occhi' },
    type: 'enum',
    values: {
      green: { en: 'green', it: 'verde', alias: [] },
      amber: { en: 'amber', it: 'ambra', alias: [] },
      copper: { en: 'copper', it: 'rame', alias: [] },
      blue: { en: 'blue', it: 'azzurro', alias: ['azzurri'] },
      odd: { en: 'odd', it: 'diversi', alias: ['odd eyed', 'odd-eyed'] },
    },
  },
  tabby_type: {
    en: { snake: 'tabby_type', camel: 'tabbyType', label: 'tabby type' },
    it: { snake: 'tipo_tigratura', camel: 'tipoTigratura', label: 'tipo di tigratura' },
    type: 'enum',
    values: {
      mackerel: { en: 'mackerel', it: 'striato', alias: ['striped'] },
      spotted: { en: 'spotted', it: 'maculato', alias: [] },
      classic: { en: 'classic', it: 'marmorizzato', alias: ['marbled'] },
    },
  },
  weight: {
    en: { snake: 'weight', camel: 'weight', label: 'weight (kg)' },
    it: { snake: 'peso', camel: 'peso', label: 'peso (kg)' },
    type: 'number',
    min: 2,
    max: 9,
  },
  collar: {
    en: { snake: 'collar', camel: 'collar', label: 'collar' },
    it: { snake: 'collare', camel: 'collare', label: 'collare' },
    type: 'enum',
    values: {
      red: { en: 'red', it: 'rosso', alias: [] },
      blue: { en: 'blue', it: 'blu', alias: [] },
      green: { en: 'green', it: 'verde', alias: [] },
      pink: { en: 'pink', it: 'rosa', alias: [] },
      yellow: { en: 'yellow', it: 'giallo', alias: [] },
    },
  },
  bell: {
    en: { snake: 'bell', camel: 'bell', label: 'bell' },
    it: { snake: 'campanello', camel: 'campanello', label: 'campanello' },
    type: 'bool',
  },
  bow: {
    en: { snake: 'bow', camel: 'bow', label: 'bow' },
    it: { snake: 'fiocco', camel: 'fiocco', label: 'fiocco' },
    type: 'bool',
  },
  hat: {
    en: { snake: 'hat', camel: 'hat', label: 'hat' },
    it: { snake: 'cappello', camel: 'cappello', label: 'cappello' },
    type: 'bool',
  },
  speed: {
    en: { snake: 'speed', camel: 'speed', label: 'speed' },
    it: { snake: 'velocita', camel: 'velocita', label: 'velocità' },
    type: 'int',
    min: 1,
    max: 5,
  },
  sleepiness: {
    en: { snake: 'sleepiness', camel: 'sleepiness', label: 'sleepiness' },
    it: { snake: 'sonnolenza', camel: 'sonnolenza', label: 'sonnolenza' },
    type: 'int',
    min: 1,
    max: 5,
  },
  friendliness: {
    en: { snake: 'friendliness', camel: 'friendliness', label: 'friendliness' },
    it: { snake: 'socievolezza', camel: 'socievolezza', label: 'socievolezza' },
    type: 'int',
    min: 1,
    max: 5,
  },
};

export const ADVANCED_ORDER = Object.keys(ADVANCED);

export function findAdvanced(word) {
  const w = word.trim();
  for (const [id, def] of Object.entries(ADVANCED)) {
    for (const lang of ['en', 'it']) {
      if (def[lang].snake === w || def[lang].camel === w || def[lang].snake === w.toLowerCase()) return id;
    }
  }
  return null;
}

export function findAdvancedValue(key, word) {
  const values = ADVANCED[key].values;
  const w = word.trim().toLowerCase().replace(/\s+/g, ' ');
  for (const [id, e] of Object.entries(values)) {
    if (e.en === w || e.it === w || e.alias.includes(w)) return id;
  }
  return null;
}

export function allAdvancedWords() {
  return Object.values(ADVANCED).flatMap((d) => [d.en.snake, d.en.camel, d.it.snake, d.it.camel]);
}

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
