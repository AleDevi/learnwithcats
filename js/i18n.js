// Interface text in English (default) and Italian.

import { KEYWORDS, VALUES, ADVANCED, findKeyword, findValue, keywordWord, valueWord } from './words.js';

const LANG_LABEL = { cat: 'Cat', python: 'Python', javascript: 'JavaScript', c: 'C', cpp: 'C++' };

export const UI = {
  en: {
    tagline: 'Write a cat. Watch it come alive. See it in real code.',
    program: 'Your program',
    examples: 'Examples',
    pickExample: 'Load an example…',
    stage: 'Your cats',
    realCode: 'The same cats in real languages',
    codeHint: 'Lines that just changed light up. Click a line of your program to see where it went.',
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
    footer: 'A prototype. Cats live a few real days in the square, have kittens, and then rest in the cemetery.',
    world: 'The square',
    worldHint: 'Cats from everyone who plays. They grow old in real days, sometimes have kittens, and then rest in the cemetery.',
    square: 'Square',
    cemetery: 'Cemetery',
    toWorld: 'Put in the square',
    playerName: 'Your name in the square',
    playerNamePlaceholder: 'e.g. Ale',
    localMode: 'Preview: this square lives only in your browser, with a few pretend neighbours. On the real site everyone shares the same square.',
    sharedMode: 'Shared square: everyone who plays sees these cats.',
    loadingWorld: 'Opening the square…',
    livingTitle: 'Living cats',
    nobodyHere: 'Nobody in the square yet. Write a cat, run it and put it here!',
    emptyCemetery: 'No tombstones yet.',
    yours: 'yours',
    by: (name) => `by ${name}`,
    dayOf: (d, n) => `day ${d} of ${n}`,
    kitten: 'kitten',
    adult: 'adult',
    old: 'old',
    kittenOf: (m, f) => `kitten of ${m} and ${f}`,
    someone: 'someone',
    report: 'Report',
    reportConfirm: (name) => `Report the name "${name}" as offensive? After a few reports it disappears.`,
    reported: 'Thank you: the cat was reported and you won\'t see it again.',
    added: (names) => `${names} ${names.includes(',') ? 'are' : 'is'} in the square now!`,
    needName: 'Write your name in the square first (below the square).',
    runBeforeWorld: 'Run your program first, then put your cats in the square.',
    yourCount: (n, max) => `You have ${n} of ${max} living cats in the square. Kittens don't count.`,
    born: 'born',
    died: 'died',
    rip: 'R.I.P.',
    newKittens: (mother, names) => `${mother} had kittens: ${names}!`,
    writeIn: 'Write in',
    run: '▶ Run',
    ran: 'Ran without errors.',
    runFirst: 'Fix the errors first, then run.',
    switchBlocked: 'Fix the errors first, then switch language: I translate only programs that work.',
    mastery: 'Mastery',
    masteryHint: 'Write cats in a real language and press Run. 5 cats and 5 different advanced options master a language and unlock its feline.',
    cats: 'cats',
    options: 'options',
    mastered: 'mastered!',
    unlocked: 'Unlocked',
    lockedFeline: 'Locked',
    allFour: 'all four',
    advancedTitle: 'Only in real languages',
    speciesTitle: 'Special felines (once unlocked)',
    newMastery: (lang) => `You mastered ${LANG_LABEL[lang]}!`,
    newFeline: (s) => `New feline unlocked: ${VALUES.species[s].en}. Try "species".`,
  },
  it: {
    tagline: 'Scrivi un gatto. Guardalo prendere vita. Vedilo in codice vero.',
    program: 'Il tuo programma',
    examples: 'Esempi',
    pickExample: 'Carica un esempio…',
    stage: 'I tuoi gatti',
    realCode: 'Gli stessi gatti nei linguaggi veri',
    codeHint: 'Le righe appena cambiate si illuminano. Clicca una riga del tuo programma per vedere dove è finita.',
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
    footer: 'Un prototipo. I gatti vivono qualche giorno vero nella piazza, fanno i gattini e poi riposano nel cimitero.',
    world: 'La piazza',
    worldHint: 'I gatti di tutti quelli che giocano. Invecchiano in giorni veri, a volte fanno i gattini e poi riposano nel cimitero.',
    square: 'Piazza',
    cemetery: 'Cimitero',
    toWorld: 'Metti nella piazza',
    playerName: 'Il tuo nome nella piazza',
    playerNamePlaceholder: 'per esempio Ale',
    localMode: 'Anteprima: questa piazza vive solo nel tuo browser, con qualche vicino immaginario. Sul sito vero tutti condividono la stessa piazza.',
    sharedMode: 'Piazza condivisa: chiunque giochi vede questi gatti.',
    loadingWorld: 'Apro la piazza…',
    livingTitle: 'Gatti vivi',
    nobodyHere: 'Ancora nessuno nella piazza. Scrivi un gatto, eseguilo e mettilo qui!',
    emptyCemetery: 'Ancora nessuna lapide.',
    yours: 'tuo',
    by: (name) => `di ${name}`,
    dayOf: (d, n) => `giorno ${d} di ${n}`,
    kitten: 'cucciolo',
    adult: 'adulto',
    old: 'anziano',
    kittenOf: (m, f) => `figlio di ${m} e ${f}`,
    someone: 'qualcuno',
    report: 'Segnala',
    reportConfirm: (name) => `Segnalare il nome "${name}" come offensivo? Dopo alcune segnalazioni sparisce.`,
    reported: 'Grazie: il gatto è stato segnalato e non lo vedrai più.',
    added: (names) => `${names} ${names.includes(',') ? 'sono' : 'è'} nella piazza!`,
    needName: 'Prima scrivi il tuo nome nella piazza (sotto la piazza).',
    runBeforeWorld: 'Prima esegui il programma, poi metti i gatti nella piazza.',
    yourCount: (n, max) => `Hai ${n} gatti vivi su ${max} nella piazza. I gattini non contano.`,
    born: 'nato',
    died: 'morto',
    rip: 'R.I.P.',
    newKittens: (mother, names) => `${mother} ha avuto i gattini: ${names}!`,
    writeIn: 'Scrivi in',
    run: '▶ Esegui',
    ran: 'Eseguito senza errori.',
    runFirst: 'Prima correggi gli errori, poi esegui.',
    switchBlocked: 'Prima correggi gli errori, poi cambia linguaggio: traduco solo programmi che funzionano.',
    mastery: 'Padronanza',
    masteryHint: 'Scrivi gatti in un linguaggio vero e premi Esegui. 5 gatti e 5 opzioni avanzate diverse ti fanno padroneggiare un linguaggio e sbloccano il suo felino.',
    cats: 'gatti',
    options: 'opzioni',
    mastered: 'padroneggiato!',
    unlocked: 'Sbloccato',
    lockedFeline: 'Bloccato',
    allFour: 'tutti e quattro',
    advancedTitle: 'Solo nei linguaggi veri',
    speciesTitle: 'Felini speciali (una volta sbloccati)',
    newMastery: (lang) => `Hai padroneggiato ${LANG_LABEL[lang]}!`,
    newFeline: (s) => `Nuovo felino sbloccato: ${VALUES.species[s].it}. Prova "specie".`,
  },
};

const kw = (id, lang) => keywordWord(id, lang);
const table = (p) => (p.advanced ? ADVANCED[p.key].values : VALUES[p.key]);
const label = (p, lang) => (p.advanced || ADVANCED[p.key] ? ADVANCED[p.key][lang].label : kw(p.key, lang));
const species = (s, lang) => VALUES.species[s][lang];
const langList = (langs, lang) => langs.map((l) => LANG_LABEL[l]).join(lang === 'it' ? ', ' : ', ');
const sug = (p, lang) => (p.suggestion ? (lang === 'it' ? ` Forse intendevi "${p.suggestion}"?` : ` Did you mean "${p.suggestion}"?`) : '');

// Error and note messages. Each function gets the message params and the language.
export const MESSAGES = {
  blocked_name: {
    en: (p) => (p.what === 'player' ? 'Please pick another player name: that one is not kind to people.' : 'Please pick another name: that one is not kind to people.'),
    it: (p) => (p.what === 'player' ? 'Scegli un altro nome da giocatore: quello non è gentile con le persone.' : 'Scegli un altro nome: quello non è gentile con le persone.'),
  },
  too_many_living: {
    en: (p) => `You already have ${p.living} of ${p.max} living cats in the square. When one of them rests in the cemetery, there is room for a new one.`,
    it: (p) => `Hai già ${p.living} gatti vivi su ${p.max} nella piazza. Quando uno riposa nel cimitero, c'è posto per uno nuovo.`,
  },
  name_taken: {
    en: (p) => `There is already a living cat called ${p.name} in the square. Try another name.`,
    it: (p) => `Nella piazza c'è già un gatto vivo che si chiama ${p.name}. Prova un altro nome.`,
  },
  slow_down: {
    en: () => 'That is a lot of cats for one day. Try again tomorrow.',
    it: () => 'Sono tanti gatti per un giorno solo. Riprova domani.',
  },
  world_full: {
    en: () => 'The square is full. Try again when some cats rest in the cemetery.',
    it: () => 'La piazza è piena. Riprova quando qualche gatto riposa nel cimitero.',
  },
  network: {
    en: () => 'I can\'t reach the square right now. Check the connection and try again.',
    it: () => 'Ora non riesco a raggiungere la piazza. Controlla la connessione e riprova.',
  },
  server: {
    en: () => 'Something went wrong in the square. Try again in a moment.',
    it: () => 'Qualcosa è andato storto nella piazza. Riprova tra un momento.',
  },
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
      `"${p.word}" is not a ${label(p, 'en')} value.` +
      (p.suggestion ? ` Did you mean "${p.suggestion}"?` : '') +
      ` You can use: ${Object.values(table(p)).map((v) => v.en).join(', ')}.`,
    it: (p) =>
      `"${p.word}" non è un valore valido per ${label(p, 'it')}.` +
      (p.suggestion ? ` Forse intendevi "${p.suggestion}"?` : '') +
      ` Puoi usare: ${Object.values(table(p)).map((v) => v.it).join(', ')}.`,
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
  only_real_languages: {
    en: (p) => `"${ADVANCED[p.key].en.label}" is an advanced option: it only works in real languages. Pick Python, JavaScript, C or C++ above the editor.`,
    it: (p) => `"${ADVANCED[p.key].it.label}" è un'opzione avanzata: funziona solo nei linguaggi veri. Scegli Python, JavaScript, C o C++ sopra l'editor.`,
  },
  species_locked: {
    en: (p) => `The ${species(p.species, 'en')} is still locked. Master ${p.langs.length > 1 ? 'all four languages' : langList(p.langs, 'en')} to unlock it.`,
    it: (p) => `Il felino "${species(p.species, 'it')}" è ancora bloccato. Padroneggia ${p.langs.length > 1 ? 'tutti e quattro i linguaggi' : langList(p.langs, 'it')} per sbloccarlo.`,
  },
  species_coat: {
    en: (p) => `A ${species(p.species, 'en')} has its own coat, so the colours are ignored. Its genes still decide sex and lifespan.`,
    it: (p) => `Il felino "${species(p.species, 'it')}" ha il suo mantello, quindi i colori vengono ignorati. I geni decidono comunque sesso e durata della vita.`,
  },
  tabby_type_hidden: {
    en: () => `The tabby type only shows on tabby cats. This cat is solid, so you won't see it.`,
    it: () => `Il tipo di tigratura si vede solo sui gatti tigrati. Questo gatto è a tinta unita, quindi non si vede.`,
  },
  expected: {
    en: (p) => `I expected ${p.expected} here, but found ${p.found}.`,
    it: (p) => `Qui mi aspettavo ${p.expected}, ma ho trovato ${p.found === 'the end' ? 'la fine' : p.found}.`,
  },
  missing_semicolon: {
    en: () => `Missing ";" at the end of this line. In C and C++ every statement ends with a semicolon.`,
    it: () => `Manca ";" alla fine di questa riga. In C e C++ ogni istruzione finisce con un punto e virgola.`,
  },
  needs_quotes: {
    en: (p) => `${p.word} needs quotes: "${p.word}". Without quotes the computer looks for a variable called ${p.word}.`,
    it: (p) => `${p.word} vuole le virgolette: "${p.word}". Senza virgolette il computer cerca una variabile chiamata ${p.word}.`,
  },
  wrong_form: {
    en: (p) => `In ${LANG_LABEL[p.lang]}, ${label(p, 'en')} is written like this: ${p.example}.`,
    it: (p) => `In ${LANG_LABEL[p.lang]}, ${label(p, 'it')} si scrive così: ${p.example}.`,
  },
  unknown_field: {
    en: (p) => `A cat has no property called "${p.word}".` + sug(p, 'en'),
    it: (p) => `Un gatto non ha una proprietà chiamata "${p.word}".` + sug(p, 'it'),
  },
  expected_list: {
    en: (p) => `Colours are a list, even if there is only one: ${p.example}.`,
    it: (p) => `I colori sono una lista, anche se ce n'è uno solo: ${p.example}.`,
  },
  empty_colors: {
    en: () => `The list of colours is empty.`,
    it: () => `La lista dei colori è vuota.`,
  },
  wrong_type: {
    en: (p) => `${label(p, 'en')} needs ${{ bool: 'true or false', int: 'a whole number', number: 'a number' }[p.type]}.`,
    it: (p) => `${label(p, 'it')} vuole ${{ bool: 'vero o falso (true/false)', int: 'un numero intero', number: 'un numero' }[p.type]}.`,
  },
  out_of_range: {
    en: (p) => `${label(p, 'en')} must be between ${p.min} and ${p.max}.`,
    it: (p) => `${label(p, 'it')} deve essere tra ${p.min} e ${p.max}.`,
  },
  python_bool: {
    en: (p) => `In Python, true and false start with a capital letter: True, False (you wrote ${p.word}).`,
    it: (p) => `In Python vero e falso si scrivono con la maiuscola: True, False (hai scritto ${p.word}).`,
  },
  lower_bool: {
    en: (p) => `Here true and false are lowercase: true, false (you wrote ${p.word}). The capital letters are Python's.`,
    it: (p) => `Qui vero e falso sono minuscoli: true, false (hai scritto ${p.word}). Le maiuscole sono di Python.`,
  },
  name_fixed: {
    en: () => `A cat's name is given when it is created and can't change later.`,
    it: () => `Il nome di un gatto si dà quando nasce e non può cambiare dopo.`,
  },
  name_string: {
    en: () => `The name is text, so it goes in double quotes: "Luna".`,
    it: () => `Il nome è un testo, quindi va tra virgolette doppie: "Luna".`,
  },
  duplicate_name: {
    en: (p) => `There is already a cat called ${p.name}. Every cat needs its own name.`,
    it: (p) => `C'è già un gatto che si chiama ${p.name}. Ogni gatto vuole un nome suo.`,
  },
  redeclared: {
    en: (p) => `The variable ${p.name} already exists. Use another name for the new cat.`,
    it: (p) => `La variabile ${p.name} esiste già. Usa un altro nome per il nuovo gatto.`,
  },
  missing_name_field: {
    en: () => `This cat has no name. Add name="…" (or .name = "…" in C).`,
    it: () => `Questo gatto non ha un nome. Aggiungi nome="…" (o .nome = "…" in C).`,
  },
  unknown_variable: {
    en: (p) => `There is no cat called ${p.name} yet. A variable must be created before it is used.` + sug(p, 'en'),
    it: (p) => `Non esiste ancora un gatto chiamato ${p.name}. Una variabile va creata prima di usarla.` + sug(p, 'it'),
  },
  already_added: {
    en: (p) => `${p.name} is already in the world.`,
    it: (p) => `${p.name} è già nel mondo.`,
  },
  meow_string: {
    en: () => `What a cat says is text, so it goes in quotes.`,
    it: () => `Quello che dice un gatto è un testo, quindi va tra virgolette.`,
  },
  unknown_method: {
    en: (p) => `I don't know the method ${p.name}.` + sug(p, 'en'),
    it: (p) => `Non conosco il metodo ${p.name}.` + sug(p, 'it'),
  },
  unknown_function: {
    en: (p) => `I don't know the function ${p.name}.` + sug(p, 'en'),
    it: (p) => `Non conosco la funzione ${p.name}.` + sug(p, 'it'),
  },
  missing_new: {
    en: () => `In JavaScript you create an object with "new": new Cat({ … }).`,
    it: () => `In JavaScript un oggetto si crea con "new": new Gatto({ … }).`,
  },
  python_colon: {
    en: () => `In Python, inside Cat( … ) you write name="value" with "=", not ":".`,
    it: () => `In Python, dentro Gatto( … ) si scrive nome="valore" con "=", non ":".`,
  },
  unknown_statement: {
    en: (p) => `I don't understand what starts with ${p.found}.`,
    it: (p) => `Non capisco l'istruzione che comincia con ${p.found}.`,
  },
  not_added: {
    en: (p) => `${p.name} exists but is not in the world yet: add it with ${p.lang === 'c' ? 'world_add(&world, &…);' : 'world.add(…)'}.`,
    it: (p) => `${p.name} esiste ma non è ancora nel mondo: aggiungilo con ${p.lang === 'c' ? 'mondo_aggiungi(&mondo, &…);' : 'mondo.aggiungi(…)'}.`,
  },
  hash_comment: {
    en: (p) => `In ${LANG_LABEL[p.lang]} comments start with //, not #.`,
    it: (p) => `In ${LANG_LABEL[p.lang]} i commenti cominciano con //, non con #.`,
  },
  c_single_quotes: {
    en: () => `In C and C++ text goes in double quotes "…". Single quotes are for one character only.`,
    it: () => `In C e C++ il testo va tra virgolette doppie "…". Gli apici singoli servono per un carattere solo.`,
  },
  unterminated_string: {
    en: () => `This text is missing its closing quote.`,
    it: () => `A questo testo manca la virgoletta di chiusura.`,
  },
  unexpected_char: {
    en: (p) => `I don't know what "${p.char}" means here.`,
    it: (p) => `Non so cosa significhi "${p.char}" qui.`,
  },
};

export function message(entry, lang) {
  const m = MESSAGES[entry.code];
  return m ? m[lang](entry.params || {}) : entry.code;
}

export function coatName(cat, lang) {
  if (cat.species) return species(cat.species, lang);
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
  {
    id: 'dressed',
    lang: 'python',
    real: true,
    label: { en: 'Luna dressed up (advanced)', it: 'Luna elegante (avanzato)' },
    code: `luna = Cat(\n    name="Luna",\n    sex="female",\n    colors=["orange", "black", "white"],\n    eye_color="odd",\n    collar="red",\n    bell=True,\n    hat=True,\n)\nworld.add(luna)\nluna.meow("hello!")\n`,
  },
  {
    id: 'lazy',
    lang: 'python',
    real: true,
    label: { en: 'A big lazy friendly cat (advanced)', it: 'Un gattone pigro e socievole (avanzato)' },
    code: `bruno = Cat(\n    name="Bruno",\n    colors=["grey", "white"],\n    weight=8.5,\n    speed=1,\n    sleepiness=5,\n    friendliness=5,\n)\nworld.add(bruno)\n\nmimi = Cat(\n    name="Mimi",\n    colors=["black"],\n    pattern="tabby",\n    tabby_type="spotted",\n    weight=3,\n    speed=5,\n    bow=True,\n)\nworld.add(mimi)\nmimi.meow("wake up!")\n`,
  },
  {
    id: 'bug-python',
    lang: 'python',
    only: 'python',
    label: { en: 'Find the bug (Python)', it: "Trova l'errore (Python)" },
    code: `felix = Cat(\n    name="Felix",\n    colors=["black", "white"],\n    bell=true,\n)\nworld.add(felix)\n`,
  },
  {
    id: 'bug-js',
    lang: 'javascript',
    only: 'javascript',
    label: { en: 'Find the bug (JavaScript)', it: "Trova l'errore (JavaScript)" },
    code: `const felix = new Cat({\n  name: "Felix",\n  colors: ["black", "white"],\n  eyeColor: "green",\n});\nworld.add(felx);\n`,
  },
  {
    id: 'bug-c',
    lang: 'c',
    only: 'c',
    label: { en: 'Find the bug (C)', it: "Trova l'errore (C)" },
    code: `Cat felix = {\n    .name = "Felix",\n    .colors = { BLACK, WHITE },\n    .bell = true,\n}\nworld_add(&world, &felix);\n`,
  },
  {
    id: 'bug-cpp',
    lang: 'cpp',
    only: 'cpp',
    label: { en: 'Find the bug (C++)', it: "Trova l'errore (C++)" },
    code: `Cat felix("Felix");\nfelix.colors = { Color::Black, Color::White };\nfelix.eyeColor = "green";\nworld.add(felix);\n`,
  },
];

export function exampleCode(example, lang) {
  return lang === 'en' ? example.code : translateProgram(example.code, lang);
}

export { KEYWORDS, VALUES };
