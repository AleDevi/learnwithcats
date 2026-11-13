// The "cat function": takes a cat's traits and genes and returns a grid of
// coloured characters. Every cat is made of interchangeable parts.
//
//                          <- row 0: hat, bow, "zZ", speech bubble
//    /\_/\  _______        <- row 1: ears + back
//   ( o.o )/███████\~~     <- row 2: eyes + body + tail
//    > ^ < \_______/       <- row 3: mouth + belly (+ collar at the neck)
//           /    \         <- row 4: legs (two frames for walking), bell

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

const EYE_COLORS = { green: '#4f9d4f', amber: '#d9a21b', copper: '#c9772c', blue: '#4a90d9' };
const PINK = '#e07a8c';
const WHISKER = '#6b6f76';
const COLLAR_COLORS = { red: '#d33a3a', blue: '#2f6fd6', green: '#2e9d57', pink: '#e85d9a', yellow: '#e6b800' };
const BELL = '#e6b800';

// The special felines: each has its own head, coat and way of moving.
export const SPECIES_LOOK = {
  lion: { head: 'lion', coat: '#d9a55b', mark: '#8a5a2b', body: 9, tail: '~~@', fill: 'solid', speed: 2, eye: '#c98a2c' },
  cheetah: { head: 'cat', ears: 'pointy', coat: '#e3b75e', mark: '#2a2a2a', body: 10, tail: '~=~=', fill: 'dots', speed: 5, eye: '#c98a2c' },
  lynx: { head: 'lynx', ears: 'pointy', coat: '#bfa785', mark: '#6b5a45', body: 7, tail: '~', fill: 'faint', speed: 3, eye: '#a7a33a' },
  tiger: { head: 'cat', ears: 'round', coat: '#e3782a', mark: '#1d1d1d', body: 12, tail: '~=~=~', fill: 'stripes', speed: 3, eye: '#d9a21b', muzzle: true },
  snow_leopard: { head: 'cat', ears: 'round', coat: '#bcc4cb', mark: '#4a535b', body: 10, tail: '~~~~~', fill: 'rosettes', speed: 3, eye: '#7fb3a8' },
};

function bodyFromWeight(kg) {
  if (kg < 3.5) return 5;
  if (kg < 5.5) return 7;
  if (kg < 7.5) return 10;
  return 12;
}

// Builds a full cat from a parsed program entry.
export function makeCat(parsed) {
  const { name, props } = parsed;
  const adv = Object.fromEntries(Object.entries(parsed.adv || {}).map(([k, v]) => [k, v.value]));
  const { genome, errors, notes } = buildGenome(props, name);
  if (!genome) return { name, errors, notes };
  const rng = makeRng(`looks:${name}`);
  const traits = {};
  for (const part of ['ears', 'eyes', 'mouth', 'tail', 'body']) {
    traits[part] = props[part] ? props[part].value : rng.pick(Object.keys(PARTS[part]));
  }
  const species = props.species?.value && props.species.value !== 'cat' ? props.species.value : null;
  const look = species ? SPECIES_LOOK[species] : null;
  if (species && props.colors) notes.push({ line: props.colors.line, code: 'species_coat', params: { species } });

  const coat = coatOf(genome);
  if (adv.tabby_type && !coat.tabby && !species) {
    notes.push({ line: parsed.adv.tabby_type.line, code: 'tabby_type_hidden' });
  }

  let eyes;
  if (adv.eye_color === 'odd') eyes = [EYE_COLORS.blue, EYE_COLORS.amber];
  else if (adv.eye_color) eyes = [EYE_COLORS[adv.eye_color], EYE_COLORS[adv.eye_color]];
  else if (look) eyes = [look.eye, look.eye];
  else {
    const c = coat.white === 2 && rng.chance(0.5) ? EYE_COLORS.blue : EYE_COLORS[rng.pick(['green', 'amber', 'copper'])];
    eyes = [c, c];
  }

  const bodyLen = look ? look.body : adv.weight ? bodyFromWeight(adv.weight) : PARTS.body[traits.body];
  const tail = look ? look.tail : '~'.repeat(PARTS.tail[traits.tail]);

  return {
    name,
    species,
    look,
    traits,
    adv,
    genome,
    coat,
    eyes,
    bodyLen,
    tail,
    behaviour: {
      speed: adv.speed ?? (look ? look.speed : 3),
      sleepiness: adv.sleepiness ?? 3,
      friendliness: adv.friendliness ?? 3,
    },
    actions: parsed.actions || [],
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

function isDark(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 110;
}

// The coat colour of one body cell: patches for tortoiseshell cats, white spots
// that prefer the lower half, like real bicolour cats.
export function coatColorAt(cat, x, y) {
  if (cat.look) return cat.look.coat;
  const { coat, name } = cat;
  let color = coat.colors[0];
  if (coat.tortie) {
    color = cellNoise(name, Math.floor(x / 2), y) < 0.5 ? coat.colors[0] : coat.colors[1];
  }
  if (coat.white) {
    const score = cellNoise(`${name}:white`, Math.floor(x / 2), y) * 0.6 + (y / 4) * 0.6;
    if (score > (coat.white === 2 ? 0.45 : 0.75)) color = 'white';
  }
  return COAT_COLORS[color];
}

// The face gets calmer colours than the body: tortoiseshell cats get a split
// face (one colour per side, like many real ones), white cats a white muzzle.
export function faceColorAt(cat, x, y) {
  if (cat.look) return cat.look.muzzle && y === 3 ? COAT_COLORS.white : cat.look.coat;
  const { coat, name } = cat;
  let color = coat.colors[0];
  if (coat.tortie) {
    const leftFirst = cellNoise(name, 'face', 0) < 0.5;
    color = x <= 3 === leftFirst ? coat.colors[0] : coat.colors[1];
  }
  if (coat.white && (y === 3 || (coat.white === 2 && x === 3))) color = 'white';
  return COAT_COLORS[color];
}

function outlineColor(base) {
  return base === COAT_COLORS.white ? '#7a8088' : shade(base, -0.45);
}

// The pattern drawn inside the body, from the tabby type or the feline's coat.
function fillCell(cat, x, y, base) {
  const kind = cat.look ? cat.look.fill : cat.coat.tabby ? cat.adv.tabby_type || 'mackerel' : 'solid';
  const mark = cat.look ? cat.look.mark : shade(base, base === COAT_COLORS.white ? -0.08 : -0.3);
  const n = cellNoise(`${cat.name}:fill`, x, y);
  switch (kind) {
    case 'mackerel':
    case 'stripes':
      return x % 2 === 0 ? { ch: kind === 'stripes' ? '║' : '▒', fg: mark, bg: base } : { ch: '█', fg: base };
    case 'spotted':
    case 'dots':
      return n < 0.5 ? { ch: '•', fg: mark, bg: base } : { ch: '█', fg: base };
    case 'classic':
      return { ch: n < 0.35 ? '▓' : n < 0.7 ? '▒' : '█', fg: n < 0.7 ? mark : base, bg: base };
    case 'faint':
      return n < 0.4 ? { ch: '·', fg: mark, bg: base } : { ch: '█', fg: base };
    case 'rosettes':
      return x % 3 === 1 ? { ch: 'o', fg: mark, bg: base } : { ch: '█', fg: base };
    default:
      return { ch: '█', fg: base };
  }
}

// Returns rows of cells { ch, fg, bg }. `pose` is 'walkA', 'walkB', 'sit' or 'sleep'.
// `say` is an optional speech bubble.
export function drawCat(cat, pose = 'walkA', say = null) {
  const { traits, look } = cat;
  const head = look ? look.head : 'cat';
  const hw = head === 'lion' ? 9 : 7; // head width
  const n = cat.bodyLen;
  const width = hw + 2 + n + cat.tail.length;
  const grid = Array.from({ length: 5 }, () => Array.from({ length: width }, () => ({ ch: ' ' })));

  const put = (x, y, ch, role, extra = {}) => {
    if (x < 0 || x >= width) return;
    grid[y][x] = { ch, role, ...extra };
  };
  const putText = (x, y, text, role) => [...text].forEach((ch, i) => ch !== ' ' && put(x + i, y, ch, role));

  const eyes = pose === 'sleep' ? PARTS.eyes.sleepy : PARTS.eyes[traits.eyes];
  const ears = PARTS.ears[look?.ears || traits.ears];
  const mouth = PARTS.mouth[traits.mouth];
  const o = head === 'lion' ? 1 : 0; // face offset inside the head

  // head
  if (head === 'lion') {
    putText(2, 0, '@@@@@', 'mane');
    putText(1, 1, '@(\\_/)@', 'mane');
    put(0, 2, '@', 'mane');
    put(8, 2, '@', 'mane');
    put(0, 3, '@', 'mane');
    put(8, 3, '@', 'mane');
    putText(2, 4, '@@@@@', 'mane');
    put(2, 1, '(', 'outline');
    putText(3, 1, '\\_/', 'outline');
    put(6, 1, ')', 'outline');
  } else {
    if (head === 'lynx') {
      put(1, 0, '|', 'mark');
      put(5, 0, '|', 'mark');
    }
    putText(1, 1, ears, 'outline');
  }
  put(o, 2, head === 'lynx' ? '{' : '(', 'outline');
  putText(o + 2, 2, eyes, 'eye');
  put(o + 6, 2, head === 'lynx' ? '}' : ')', 'outline');
  putText(o + 1, 3, mouth, 'mouth');
  for (let x = o + 1; x <= o + 5; x++) {
    for (const y of [2, 3]) if (grid[y][x].ch === ' ') grid[y][x] = { ch: ' ', role: 'face' };
  }

  // body
  const b = hw + 1; // first body column
  putText(b, 1, '_'.repeat(n), 'outline');
  put(hw, 2, '/', 'outline');
  for (let i = 0; i < n; i++) put(b + i, 2, '█', 'fill');
  put(b + n, 2, '\\', 'outline');
  const tail = pose === 'walkB' ? cat.tail.replace(/~/g, (m, i) => (i % 2 ? '~' : '-')) : cat.tail;
  putText(b + n + 1, 2, tail, 'tail');
  put(hw, 3, '\\', 'outline');
  putText(b, 3, '_'.repeat(n), 'outline');
  put(b + n, 3, '/', 'outline');

  // legs
  const front = b + 1;
  const back = b + n - 2;
  const legs = { walkA: ['/', '\\'], walkB: ['\\', '/'] }[pose] || ['|', '|'];
  put(front, 4, legs[0], 'outline');
  put(back, 4, legs[1], 'outline');

  // accessories
  const { adv } = cat;
  if (adv.collar) put(hw, 3, '≡', 'collar');
  if (adv.bell) put(hw, 4, '•', 'bell');
  if (adv.hat) putText(o + 2, 0, '▄█▄', 'hat');
  if (adv.bow) put(head === 'lion' ? 7 : 6, 0, '⋈', 'bow');

  // colour every cell
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      if (!cell.role) continue;
      const inFace = x <= hw - 1 && y >= 1 && y <= 3;
      const base = inFace ? faceColorAt(cat, x, y) : coatColorAt(cat, x, y);
      const tint = shade(base, base === COAT_COLORS.white ? 0 : 0.25);
      switch (cell.role) {
        case 'fill':
          Object.assign(cell, fillCell(cat, x, y, base));
          break;
        case 'face':
          cell.bg = tint;
          break;
        case 'eye': {
          // open eyes show their colour; closed or squinting eyes are just lines
          const ink = isDark(tint) ? '#f4f1ea' : '#2a2a2e';
          const which = x < o + 4 ? 0 : 1;
          cell.fg = cell.ch === '.' ? PINK : 'oO'.includes(cell.ch) ? cat.eyes[which] : ink;
          cell.bg = tint;
          break;
        }
        case 'mouth':
          cell.fg = cell.ch === '>' || cell.ch === '<' ? (isDark(tint) ? '#c9ccd1' : WHISKER) : PINK;
          cell.bg = tint;
          break;
        case 'mane':
          cell.fg = look.mark;
          break;
        case 'mark':
          cell.fg = look ? look.mark : '#333';
          break;
        case 'tail':
          cell.fg = cell.ch === '@' ? look.mark : look && cell.ch === '=' ? look.mark : outlineColor(base);
          break;
        case 'collar':
          cell.fg = COLLAR_COLORS[adv.collar];
          break;
        case 'bell':
          cell.fg = BELL;
          break;
        case 'hat':
          cell.fg = '#2a2a2e';
          break;
        case 'bow':
          cell.fg = '#e85d9a';
          break;
        default:
          cell.fg = outlineColor(base);
      }
    }
  }

  // sleeping and talking happen above the back
  if (pose === 'sleep') {
    grid[0][b + 1] = { ch: 'z', fg: '#5b6b8c', role: 'zz' };
    grid[0][b + 2] = { ch: 'Z', fg: '#5b6b8c', role: 'zz' };
  }
  if (say) {
    const text = `‹${say}›`;
    const row = grid[0];
    [...text].forEach((ch, i) => {
      const x = b + i;
      const cell = { ch, fg: '#23262b', bg: '#ffffff', role: 'say' };
      if (x < row.length) row[x] = cell;
      else row.push(cell);
    });
    for (let y = 1; y < grid.length; y++) while (grid[y].length < row.length) grid[y].push({ ch: ' ' });
  }
  return grid;
}

const MIRROR = { '/': '\\', '\\': '/', '(': ')', ')': '(', '<': '>', '>': '<', '{': '}', '}': '{', '‹': '›', '›': '‹' };

// The same cat walking the other way. Speech bubbles stay readable.
export function mirror(grid) {
  return grid.map((row) => {
    const flipped = [...row].reverse().map((cell) => ({ ...cell, ch: MIRROR[cell.ch] || cell.ch }));
    const said = flipped.filter((c) => c.role === 'say');
    if (said.length) {
      const start = flipped.findIndex((c) => c.role === 'say');
      const fixed = [...said].reverse().map((c) => ({ ...c, ch: MIRROR[c.ch] || c.ch }));
      fixed.forEach((c, i) => (flipped[start + i] = c));
    }
    return flipped;
  });
}

// Just the face, for lists and tombstones.
export function drawFace(cat) {
  const hw = cat.look?.head === 'lion' ? 9 : 7;
  return drawCat({ ...cat, adv: { ...cat.adv, collar: undefined, bell: undefined } }, 'sit')
    .slice(cat.look?.head === 'lion' || cat.adv.hat || cat.look?.head === 'lynx' ? 0 : 1, 4)
    .map((row) => row.slice(0, hw));
}

export function gridToText(grid) {
  return grid.map((row) => row.map((c) => c.ch).join('').replace(/\s+$/, '')).join('\n');
}
