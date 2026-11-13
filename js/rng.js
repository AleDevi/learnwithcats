// Seeded randomness: the same seed always gives the same sequence.
// This is what makes cats "procedural but repeatable": the cat's name is the seed.

export function hashString(text) {
  // FNV-1a, 32 bit
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function makeRng(seed) {
  // mulberry32
  let a = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    chance: (p) => next() < p,
    pick: (list) => list[Math.floor(next() * list.length)],
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
  };
}

// A stable pseudo-random number in [0, 1) for a grid cell, used for coat patches.
export function cellNoise(seed, x, y) {
  return makeRng(hashString(`${seed}:${x}:${y}`)).next();
}
