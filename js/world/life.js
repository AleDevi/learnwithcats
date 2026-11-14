// Life in the shared world: age, death, kittens.
//
// Everything here is calculated from timestamps, so every browser sees the
// same world without a server running timers:
//   - a cat is alive while now < born + lifespan days;
//   - each day, each adult couple has a small chance of a litter, decided by a
//     hash of the two cats and the day, so everyone gets the same answer.

import { makeRng, hashString } from '../rng.js';
import { sortAlleles } from '../genetics.js';

export const DAY = 86400; // seconds
export const LITTER_CHANCE = 0.15; // per adult couple per day
export const MAX_LITTERS = 2; // per mother
export const KITTEN_PART = 0.15; // first 15% of life
export const OLD_PART = 0.75; // last 25% of life

export function lifeOf(record, now) {
  const span = record.lifespan * DAY;
  const age = now - record.born;
  const part = age / span;
  return {
    alive: age < span,
    day: Math.min(record.lifespan, Math.floor(age / DAY) + 1),
    died: record.born + span,
    stage: part < KITTEN_PART ? 'kitten' : part < OLD_PART ? 'adult' : 'old',
  };
}

const LOOKS = ['ears', 'eyes', 'mouth', 'tail', 'body'];

// One allele from each parent, as in real inheritance.
export function inherit(mother, father, rng) {
  const pick = (pair) => pair[rng.int(0, pair.length - 1)];
  const fromDad = father.genome.O.length === 1 ? (rng.chance(0.5) ? 'X' : 'Y') : 'X';
  const sex = fromDad === 'X' ? 'female' : 'male';
  const genome = {
    sex,
    O: sex === 'female' ? [pick(mother.genome.O), father.genome.O[0]] : [pick(mother.genome.O)],
    D: [pick(mother.genome.D), pick(father.genome.D)],
    A: [pick(mother.genome.A), pick(father.genome.A)],
    S: [pick(mother.genome.S), pick(father.genome.S)],
    L: [pick(mother.genome.L), pick(father.genome.L)],
  };
  for (const gene of ['O', 'D', 'A', 'S']) genome[gene] = sortAlleles(genome[gene]);
  const props = {};
  for (const part of LOOKS) {
    const from = rng.chance(0.5) ? mother : father;
    if (from.looks?.[part]) props[part] = from.looks[part];
  }
  return { genome, props };
}

const SYLLABLES = ['mi', 'ka', 'lu', 'po', 'ne', 'ta', 'ri', 'su', 'bo', 'ze', 'fi', 'la', 'mo', 'ki', 'pi', 'nu'];

export function kittenName(rng) {
  const n = rng.int(2, 3);
  let name = '';
  let last = null;
  for (let i = 0; i < n; i++) {
    // no syllable twice in a row: "Pipi" and friends sound silly
    const options = SYLLABLES.filter((s) => s !== last);
    last = rng.pick(options);
    name += last;
  }
  return name[0].toUpperCase() + name.slice(1);
}

// Litters due today that don't exist yet. `records` are all cats, alive or not.
export function dueLitters(records, now) {
  const today = Math.floor(now / DAY);
  const living = records.filter((r) => lifeOf(r, now).alive && lifeOf(r, now).stage !== 'kitten' && !r.species);
  const mothers = living.filter((r) => r.genome.sex === 'female');
  const fathers = living.filter((r) => r.genome.sex === 'male');
  const litters = [];
  for (const mother of mothers) {
    const past = new Set(records.filter((r) => r.mother === mother.id).map((r) => r.litter));
    if (past.size >= MAX_LITTERS) continue;
    let best = null;
    for (const father of fathers) {
      const h = hashString(`${mother.id}:${father.id}:${today}`) / 4294967296;
      if (h < LITTER_CHANCE && (!best || h < best.h)) best = { father, h };
    }
    if (!best) continue;
    const key = `${mother.id}:${best.father.id}:${today}`;
    if (past.has(key)) continue;
    const rng = makeRng(key);
    const size = rng.int(1, 3);
    const kittens = [];
    for (let i = 0; i < size; i++) {
      const { genome, props } = inherit(mother, best.father, rng);
      kittens.push({ name: kittenName(rng), genome, looks: props });
    }
    const born = today * DAY + Math.floor(rng.next() * DAY * 0.5);
    if (born > now) continue; // later today
    litters.push({ key, mother: mother.id, father: best.father.id, born, kittens });
  }
  return litters;
}
