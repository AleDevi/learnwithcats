// The "cat function": takes a cat's traits and genes and returns a grid of
// coloured characters. Every cat is made of interchangeable parts.
//
//                          <- row 0: "zZ" when the cat sleeps
//    /\_/\  _______        <- row 1: ears + back
//   ( o.o )/███████\~~     <- row 2: eyes + body + tail
//    > ^ < \_______/       <- row 3: mouth + belly
//           /    \         <- row 4: legs (two frames for walking)

import { makeRng, cellNoise } from './rng.js';
import { buildGenome, coatOf, lifespanDays, dnaString } from './genetics.js';

export const PARTS = {
  ears: { pointy: '/\\_/\\', round: '(\\_/)', folded: '-\\_/-' },
  eyes: { normal: 'o.o', happy: '^.^', sleepy: '-.-', surprised: 'O.O', squint: '>.<' },
  mouth: { neutral: '> ^ <', smile: '> w <', tongue: '> P <' },
  tail: { short: 1, medium: 2, long: 3 },
  body: { small: 5, medium: 7, long: 10 },
};

export const COAT_COLORS = {
  orange: '#e8822a',
  black: '#2f2f33',
  grey: '#8795a8',
  cream: '#efd3a0',
  white: '#fbfaf7',
};

const EYE_COLORS = ['#4f9d4f', '#d9a21b', '#c9772c'];
const BLUE_EYES = '#4a90d9';
const PINK = '#e07a8c';
const WHISKER = '#6b6f76';

// Builds a full cat from a parsed program entry.
export function makeCat(parsed) {
  const { name, props } = parsed;
  const { genome, errors, notes } = buildGenome(props, name);
  if (!genome) return { name, errors, notes };
  const rng = makeRng(`looks:${name}`);
  const traits = {};
  for (const part of ['ears', 'eyes', 'mouth', 'tail', 'body']) {
    traits[part] = props[part] ? props[part].value : rng.pick(Object.keys(PARTS[part]));
  }
  const coat = coatOf(genome);
  const eyeColor = coat.white === 2 && rng.chance(0.5) ? BLUE_EYES : rng.pick(EYE_COLORS);
  return {
    name,
    traits,
    genome,
    coat,
    eyeColor,
    dna: dnaString(genome),
    lifespan: lifespanDays(genome),
    errors,
    notes,
  };
}

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount),
  );
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

// The coat colour of one cell: patches for tortoiseshell cats, white spots
// that prefer the lower half and the face, like real bicolour cats.
export function coatColorAt(cat, x, y) {
  const { coat, name } = cat;
  let color = coat.colors[0];
  if (coat.tortie) {
    color = cellNoise(name, Math.floor(x / 2), y) < 0.5 ? coat.colors[0] : coat.colors[1];
  }
  if (coat.white) {
    const score = cellNoise(`${name}:white`, Math.floor(x / 2), y) * 0.6 + (y / 4) * 0.6 + (x < 7 ? 0.1 : 0);
    if (score > (coat.white === 2 ? 0.45 : 0.75)) color = 'white';
  }
  return COAT_COLORS[color];
}

// The face gets calmer colours than the body: tortoiseshell cats get a split
// face (one colour per side, like many real ones), white cats a white muzzle.
export function faceColorAt(cat, x, y) {
  const { coat, name } = cat;
  let color = coat.colors[0];
  if (coat.tortie) {
    const leftFirst = cellNoise(name, 'face', 0) < 0.5;
    color = x <= 3 === leftFirst ? coat.colors[0] : coat.colors[1];
  }
  if (coat.white && (y === 3 || (coat.white === 2 && x === 3))) color = 'white';
  return COAT_COLORS[color];
}

function isDark(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 110;
}

function outlineColor(base) {
  return base === COAT_COLORS.white ? '#7a8088' : shade(base, -0.45);
}

// Returns rows of cells { ch, fg, bg }. `pose` is 'walkA', 'walkB', 'sit' or 'sleep'.
export function drawCat(cat, pose = 'walkA') {
  const { traits } = cat;
  const n = PARTS.body[traits.body];
  const tailLen = PARTS.tail[traits.tail];
  const width = 9 + n + tailLen;
  const grid = Array.from({ length: 5 }, () => Array.from({ length: width }, () => ({ ch: ' ' })));

  const put = (x, y, ch, role) => {
    if (x < 0 || x >= width) return;
    grid[y][x] = { ch, role };
  };
  const putText = (x, y, text, role) => [...text].forEach((ch, i) => ch !== ' ' && put(x + i, y, ch, role));

  const eyes = pose === 'sleep' ? PARTS.eyes.sleepy : PARTS.eyes[traits.eyes];

  if (pose === 'sleep') putText(2, 0, 'zZ', 'zz');
  // ears + back
  putText(1, 1, PARTS.ears[traits.ears], 'outline');
  putText(8, 1, '_'.repeat(n), 'outline');
  // face + body + tail
  put(0, 2, '(', 'outline');
  putText(2, 2, eyes, 'eye');
  put(6, 2, ')', 'outline');
  put(7, 2, '/', 'outline');
  for (let i = 0; i < n; i++) put(8 + i, 2, '█', 'fill');
  put(8 + n, 2, '\\', 'outline');
  const tail = pose === 'walkB' ? '-~'.repeat(tailLen).slice(0, tailLen) : '~'.repeat(tailLen);
  putText(9 + n, 2, tail, 'outline');
  // mouth + belly
  putText(1, 3, PARTS.mouth[traits.mouth], 'mouth');
  put(7, 3, '\\', 'outline');
  putText(8, 3, '_'.repeat(n), 'outline');
  put(8 + n, 3, '/', 'outline');
  // face background cells
  for (let x = 1; x <= 5; x++) {
    for (const y of [2, 3]) if (grid[y][x].ch === ' ') grid[y][x] = { ch: ' ', role: 'face' };
  }
  // legs
  const front = 9;
  const back = 6 + n;
  if (pose === 'walkA') {
    put(front, 4, '/', 'outline');
    put(back, 4, '\\', 'outline');
  } else if (pose === 'walkB') {
    put(front, 4, '\\', 'outline');
    put(back, 4, '/', 'outline');
  } else {
    put(front, 4, '|', 'outline');
    put(back, 4, '|', 'outline');
  }

  // colour every cell
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      if (!cell.role) continue;
      const inFace = x <= 6 && y >= 1 && y <= 3;
      const base = inFace ? faceColorAt(cat, x, y) : coatColorAt(cat, x, y);
      const tint = shade(base, base === COAT_COLORS.white ? 0 : 0.25);
      if (cell.role === 'fill') {
        if (cat.coat.tabby && x % 2 === 0) {
          cell.ch = '▒';
          cell.fg = shade(base, base === COAT_COLORS.white ? -0.08 : -0.3);
          cell.bg = base;
        } else {
          cell.fg = base;
        }
      } else if (cell.role === 'face') {
        cell.bg = tint;
      } else if (cell.role === 'eye') {
        // open eyes show their colour; closed or squinting eyes are just lines
        const ink = isDark(tint) ? '#f4f1ea' : '#2a2a2e';
        cell.fg = cell.ch === '.' ? PINK : 'oO'.includes(cell.ch) ? cat.eyeColor : ink;
        cell.bg = tint;
      } else if (cell.role === 'mouth') {
        cell.fg = cell.ch === '>' || cell.ch === '<' ? (isDark(tint) ? '#c9ccd1' : WHISKER) : PINK;
        cell.bg = tint;
      } else if (cell.role === 'zz') {
        cell.fg = '#5b6b8c';
      } else {
        cell.fg = outlineColor(base);
      }
    }
  }
  return grid;
}

const MIRROR = { '/': '\\', '\\': '/', '(': ')', ')': '(', '<': '>', '>': '<' };

// The same cat walking the other way.
export function mirror(grid) {
  return grid.map((row) =>
    [...row].reverse().map((cell) => ({ ...cell, ch: MIRROR[cell.ch] || cell.ch })),
  );
}

// Just the face, for lists and tombstones.
export function drawFace(cat) {
  return drawCat(cat, 'sit')
    .slice(1, 4)
    .map((row) => row.slice(0, 7));
}

export function gridToText(grid) {
  return grid.map((row) => row.map((c) => c.ch).join('').replace(/\s+$/, '')).join('\n');
}
