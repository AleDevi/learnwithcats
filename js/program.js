// One entry point for every language: reads a program and checks the rules
// that don't depend on the language (like which felines are unlocked).

import { parse } from './parser.js';
import { parseReal } from './lang/real.js';
import { SPECIES_UNLOCK } from './words.js';

export function readProgram(source, lang, unlocked = []) {
  const result = lang === 'cat' ? { ...parse(source), notes: [] } : parseReal(source, lang);
  for (const cat of result.cats) {
    const species = cat.props.species?.value;
    if (species && species !== 'cat' && !unlocked.includes(species)) {
      result.errors.push({
        line: cat.props.species.line,
        code: 'species_locked',
        params: { species, langs: SPECIES_UNLOCK[species] },
      });
    }
  }
  result.errors.sort((a, b) => a.line - b.line);
  return result;
}
