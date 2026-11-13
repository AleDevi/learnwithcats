import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../js/parser.js';
import { makeCat, drawCat, mirror, drawFace, gridToText } from '../js/cat.js';
import { translate } from '../js/translate.js';
import { translateProgram, EXAMPLES, exampleCode, message } from '../js/i18n.js';

const luna = 'cat Luna\n  sex: female\n  colors: orange, black, white\n  eyes: happy\n  tail: long\n';

test('English and Italian programs give the same cat', () => {
  const en = parse(luna);
  const it = parse('gatto Luna\n  sesso: femmina\n  colori: arancione, nero, bianco\n  occhi: felici\n  coda: lunga\n');
  assert.deepEqual(en, it);
  assert.equal(en.errors.length, 0);
});

test('the same name always gives the same cat', () => {
  const a = makeCat(parse('cat Whiskers').cats[0]);
  const b = makeCat(parse('cat Whiskers').cats[0]);
  assert.equal(a.dna, b.dna);
  assert.deepEqual(a.traits, b.traits);
  assert.equal(gridToText(drawCat(a)), gridToText(drawCat(b)));
});

test('typos get a suggestion', () => {
  const { errors } = parse('cat Luna\n  eyse: happy\n  tail: lnog\n');
  assert.equal(errors[0].code, 'unknown_keyword');
  assert.equal(errors[0].params.suggestion, 'eyes');
  assert.equal(errors[1].code, 'unknown_value');
  assert.equal(errors[1].params.suggestion, 'long');
});

test('a property before any cat is an error', () => {
  assert.equal(parse('eyes: happy').errors[0].code, 'no_cat_yet');
});

test('a calico male is impossible', () => {
  const cat = makeCat(parse('cat Oscar\n sex: male\n colors: orange, black, white').cats[0]);
  assert.equal(cat.errors[0].code, 'male_tortie');
});

test('orange and black without a sex makes a female', () => {
  const cat = makeCat(parse('cat Patch\n colors: black, orange').cats[0]);
  assert.equal(cat.genome.sex, 'female');
  assert.ok(cat.coat.tortie);
  assert.equal(cat.notes[0].code, 'tortie_is_female');
});

test('dilute and dense colours cannot mix', () => {
  const cat = makeCat(parse('cat Mix\n colors: black, cream').cats[0]);
  assert.equal(cat.errors[0].code, 'mixed_dilution');
});

test('the coat follows the genes', () => {
  const grey = makeCat(parse('cat Smoke\n colors: grey\n pattern: solid').cats[0]);
  assert.deepEqual(grey.coat.colors, ['grey']);
  assert.equal(grey.coat.tabby, false);
  assert.match(grey.dna, /\| dd \| aa \| ss \|/);
  const tiger = makeCat(parse('cat Tiger\n sex: male\n colors: orange\n pattern: solid').cats[0]);
  assert.equal(tiger.coat.tabby, true, 'orange cats always look tabby');
  assert.equal(tiger.notes[0].code, 'orange_always_tabby');
  assert.match(tiger.dna, /^XO Y/);
});

test('lifespan is between 6 and 10 days', () => {
  for (const name of ['A', 'B', 'C', 'Dora', 'Eve', 'Felix', 'Gus', 'Hope']) {
    const cat = makeCat(parse(`cat ${name}`).cats[0]);
    assert.ok(cat.lifespan >= 6 && cat.lifespan <= 10, `${name}: ${cat.lifespan}`);
  }
});

test('drawn cats have tidy rows and mirror cleanly', () => {
  const cat = makeCat(parse(luna).cats[0]);
  const grid = drawCat(cat, 'walkA');
  assert.equal(grid.length, 5);
  assert.ok(grid.every((row) => row.length === grid[0].length));
  assert.equal(gridToText(mirror(mirror(grid))), gridToText(grid));
  assert.equal(drawFace(cat).length, 3);
  assert.match(gridToText(grid), /\( \^\.\^ \)/);
});

test('translations mention every property', () => {
  const code = translate(parse(luna).cats, 'en');
  const py = code.python.map((l) => l.text).join('\n');
  assert.match(py, /luna = Cat\(/);
  assert.match(py, /colors=\["orange", "black", "white"\]/);
  assert.match(code.c.map((l) => l.text).join('\n'), /\.colors = \{ ORANGE, BLACK, WHITE \}/);
  assert.match(code.cpp.map((l) => l.text).join('\n'), /luna\.eyes = Eyes::Happy;/);
  const it = translate(parse(luna).cats, 'it');
  assert.match(it.javascript.map((l) => l.text).join('\n'), /mondo\.aggiungi\(luna\);/);
  assert.match(it.cpp.map((l) => l.text).join('\n'), /luna\.orecchie|luna\.occhi = Occhi::Felici;/);
});

test('a program can be switched between languages and back', () => {
  const it = translateProgram(luna, 'it');
  assert.match(it, /^gatto Luna/);
  assert.match(it, /colori: arancione, nero, bianco/);
  assert.equal(translateProgram(it, 'en'), luna);
});

test('every cat-language example works as described, in both languages', () => {
  for (const ex of EXAMPLES.filter((e) => !e.lang)) {
    for (const lang of ['en', 'it']) {
      const { cats, errors } = parse(exampleCode(ex, lang));
      assert.equal(errors.length, 0, `${ex.id} ${lang}`);
      const built = cats.map(makeCat);
      const bad = built.flatMap((c) => c.errors);
      if (ex.id === 'bug') assert.equal(bad[0].code, 'male_tortie');
      else assert.equal(bad.length, 0, `${ex.id} ${lang}: ${bad.map((e) => message(e, lang))}`);
    }
  }
});
