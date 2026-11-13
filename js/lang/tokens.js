// Splits source code into tokens: names, strings, numbers and punctuation.

const PUNCT = ['::', '=', '(', ')', '{', '}', '[', ']', ',', ';', ':', '.', '&', '-'];

export class TokenError extends Error {
  constructor(line, code, params = {}) {
    super(code);
    this.entry = { line, code, params };
  }
}

export function tokenize(source, lang) {
  const tokens = [];
  let i = 0;
  let line = 1;
  const n = source.length;

  while (i < n) {
    const ch = source[i];
    if (ch === '\n') {
      line++;
      i++;
      continue;
    }
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    // comments
    if ((lang === 'python' && ch === '#') || (lang !== 'python' && source.startsWith('//', i))) {
      while (i < n && source[i] !== '\n') i++;
      continue;
    }
    if (lang !== 'python' && source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      for (let k = i; k < stop; k++) if (source[k] === '\n') line++;
      i = stop;
      continue;
    }
    if (lang !== 'python' && ch === '#') throw new TokenError(line, 'hash_comment', { lang });
    // strings
    if (ch === '"' || ch === "'") {
      if (ch === "'" && (lang === 'c' || lang === 'cpp')) throw new TokenError(line, 'c_single_quotes');
      let j = i + 1;
      let text = '';
      while (j < n && source[j] !== ch && source[j] !== '\n') {
        if (source[j] === '\\' && j + 1 < n) {
          text += source[j + 1];
          j += 2;
        } else {
          text += source[j++];
        }
      }
      if (source[j] !== ch) throw new TokenError(line, 'unterminated_string');
      tokens.push({ type: 'string', value: text, line });
      i = j + 1;
      continue;
    }
    // numbers
    const num = /^\d+(\.\d+)?/.exec(source.slice(i, i + 20));
    if (num) {
      tokens.push({ type: 'number', value: Number(num[0]), line });
      i += num[0].length;
      continue;
    }
    // names
    const id = /^[\p{L}_][\p{L}\p{N}_]*/u.exec(source.slice(i, i + 80));
    if (id) {
      tokens.push({ type: 'ident', value: id[0], line });
      i += id[0].length;
      continue;
    }
    const p = PUNCT.find((x) => source.startsWith(x, i));
    if (p) {
      tokens.push({ type: 'punct', value: p, line });
      i += p.length;
      continue;
    }
    throw new TokenError(line, 'unexpected_char', { char: ch });
  }
  tokens.push({ type: 'eof', value: '', line });
  return tokens;
}
