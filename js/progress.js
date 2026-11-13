// Mastery of each real language, and the felines it unlocks.
//
// A language is mastered after CATS_NEEDED different cats written in it,
// using at least OPTIONS_NEEDED different advanced options between them.
// For now progress lives in the browser; the shared world will keep it later.

import { SPECIES_UNLOCK } from './words.js';

export const CATS_NEEDED = 5;
export const OPTIONS_NEEDED = 5;
const LANGS = ['python', 'javascript', 'c', 'cpp'];
const KEY = 'lwc-progress';

export function emptyProgress() {
  return Object.fromEntries(LANGS.map((l) => [l, { cats: [], options: [] }]));
}

export function loadProgress(storage) {
  try {
    const data = JSON.parse(storage.get(KEY) || 'null');
    if (data && LANGS.every((l) => data[l] && Array.isArray(data[l].cats))) return data;
  } catch {
    /* broken or missing data: start again */
  }
  return emptyProgress();
}

export function saveProgress(storage, progress) {
  storage.set(KEY, JSON.stringify(progress));
}

export function isMastered(progress, lang) {
  const p = progress[lang];
  return p.cats.length >= CATS_NEEDED && p.options.length >= OPTIONS_NEEDED;
}

export function unlockedSpecies(progress) {
  return Object.entries(SPECIES_UNLOCK)
    .filter(([, langs]) => langs.every((l) => isMastered(progress, l)))
    .map(([species]) => species);
}

// Records the cats of a program that ran without errors.
// Returns { progress, newlyMastered, newlyUnlocked }.
export function record(progress, lang, cats) {
  if (!LANGS.includes(lang)) return { progress, newlyMastered: [], newlyUnlocked: [] };
  const before = unlockedSpecies(progress);
  const wasMastered = isMastered(progress, lang);
  const next = structuredClone(progress);
  const p = next[lang];
  for (const cat of cats) {
    if (!cat.added) continue;
    if (!p.cats.includes(cat.name)) p.cats.push(cat.name);
    for (const option of Object.keys(cat.adv || {})) if (!p.options.includes(option)) p.options.push(option);
  }
  const after = unlockedSpecies(next);
  return {
    progress: next,
    newlyMastered: !wasMastered && isMastered(next, lang) ? [lang] : [],
    newlyUnlocked: after.filter((s) => !before.includes(s)),
  };
}
