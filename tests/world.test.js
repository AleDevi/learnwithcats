import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '../js/parser.js';
import { makeCat } from '../js/cat.js';
import { makeRng } from '../js/rng.js';
import { DAY, lifeOf, inherit, dueLitters, kittenName } from '../js/world/life.js';
import { LocalStore, toRecord, fromRecord, WorldError } from '../js/world/store.js';
import { normalize, isBlocked } from '../js/world/moderation.js';

const blocked = JSON.parse(readFileSync(new URL('../data/blocked-words.json', import.meta.url)));

function recordOf(program, extra) {
  const cat = makeCat(parse(program).cats[0]);
  return toRecord(cat, extra);
}

test('a cat is a kitten, then an adult, then old, then gone', () => {
  const r = { born: 0, lifespan: 8 };
  assert.equal(lifeOf(r, 0.1 * DAY).stage, 'kitten');
  assert.equal(lifeOf(r, 4 * DAY).stage, 'adult');
  assert.equal(lifeOf(r, 7 * DAY).stage, 'old');
  assert.equal(lifeOf(r, 7 * DAY).alive, true);
  assert.equal(lifeOf(r, 8 * DAY).alive, false);
  assert.equal(lifeOf(r, 3.5 * DAY).day, 4);
});

test('kittens get one allele from each parent, and only daughters can be tortoiseshell', () => {
  const mother = recordOf('cat Mamma\n  sex: female\n  colors: orange, black\n', { id: 'm' });
  const father = recordOf('cat Papa\n  sex: male\n  colors: black\n', { id: 'f' });
  const rng = makeRng('litter-test');
  for (let i = 0; i < 200; i++) {
    const { genome } = inherit(mother, father, rng);
    for (const gene of ['D', 'A', 'S', 'L']) {
      assert.ok(mother.genome[gene].includes(genome[gene][0]) || mother.genome[gene].includes(genome[gene][1]));
    }
    if (genome.sex === 'male') assert.equal(genome.O.length, 1);
    else assert.equal(genome.O[1], 'o'); // a daughter always gets the father's X
  }
});

test('litters are the same in every browser and come at most twice per mother', () => {
  const records = [];
  for (let i = 0; i < 6; i++) {
    records.push(recordOf(`cat Mom${i}\n  sex: female\n`, { id: `m${i}`, born: 0 }));
    records.push(recordOf(`cat Dad${i}\n  sex: male\n`, { id: `d${i}`, born: 0 }));
  }
  const now = 3 * DAY + DAY - 1; // end of day 3: all adults
  const a = dueLitters(records, now);
  const b = dueLitters(structuredClone(records), now);
  assert.deepEqual(a, b);
  for (const l of a) {
    assert.ok(l.born <= now);
    assert.ok(l.kittens.length >= 1 && l.kittens.length <= 3);
  }
  // a mother with two litters already has no more
  const withPast = records.concat(
    ['x:1', 'x:2'].map((key, i) => ({ ...records[0], id: `k${i}`, mother: 'm0', litter: key, born: 0 })),
  );
  assert.ok(!dueLitters(withPast, now).some((l) => l.mother === 'm0'));
});

test('kitten names never repeat a syllable twice in a row', () => {
  const rng = makeRng('names');
  for (let i = 0; i < 300; i++) assert.doesNotMatch(kittenName(rng).toLowerCase(), /^(..)\1|(..)\2$/);
});

test('a record draws the same cat as the program', () => {
  const cat = makeCat(parse('cat Luna\n  sex: female\n  colors: orange, black, white\n  eyes: happy\n').cats[0]);
  const back = fromRecord(JSON.parse(JSON.stringify(toRecord(cat))));
  assert.equal(back.dna, cat.dna);
  assert.deepEqual(back.traits, cat.traits);
});

test('the name filter sees through tricks, but leaves innocent names alone', () => {
  assert.equal(normalize('Càzzzz0'), 'cazo');
  assert.ok(isBlocked(blocked, 'Stronzo'));
  assert.ok(isBlocked(blocked, 'str0nz0'));
  assert.ok(isBlocked(blocked, 'F U C K'));
  for (const ok of ['Luna', 'Micio', 'Briciola', 'Tofu', 'Pepe', 'Zucca']) {
    assert.ok(!isBlocked(blocked, ok), ok);
  }
});

function memoryStorage() {
  const data = new Map();
  return { get: (k) => data.get(k) ?? null, set: (k, v) => data.set(k, v) };
}

test('the local world keeps the rules: 3 living cats, unique names, kind names', async () => {
  const world = new LocalStore(memoryStorage(), blocked);
  const player = { id: 'p'.repeat(20), name: 'Ale' };
  const { records } = await world.list(player);
  assert.ok(records.some((r) => lifeOf(r, Date.now() / 1000).alive));
  assert.ok(records.every((r) => !r.mine));
  const rec = (name) => recordOf(`cat ${name}\n`, { srcLang: 'cat' });
  await world.add(player, [rec('Uno'), rec('Due')]);
  await assert.rejects(world.add(player, [rec('Tre'), rec('Quattro')]), (e) => e instanceof WorldError && e.code === 'too_many_living');
  await assert.rejects(world.add(player, [rec('Tofu')]), (e) => e.code === 'name_taken');
  await assert.rejects(world.add(player, [rec('Stronzo')]), (e) => e.code === 'blocked_name');
  const after = await world.list(player);
  assert.equal(after.records.filter((r) => r.mine).length, 2);
});
