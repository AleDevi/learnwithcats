// Simplified cat coat genetics.
//
// Genes (two copies each, one from each parent):
//   O  orange, on the X chromosome. Females have two X, males one X and one Y.
//      O = orange, o = not orange (black-based). A female O/o is orange AND black.
//   D  dilution. d/d turns black into grey (blue) and orange into cream.
//   A  tabby. a/a is solid. Orange cats always show stripes, whatever A says.
//   S  white spotting. S/s some white, S/S a lot of white.
//   L  longevity, a number 1-3. Lifespan = 4 + L1 + L2 days (6 to 10).

import { makeRng } from './rng.js';

const ORANGE_FAMILY = ['orange', 'cream'];
const BLACK_FAMILY = ['black', 'grey'];
const DILUTE = ['grey', 'cream'];
const DENSE = ['orange', 'black'];

// Builds a genome that matches what the program asked for.
// Anything not asked for is picked with the cat's own random generator.
// Returns { genome, errors, notes }.
export function buildGenome(props, seed) {
  const rng = makeRng(`genes:${seed}`);
  const errors = [];
  const notes = [];
  const colorsProp = props.colors;
  const colors = colorsProp ? colorsProp.value : null;
  const colorsLine = colorsProp ? colorsProp.line : null;
  let sex = props.sex ? props.sex.value : null;

  const genome = {};

  if (colors) {
    const hasOrange = colors.some((c) => ORANGE_FAMILY.includes(c));
    const hasBlack = colors.some((c) => BLACK_FAMILY.includes(c));
    const hasDilute = colors.some((c) => DILUTE.includes(c));
    const hasDense = colors.some((c) => DENSE.includes(c));

    if (!hasOrange && !hasBlack) {
      errors.push({ line: colorsLine, code: 'white_only' });
    }
    if (hasDilute && hasDense) {
      errors.push({ line: colorsLine, code: 'mixed_dilution' });
    }
    if (hasOrange && hasBlack) {
      if (sex === 'male') {
        errors.push({ line: props.sex.line, code: 'male_tortie', params: { colorsLine } });
      } else if (!sex) {
        sex = 'female';
        notes.push({ line: colorsLine, code: 'tortie_is_female' });
      }
    }
    if (errors.length) return { genome: null, errors, notes };

    sex = sex || (rng.chance(0.5) ? 'female' : 'male');
    if (sex === 'female') {
      genome.O = hasOrange && hasBlack ? ['O', 'o'] : hasOrange ? ['O', 'O'] : ['o', 'o'];
    } else {
      genome.O = [hasOrange ? 'O' : 'o'];
    }
    genome.D = hasDilute ? ['d', 'd'] : ['D', rng.chance(0.3) ? 'd' : 'D'];
    genome.S = colors.includes('white') ? (rng.chance(0.35) ? ['S', 'S'] : ['S', 's']) : ['s', 's'];
  } else {
    sex = sex || (rng.chance(0.5) ? 'female' : 'male');
    const x = () => (rng.chance(0.35) ? 'O' : 'o');
    genome.O = sex === 'female' ? [x(), x()] : [x()];
    genome.D = [rng.chance(0.3) ? 'd' : 'D', rng.chance(0.3) ? 'd' : 'D'];
    genome.S = [rng.chance(0.3) ? 'S' : 's', rng.chance(0.3) ? 'S' : 's'];
  }

  const pattern = props.pattern ? props.pattern.value : null;
  if (pattern === 'tabby') genome.A = ['A', rng.chance(0.5) ? 'A' : 'a'];
  else if (pattern === 'solid') genome.A = ['a', 'a'];
  else genome.A = [rng.chance(0.5) ? 'A' : 'a', rng.chance(0.5) ? 'A' : 'a'];

  genome.L = [rng.int(1, 3), rng.int(1, 3)];
  genome.sex = sex;

  for (const gene of ['O', 'D', 'S', 'A']) genome[gene] = sortAlleles(genome[gene]);

  const coat = coatOf(genome);
  if (pattern === 'solid' && coat.tabby) {
    notes.push({ line: props.pattern.line, code: 'orange_always_tabby' });
  }
  return { genome, errors, notes };
}

// Dominant allele first, so S/s is written "Ss" and never "sS".
export function sortAlleles(pair) {
  return [...pair].sort((a, b) => (a === a.toUpperCase() ? -1 : 0) - (b === b.toUpperCase() ? -1 : 0));
}

// What the cat looks like, from its genes.
export function coatOf(genome) {
  const dilute = genome.D.every((a) => a === 'd');
  const orange = dilute ? 'cream' : 'orange';
  const black = dilute ? 'grey' : 'black';
  const hasO = genome.O.includes('O');
  const haso = genome.O.includes('o');
  const colors = [];
  if (hasO) colors.push(orange);
  if (haso) colors.push(black);
  const white = genome.S.filter((a) => a === 'S').length; // 0, 1 or 2
  const tortie = hasO && haso;
  // Orange hides the solid gene: orange cats always look tabby.
  const tabby = genome.A.includes('A') || (hasO && !haso);
  return { colors, white, tabby, tortie, calico: tortie && white > 0 };
}

export function lifespanDays(genome) {
  return 4 + genome.L[0] + genome.L[1];
}

export function dnaString(genome) {
  const x = genome.sex === 'female' ? `X${genome.O[0]} X${genome.O[1]}` : `X${genome.O[0]} Y`;
  return `${x} | ${genome.D.join('')} | ${genome.A.join('')} | ${genome.S.join('')} | L${genome.L[0]} L${genome.L[1]}`;
}
