// Wires the page together: editor -> parser -> cats -> stage, cards and code panels.

import { parse } from './parser.js';
import { makeCat, drawCat, drawFace, mirror } from './cat.js';
import { translate, LANGUAGES } from './translate.js';
import { UI, message, coatName, translateProgram, EXAMPLES, exampleCode, KEYWORDS, VALUES } from './i18n.js';
import { PROPERTY_ORDER } from './words.js';

const STAGE_WIDTH = 64;
const TICK_MS = 220;

const $ = (sel) => document.querySelector(sel);
const editor = $('#editor');
const gutter = $('#gutter');

const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage may be unavailable; the page works without it */
    }
  },
};

let lang = store.get('lwc-lang') === 'it' ? 'it' : 'en';
let cats = [];
let actors = [];
let parsedCats = [];

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function cellsToHtml(row) {
  return row
    .map((cell) => {
      if (!cell.fg && !cell.bg) return escapeHtml(cell.ch);
      const style = `${cell.fg ? `color:${cell.fg};` : ''}${cell.bg ? `background:${cell.bg};` : ''}`;
      return `<span style="${style}">${escapeHtml(cell.ch)}</span>`;
    })
    .join('');
}

// ---------- static text ----------

function applyLanguage() {
  const t = UI[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-t]').forEach((el) => {
    el.textContent = t[el.dataset.t];
  });
  document.querySelectorAll('.lang-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  const select = $('#examples');
  select.innerHTML = `<option value="">${t.pickExample}</option>` + EXAMPLES.map((e) => `<option value="${e.id}">${escapeHtml(e.label[lang])}</option>`).join('');
  renderCheatsheet();
}

function renderCheatsheet() {
  const rows = [`<li><code>${KEYWORDS.cat[lang]} ${lang === 'it' ? 'Nome' : 'Name'}</code></li>`];
  for (const key of PROPERTY_ORDER) {
    const vals = Object.values(VALUES[key]).map((v) => `<code>${v[lang]}</code>`).join(' ');
    rows.push(`<li><code>${KEYWORDS[key][lang]}:</code> ${vals}</li>`);
  }
  $('#cheatsheet-list').innerHTML = rows.join('');
}

// ---------- program ----------

function update() {
  const source = editor.value;
  store.set('lwc-program', source);
  renderGutter();
  const result = parse(source);
  parsedCats = result.cats;
  const messages = [...result.errors.map((e) => ({ ...e, kind: 'error' }))];
  const built = [];
  for (const p of result.cats) {
    const cat = makeCat(p);
    messages.push(...cat.errors.map((e) => ({ ...e, kind: 'error' })));
    messages.push(...cat.notes.map((e) => ({ ...e, kind: 'note' })));
    if (!cat.errors.length) built.push(cat);
  }
  messages.sort((a, b) => a.line - b.line);
  cats = built;
  renderMessages(messages);
  renderCards();
  renderCode();
  syncActors();
  renderStage();
}

function renderGutter() {
  const count = editor.value.split('\n').length;
  gutter.textContent = Array.from({ length: count }, (_, i) => i + 1).join('\n');
  gutter.scrollTop = editor.scrollTop;
}

function renderMessages(messages) {
  const t = UI[lang];
  const list = $('#messages');
  if (!messages.some((m) => m.kind === 'error') && !messages.length) {
    list.innerHTML = `<li class="ok">${t.allGood}</li>`;
    return;
  }
  list.innerHTML = messages
    .map(
      (m) =>
        `<li class="${m.kind}"><button type="button" data-line="${m.line}">${t.line} ${m.line}</button> ${escapeHtml(message(m, lang))}</li>`,
    )
    .join('');
  if (!messages.some((m) => m.kind === 'error')) list.insertAdjacentHTML('afterbegin', `<li class="ok">${t.allGood}</li>`);
}

function renderCards() {
  const t = UI[lang];
  $('#cards').innerHTML = cats
    .map(
      (cat) => `
      <article class="card">
        <pre class="face" aria-hidden="true">${drawFace(cat).map(cellsToHtml).join('\n')}</pre>
        <div>
          <h3>${escapeHtml(cat.name)}</h3>
          <dl>
            <dt>${t.sex}</dt><dd>${t[cat.genome.sex]}</dd>
            <dt>${t.coat}</dt><dd>${escapeHtml(coatName(cat, lang))}</dd>
            <dt>${t.dna}</dt><dd><code>${cat.dna}</code></dd>
            <dt>${t.lifespan}</dt><dd>${cat.lifespan} ${t.days}</dd>
          </dl>
        </div>
      </article>`,
    )
    .join('');
}

function renderCode() {
  const valid = parsedCats.filter((p) => cats.some((c) => c.name === p.name));
  const code = translate(valid, lang);
  $('#code').innerHTML = LANGUAGES.map(
    (l) => `
    <section class="code-panel">
      <h3>${l.label}</h3>
      <pre>${code[l.id].map((line) => `<span class="code-line" data-src="${line.src ?? ''}">${escapeHtml(line.text) || ' '}</span>`).join('')}</pre>
    </section>`,
  ).join('');
  highlightCurrentLine();
}

function highlightCurrentLine() {
  const line = editor.value.slice(0, editor.selectionStart).split('\n').length;
  document.querySelectorAll('.code-line').forEach((el) => el.classList.toggle('active', el.dataset.src === String(line)));
}

// ---------- stage ----------

function syncActors() {
  actors = cats.map((cat, i) => {
    const old = actors.find((a) => a.cat.name === cat.name);
    const width = drawCat(cat).at(0).length;
    return {
      cat,
      width,
      x: old ? Math.min(old.x, STAGE_WIDTH - width) : Math.floor((STAGE_WIDTH - width) * ((i * 0.37 + 0.2) % 1)),
      dir: old ? old.dir : i % 2 ? -1 : 1,
      mode: old ? old.mode : 'walk',
      timer: old ? old.timer : 6 + i * 3,
      step: 0,
    };
  });
}

function tick() {
  for (const a of actors) {
    a.timer -= 1;
    if (a.timer <= 0) {
      const r = Math.random();
      if (a.mode === 'walk') {
        a.mode = r < 0.6 ? 'sit' : 'sleep';
        a.timer = a.mode === 'sit' ? 8 + Math.floor(Math.random() * 10) : 18 + Math.floor(Math.random() * 16);
      } else {
        a.mode = 'walk';
        a.timer = 15 + Math.floor(Math.random() * 30);
        if (Math.random() < 0.4) a.dir *= -1;
      }
    }
    if (a.mode === 'walk') {
      a.step += 1;
      a.x += a.dir;
      if (a.x <= 0 || a.x >= STAGE_WIDTH - a.width) {
        a.x = Math.max(0, Math.min(a.x, STAGE_WIDTH - a.width));
        a.dir *= -1;
      }
    }
  }
  renderStage();
}

function renderStage() {
  const stage = $('#stage');
  if (!actors.length) {
    stage.innerHTML = `<p class="empty">${UI[lang].noCats}</p>`;
    return;
  }
  const rows = [];
  for (const a of actors) {
    const pose = a.mode === 'walk' ? (a.step % 2 ? 'walkB' : 'walkA') : a.mode;
    let grid = drawCat(a.cat, pose);
    // cats are drawn facing right; walking left means mirrored
    if (a.dir < 0) grid = mirror(grid);
    for (const row of grid) {
      const line = Array.from({ length: STAGE_WIDTH }, () => ({ ch: ' ' }));
      row.forEach((cell, i) => {
        if (cell.ch !== ' ' || cell.bg) line[a.x + i] = cell;
      });
      rows.push(cellsToHtml(line));
    }
  }
  stage.innerHTML = `<pre aria-label="${cats.map((c) => c.name).join(', ')}">${rows.join('\n')}</pre>`;
}

// ---------- events ----------

let pending = null;
editor.addEventListener('input', () => {
  clearTimeout(pending);
  pending = setTimeout(update, 150);
  renderGutter();
});
editor.addEventListener('scroll', () => {
  gutter.scrollTop = editor.scrollTop;
});
['keyup', 'click', 'select'].forEach((ev) => editor.addEventListener(ev, highlightCurrentLine));

editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    editor.setRangeText('  ', editor.selectionStart, editor.selectionEnd, 'end');
    update();
  }
});

$('#messages').addEventListener('click', (e) => {
  const line = e.target.dataset?.line;
  if (!line) return;
  const lines = editor.value.split('\n');
  const start = lines.slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0);
  editor.focus();
  editor.setSelectionRange(start, start + lines[line - 1].length);
  highlightCurrentLine();
});

$('#examples').addEventListener('change', (e) => {
  const ex = EXAMPLES.find((x) => x.id === e.target.value);
  if (!ex) return;
  editor.value = exampleCode(ex, lang);
  e.target.value = '';
  update();
});

document.querySelectorAll('.lang-switch button').forEach((b) =>
  b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang;
    store.set('lwc-lang', lang);
    editor.value = translateProgram(editor.value, lang);
    applyLanguage();
    update();
  }),
);

// ---------- start ----------

editor.value = store.get('lwc-program') ?? exampleCode(EXAMPLES[0], lang);
applyLanguage();
update();
setInterval(tick, TICK_MS);
