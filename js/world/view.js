// Draws the square (three planes, far to near), the list of living cats and
// the cemetery.

import { drawFace } from '../cat.js';
import { escapeHtml, cellsToHtml } from '../html.js';
import { placeActors, stepActors, actorsToHtml } from '../motion.js';
import { fromRecord } from './store.js';
import { lifeOf } from './life.js';

// Far planes use a smaller font, so they hold more characters in the same space.
export const PLANES = [
  { id: 'far', width: 100 },
  { id: 'middle', width: 80 },
  { id: 'near', width: 64 },
];

const SKYLINE = [
  '   ____        __|__           _____        ____     __|__          ____        _____     ',
  '  |[][]|______|  |  |_________|[] []|______|[][]|___|  |  |________|[][]|______|[] []|____',
];

// A cat of the square, drawn the same in every browser, with its age showing.
function worldCat(record, now) {
  const cat = fromRecord(record);
  const life = lifeOf(record, now);
  if (life.stage === 'kitten') {
    cat.bodyLen = Math.max(3, cat.bodyLen - 3);
    cat.tail = cat.tail.slice(0, 1);
    cat.behaviour = { ...cat.behaviour, speed: Math.min(5, cat.behaviour.speed + 1), friendliness: 5 };
  } else if (life.stage === 'old') {
    cat.behaviour = { ...cat.behaviour, speed: 1, sleepiness: 5 };
  }
  cat.id = record.id;
  cat.stage = life.stage;
  return cat;
}

export function createWorldView() {
  const planes = PLANES.map((p) => ({ ...p, actors: [] }));

  return {
    // Puts the living cats on the planes, keeping where the old ones were.
    setCats(living, now) {
      const sorted = [...living].sort((a, b) => a.born - b.born || (a.id < b.id ? -1 : 1));
      planes.forEach((plane, i) => {
        const cats = sorted.filter((_, j) => j % planes.length === (planes.length - 1 - i)).map((r) => worldCat(r, now));
        plane.actors = placeActors(cats, plane.actors, plane.width, (c) => c.id);
      });
    },
    tick() {
      for (const plane of planes) stepActors(plane.actors, plane.width);
    },
    squareHtml(emptyText) {
      const any = planes.some((p) => p.actors.length);
      const sky = `<pre class="skyline" aria-hidden="true">${SKYLINE.join('\n')}</pre>`;
      const rows = planes
        .map((p) => `<pre class="plane plane-${p.id}" aria-hidden="true">${p.actors.length ? actorsToHtml(p.actors, p.width, { layered: true }) : '\n\n\n\n'}</pre>`)
        .join('');
      return sky + rows + (any ? '' : `<p class="empty">${escapeHtml(emptyText)}</p>`);
    },
  };
}

const face = (record) => drawFace(fromRecord(record)).map(cellsToHtml).join('\n');

export function livingHtml(living, all, now, t) {
  const nameOf = (id) => all.find((r) => r.id === id)?.name || t.someone;
  return living
    .map((r) => {
      const life = lifeOf(r, now);
      const parents = r.mother ? `<span>${escapeHtml(t.kittenOf(nameOf(r.mother), nameOf(r.father)))}</span>` : '';
      const button = r.mine ? `<span class="badge">${t.yours}</span>` : `<button type="button" class="report" data-report="${escapeHtml(r.id)}">${t.report}</button>`;
      return `<li class="resident${r.mine ? ' mine' : ''}">
        <pre class="face" aria-hidden="true">${face(r)}</pre>
        <div class="who">
          <strong>${escapeHtml(r.name)}</strong>
          <span>${escapeHtml(t.by(r.ownerName))}</span>
          <span>${escapeHtml(t.dayOf(life.day, r.lifespan))} · ${t[life.stage]}</span>
          ${parents}
        </div>
        ${button}
      </li>`;
    })
    .join('');
}

export function cemeteryHtml(dead, now, t, locale) {
  const date = (s) => new Date(s * 1000).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  return [...dead]
    .sort((a, b) => lifeOf(b, now).died - lifeOf(a, now).died)
    .map(
      (r) => `<li class="tomb">
        <span class="rip">${t.rip}</span>
        <pre class="face" aria-hidden="true">${face(r)}</pre>
        <strong>${escapeHtml(r.name)}</strong>
        <span>${date(r.born)} – ${date(lifeOf(r, now).died)}</span>
        <span class="owner">${escapeHtml(t.by(r.ownerName))}</span>
      </li>`,
    )
    .join('');
}
