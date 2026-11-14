// How cats move on a stage: walk, sit, sleep, and walk towards friends.
// Used by the editor stage and by the planes of the square.

import { drawCat, mirror } from './cat.js';
import { cellsToHtml } from './html.js';

const SPEED_STEPS = { 1: 0.34, 2: 0.5, 3: 1, 4: 1.5, 5: 2 };

// Keeps the position of cats that were already on the stage.
export function placeActors(cats, old, width, keyOf = (c) => c.name) {
  return cats.map((cat, i) => {
    const prev = old.find((a) => keyOf(a.cat) === keyOf(cat));
    const w = drawCat(cat).at(0).length;
    return {
      cat,
      width: w,
      x: prev ? Math.max(0, Math.min(prev.x, width - w)) : Math.max(0, Math.floor((width - w) * ((i * 0.37 + 0.2) % 1))),
      dir: prev ? prev.dir : i % 2 ? -1 : 1,
      mode: prev ? prev.mode : 'walk',
      timer: prev ? prev.timer : 6 + i * 3,
      step: prev ? prev.step : 0,
      acc: 0,
      say: prev ? prev.say : null,
      sayUntil: prev ? prev.sayUntil : 0,
    };
  });
}

export function stepActors(actors, width) {
  for (const a of actors) {
    const { speed, sleepiness, friendliness } = a.cat.behaviour;
    a.timer -= 1;
    if (a.timer <= 0) {
      if (a.mode === 'walk') {
        a.mode = Math.random() < 0.1 + 0.15 * (sleepiness - 1) ? 'sleep' : 'sit';
        a.timer = a.mode === 'sit' ? 8 + Math.floor(Math.random() * 10) : 14 + Math.floor(Math.random() * 8 * sleepiness);
      } else {
        a.mode = 'walk';
        a.timer = Math.round((15 + Math.random() * 30) * ((7 - sleepiness) / 4));
        const others = actors.filter((o) => o !== a);
        if (others.length && Math.random() < 0.12 * friendliness) {
          // friendly cats walk towards the nearest cat
          const near = others.reduce((m, o) => (Math.abs(o.x - a.x) < Math.abs(m.x - a.x) ? o : m));
          a.dir = near.x >= a.x ? 1 : -1;
        } else if (Math.random() < 0.4) a.dir *= -1;
      }
    }
    if (a.mode === 'walk') {
      a.acc += SPEED_STEPS[speed] || 1;
      while (a.acc >= 1) {
        a.acc -= 1;
        a.step += 1;
        a.x += a.dir;
        if (a.x <= 0 || a.x >= width - a.width) {
          a.x = Math.max(0, Math.min(a.x, width - a.width));
          a.dir *= -1;
        }
      }
    }
  }
}

// Every cat gets its own 5 rows. `layered` draws them all on the same 5 rows,
// the later ones in front, as in a crowded square.
export function actorsToHtml(actors, width, { layered = false } = {}) {
  const now = Date.now();
  const blank = () => Array.from({ length: width }, () => ({ ch: ' ' }));
  let shared = layered ? Array.from({ length: 5 }, blank) : null;
  const rows = [];
  for (const a of actors) {
    const pose = a.mode === 'walk' ? (a.step % 2 ? 'walkB' : 'walkA') : a.mode;
    const say = a.say && a.sayUntil > now ? a.say : null;
    let grid = drawCat(a.cat, pose, say);
    // cats are drawn facing right; walking left means mirrored
    if (a.dir < 0) grid = mirror(grid);
    const shift = a.dir < 0 ? grid[0].length - a.width : 0; // keep the body still when a bubble appears
    const target = layered ? shared : grid.map(blank);
    grid.forEach((row, y) => {
      row.forEach((cell, i) => {
        const x = a.x + i - shift;
        if (x >= 0 && x < width && (cell.ch !== ' ' || cell.bg)) target[y][x] = cell;
      });
    });
    if (!layered) rows.push(...target.map(cellsToHtml));
  }
  return layered ? shared.map(cellsToHtml).join('\n') : rows.join('\n');
}
