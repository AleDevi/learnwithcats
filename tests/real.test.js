import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readProgram } from '../js/program.js';
import { programIn } from '../js/translate.js';
import { makeCat, drawCat, gridToText } from '../js/cat.js';
import { EXAMPLES, message } from '../js/i18n.js';
import { emptyProgress, record, isMastered, unlockedSpecies } from '../js/progress.js';

const ALL = ['lion', 'cheetah', 'lynx', 'tiger', 'snow_leopard'];

const dressed = EXAMPLES.find((e) => e.id === 'dressed').code;

function summary(cats) {
  const values = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.value]).sort());
  return cats.map((c) => ({ name: c.name, props: values(c.props), adv: values(c.adv), says: c.actions.map((a) => a.text), added: c.added }));
}

test('a Python program reads into cats with advanced options and actions', () => {
  const { cats, errors, notes } = readProgram(dressed, 'python');
  assert.deepEqual(errors, []);
  assert.deepEqual(notes, []);
  assert.equal(cats[0].name, 'Luna');
  assert.equal(cats[0].adv.eye_color.value, 'odd');
  assert.equal(cats[0].adv.bell.value, true);
  assert.deepEqual(cats[0].actions.map((a) => a.text), ['hello!']);
  assert.ok(cats[0].added);
});

test('programs survive a trip through every language and both interface languages', () => {
  for (const ex of EXAMPLES.filter((e) => !e.only)) {
    const original = readProgram(ex.code, ex.lang || 'cat', ALL);
    assert.deepEqual(original.errors, [], ex.id);
    for (const lang of ['python', 'javascript', 'c', 'cpp']) {
      for (const ui of ['en', 'it']) {
        const code = programIn(original.cats, lang, ui);
        const back = readProgram(code, lang, ALL);
        assert.deepEqual(back.errors, [], `${ex.id} ${lang} ${ui}\n${code}`);
        assert.deepEqual(summary(back.cats), summary(original.cats), `${ex.id} ${lang} ${ui}`);
      }
    }
  }
});

test('every "find the bug" example has exactly one bug', () => {
  for (const ex of EXAMPLES.filter((e) => e.only)) {
    const { errors } = readProgram(ex.code, ex.lang);
    assert.equal(errors.length, 1, `${ex.id}: ${errors.map((e) => message(e, 'en')).join(' | ')}`);
  }
});

test('mistakes get messages that teach the language', () => {
  const code = (src, lang) => readProgram(src, lang).errors.map((e) => e.code);
  assert.deepEqual(code('x = Cat(name="X", bell=true)\nworld.add(x)', 'python'), ['python_bool']);
  assert.deepEqual(code('x = Cat(name="X", sex=female)\nworld.add(x)', 'python'), ['needs_quotes']);
  assert.deepEqual(code('x = Cat(name: "X")', 'python'), ['python_colon']);
  assert.deepEqual(code('const x = Cat({ name: "X" });', 'javascript'), ['missing_new']);
  assert.deepEqual(code('const x = new Cat({ name: "X", bow: True });\nworld.add(x);', 'javascript'), ['lower_bool']);
  assert.deepEqual(code('Cat x = { .name = "X", .sex = "female" };\nworld_add(&world, &x);', 'c'), ['wrong_form']);
  assert.deepEqual(code('Cat x = { .name = "X" }\nworld_add(&world, &x);', 'c'), ['missing_semicolon']);
  assert.deepEqual(code("Cat x('X');", 'cpp'), ['c_single_quotes']);
  assert.deepEqual(code('Cat x("X");\nx.speed = 9;\nworld.add(x);', 'cpp'), ['out_of_range']);
  assert.deepEqual(code('Cat x("X");\nx.colors = Color::Black;\nworld.add(x);', 'cpp'), ['expected_list']);
  const typo = readProgram('luna = Cat(name="Luna")\nworld.add(lune)', 'python').errors[0];
  assert.equal(typo.code, 'unknown_variable');
  assert.equal(typo.params.suggestion, 'luna');
  const field = readProgram('luna = Cat(name="Luna", eyecolor="blue")', 'python').errors[0];
  assert.equal(field.code, 'unknown_field');
  assert.equal(field.params.suggestion, 'eye_color');
});

test('a cat that is created but not added gets a reminder', () => {
  const { notes, cats } = readProgram('luna = Cat(name="Luna")', 'python');
  assert.equal(notes[0].code, 'not_added');
  assert.equal(cats[0].added, false);
});

test('advanced options are refused in the cat language, with a pointer', () => {
  const { errors } = readProgram('cat Luna\n  eye color: blue', 'cat');
  assert.equal(errors[0].code, 'only_real_languages');
});

test('special felines stay locked until their language is mastered', () => {
  assert.equal(readProgram('cat Leo\n  species: lion', 'cat').errors[0].code, 'species_locked');
  assert.deepEqual(readProgram('cat Leo\n  species: lion', 'cat', ['lion']).errors, []);
});

test('mastery: 5 cats and 5 advanced options unlock the feline', () => {
  let progress = emptyProgress();
  const options = ['eye_color', 'collar', 'bell', 'bow', 'hat'];
  let last;
  for (let i = 0; i < 5; i++) {
    const cat = { name: `Cat${i}`, added: true, adv: { [options[i]]: { value: 1 } } };
    last = record(progress, 'python', [cat]);
    progress = last.progress;
  }
  assert.ok(isMastered(progress, 'python'));
  assert.deepEqual(last.newlyMastered, ['python']);
  assert.deepEqual(last.newlyUnlocked, ['lion']);
  assert.deepEqual(unlockedSpecies(progress), ['lion']);
  // the same cat twice doesn't count twice
  const again = record(emptyProgress(), 'c', [{ name: 'A', added: true, adv: {} }, { name: 'A', added: true, adv: {} }]);
  assert.equal(again.progress.c.cats.length, 1);
});

test('felines and accessories are drawn', () => {
  const leo = makeCat({ name: 'Leo', props: { species: { value: 'lion' } }, adv: {} });
  assert.match(gridToText(drawCat(leo)), /@@@@@/);
  const luna = makeCat(readProgram(dressed, 'python').cats[0]);
  const text = gridToText(drawCat(luna, 'walkA', 'hi'));
  assert.match(text, /▄█▄/, 'hat');
  assert.match(text, /≡/, 'collar');
  assert.match(text, /‹hi›/, 'speech bubble');
});
