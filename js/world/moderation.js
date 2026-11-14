// The same name check as api/moderation.php, so a bad name is caught while
// typing. The list lives in data/blocked-words.json; the server checks again.

const SWAPS = { 4: 'a', '@': 'a', 3: 'e', 1: 'i', '!': 'i', 0: 'o', 5: 's', $: 's', 7: 't' };

export function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[4@31!05$7]/g, (c) => SWAPS[c])
    .replace(/[^a-z ]+/g, ' ')
    .replace(/(.)\1+/g, '$1') // "cazzzzo" -> "cazo"
    .replace(/\s+/g, ' ')
    .trim();
}

export function isBlocked(list, text) {
  if (!list) return false;
  const norm = normalize(text);
  const joined = norm.replace(/ /g, '');
  if (list.contains.some((w) => joined.includes(normalize(w)))) return true;
  const words = norm.split(' ');
  return list.words.some((w) => words.includes(normalize(w)));
}

export async function loadBlockedWords() {
  try {
    const res = await fetch('data/blocked-words.json');
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
