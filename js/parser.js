// Turns a cat program into data, or into friendly errors.
//
//   cat Luna            <- starts a cat (or: gatto Luna)
//     sex: female       <- one property per line
//     colors: orange, black, white
//
// Lines starting with # are comments.

import { KEYWORDS, VALUES, findKeyword, findValue, allWords } from './words.js';

export const MAX_CATS = 3;
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} '-]{0,19}$/u;

function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      // swapped neighbours ("eyse" -> "eyes") count as one typo
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

export function suggest(word, candidates) {
  const w = word.toLowerCase();
  let best = null;
  let bestScore = Infinity;
  for (const c of candidates) {
    const score = distance(w, c);
    if (score < bestScore) {
      best = c;
      bestScore = score;
    }
  }
  return bestScore <= Math.max(1, Math.floor(w.length / 3)) ? best : null;
}

export function parse(source) {
  const cats = [];
  const errors = [];
  let current = null;
  const lines = source.split('\n');

  const fail = (line, code, params = {}) => errors.push({ line, code, params });

  lines.forEach((raw, index) => {
    const line = index + 1;
    const text = raw.replace(/#.*$/, '').trim();
    if (!text) return;

    // A new cat: "cat Name" or "gatto Name"
    const first = text.split(/\s+/)[0];
    if (!text.includes(':') && findKeyword(first) === 'cat') {
      const name = text.slice(first.length).trim();
      if (!name) {
        fail(line, 'missing_name');
        current = null;
        return;
      }
      if (!NAME_PATTERN.test(name)) {
        fail(line, 'bad_name', { name });
        current = null;
        return;
      }
      if (cats.length >= MAX_CATS) {
        fail(line, 'too_many_cats', { max: MAX_CATS });
        current = null;
        return;
      }
      current = { name, line, props: {} };
      cats.push(current);
      return;
    }

    // A property: "key: value"
    const colon = text.indexOf(':');
    if (colon === -1) {
      const guess = suggest(first, allWords(KEYWORDS));
      if (guess && findKeyword(guess) !== 'cat') fail(line, 'missing_colon', { word: first });
      else fail(line, 'unknown_line', { text, suggestion: guess });
      return;
    }
    const keyWord = text.slice(0, colon).trim();
    const valueText = text.slice(colon + 1).trim();
    const key = findKeyword(keyWord);

    if (!key || key === 'cat') {
      fail(line, 'unknown_keyword', { word: keyWord, suggestion: suggest(keyWord, allWords(KEYWORDS)) });
      return;
    }
    if (!current) {
      fail(line, 'no_cat_yet');
      return;
    }
    if (current.props[key]) {
      fail(line, 'duplicate_property', { key, first: current.props[key].line });
      return;
    }
    if (!valueText) {
      fail(line, 'missing_value', { key });
      return;
    }

    const words = key === 'colors' ? valueText.split(/\s*,\s*|\s+and\s+|\s+e\s+/) : [valueText];
    const ids = [];
    for (const w of words.filter(Boolean)) {
      const id = findValue(key, w);
      if (!id) {
        fail(line, 'unknown_value', { key, word: w, suggestion: suggest(w, allWords(VALUES[key])) });
        return;
      }
      if (!ids.includes(id)) ids.push(id);
    }
    if (key === 'colors' && ids.length > 3) {
      fail(line, 'too_many_colors');
      return;
    }
    current.props[key] = { value: key === 'colors' ? ids : ids[0], line };
  });

  if (!cats.length && !errors.length) fail(1, 'empty_program');
  return { cats, errors };
}
