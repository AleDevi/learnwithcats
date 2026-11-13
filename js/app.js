// Wires the page together: editor -> program reader -> cats -> stage, cards,
// code panels and mastery.

import { readProgram } from './program.js';
import { makeCat, drawCat, drawFace, mirror } from './cat.js';
import { translate, programIn, LANGUAGES, REAL_LANGUAGES, fieldName, valueCode } from './translate.js';
import { UI, message, coatName, translateProgram, EXAMPLES, exampleCode, KEYWORDS, VALUES } from './i18n.js';
import { PROPERTY_ORDER, ADVANCED, ADVANCED_ORDER, SPECIES_UNLOCK } from './words.js';
import { loadProgress, saveProgress, record, isMastered, unlockedSpecies, CATS_NEEDED, OPTIONS_NEEDED } from './progress.js';

const STAGE_WIDTH = 64;
const TICK_MS = 220;
const SPEED_STEPS = { 1: 0.34, 2: 0.5, 3: 1, 4: 1.5, 5: 2 };
const ALL_SPECIES = Object.keys(SPECIES_UNLOCK);

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
let srcLang = LANGUAGES.some((l) => l.id === store.get('lwc-src')) ? store.get('lwc-src') : 'cat';
let progress = loadProgress(store);
let cats = []; // cats built without errors and added to the world
let readable = []; // parsed cats that can be translated
let hasErrors = false;
let actors = [];

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

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
  $('#source-lang').value = srcLang;
  renderExamples();
  renderCheatsheet();
  renderMastery();
}

function examplesFor(src) {
  return EXAMPLES.filter((e) => (e.only ? e.only === src : e.real ? src !== 'cat' : true));
}

function renderExamples() {
  $('#examples').innerHTML =
    `<option value="">${UI[lang].pickExample}</option>` +
    examplesFor(srcLang)
      .map((e) => `<option value="${e.id}">${escapeHtml(e.label[lang])}</option>`)
      .join('');
}

function renderCheatsheet() {
  const t = UI[lang];
  const real = srcLang !== 'cat';
  const rows = [];
  const basicKeys = PROPERTY_ORDER.filter((k) => k !== 'species');
  if (!real) {
    rows.push(`<li><code>${KEYWORDS.cat[lang]} ${lang === 'it' ? 'Nome' : 'Name'}</code></li>`);
    for (const key of basicKeys) {
      const vals = Object.values(VALUES[key]).map((v) => `<code>${v[lang]}</code>`).join(' ');
      rows.push(`<li><code>${KEYWORDS[key][lang]}:</code> ${vals}</li>`);
    }
  } else {
    for (const key of basicKeys) {
      const vals = Object.keys(VALUES[key]).map((v) => `<code>${escapeHtml(valueCode(srcLang, key, v, lang))}</code>`).join(' ');
      rows.push(`<li><code>${fieldName(srcLang, key, lang, false)}</code> ${vals}</li>`);
    }
  }
  let html = `<ul>${rows.join('')}</ul>`;
  const adv = ADVANCED_ORDER.map((key) => {
    const def = ADVANCED[key];
    const name = real ? fieldName(srcLang, key, lang, true) : def[lang].label;
    let vals;
    if (def.type === 'enum') {
      vals = Object.keys(def.values).map((v) => `<code>${escapeHtml(real ? valueCode(srcLang, key, v, lang, true) : def.values[v][lang])}</code>`).join(' ');
    } else if (def.type === 'bool') {
      vals = `<code>${srcLang === 'python' ? 'True' : 'true'}</code> <code>${srcLang === 'python' ? 'False' : 'false'}</code>`;
    } else {
      vals = `${def.min}–${def.max}`;
    }
    return `<li><code>${name}</code> ${vals}</li>`;
  });
  adv.push(`<li><code>${real ? (srcLang === 'c' ? `${lang === 'it' ? 'gatto_miagola' : 'cat_meow'}(&amp;…, "…")` : `….${lang === 'it' ? 'miagola' : 'meow'}("…")`) : lang === 'it' ? 'miagola' : 'meow'}</code></li>`);
  html += `<h4>${t.advancedTitle}</h4><ul>${adv.join('')}</ul>`;
  const species = Object.keys(VALUES.species)
    .filter((s) => s !== 'cat')
    .map((s) => `<code>${escapeHtml(real ? valueCode(srcLang, 'species', s, lang) : VALUES.species[s][lang])}</code>`)
    .join(' ');
  html += `<h4>${t.speciesTitle}</h4><ul><li><code>${real ? fieldName(srcLang, 'species', lang, false) : KEYWORDS.species[lang] + ':'}</code> ${species}</li></ul>`;
  $('#cheatsheet-list').outerHTML = `<div id="cheatsheet-list">${html}</div>`;
}

const LANG_LABEL = Object.fromEntries(LANGUAGES.map((l) => [l.id, l.label]));

function renderMastery() {
  const t = UI[lang];
  const unlocked = unlockedSpecies(progress);
  $('#mastery').innerHTML = ALL_SPECIES.map((species) => {
    const langs = SPECIES_UNLOCK[species];
    const open = unlocked.includes(species);
    const sample = makeCat({ name: VALUES.species[species].en, props: { species: { value: species } }, adv: {} });
    const face = open ? drawFace(sample).map(cellsToHtml).join('\n') : '\n ? \n';
    const bars =
      langs.length === 1
        ? (() => {
            const p = progress[langs[0]];
            return isMastered(progress, langs[0])
              ? `${LANG_LABEL[langs[0]]}: ${t.mastered}`
              : `${LANG_LABEL[langs[0]]}: ${Math.min(p.cats.length, CATS_NEEDED)}/${CATS_NEEDED} ${t.cats}, ${Math.min(p.options.length, OPTIONS_NEEDED)}/${OPTIONS_NEEDED} ${t.options}`;
          })()
        : `${langs.filter((l) => isMastered(progress, l)).length}/4 · ${t.allFour}`;
    return `<div class="feline ${open ? 'done' : 'locked'}">
        <pre aria-hidden="true">${face}</pre>
        <div><strong>${escapeHtml(VALUES.species[species][lang])}</strong>
        <span class="bar">${open ? t.unlocked : bars}</span></div>
      </div>`;
  }).join('');
}

// ---------- program ----------

function update() {
  const source = editor.value;
  store.set('lwc-program', source);
  store.set('lwc-src', srcLang);
  renderGutter();
  const result = readProgram(source, srcLang, unlockedSpecies(progress));
  const messages = [
    ...result.errors.map((e) => ({ ...e, kind: 'error' })),
    ...result.notes.map((e) => ({ ...e, kind: 'note' })),
  ];
  const built = [];
  const ok = [];
  for (const p of result.cats) {
    const cat = makeCat(p);
    messages.push(...cat.errors.map((e) => ({ ...e, kind: 'error' })));
    messages.push(...cat.notes.map((e) => ({ ...e, kind: 'note' })));
    if (!cat.errors.length) {
      ok.push(p);
      if (p.added) built.push(cat);
    }
  }
  messages.sort((a, b) => a.line - b.line);
  hasErrors = messages.some((m) => m.kind === 'error');
  cats = built;
  readable = ok;
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
  const items = messages.map(
    (m) => `<li class="${m.kind}"><button type="button" data-line="${m.line}">${t.line} ${m.line}</button> ${escapeHtml(message(m, lang))}</li>`,
  );
  if (!hasErrors) items.unshift(`<li class="ok">${t.allGood}</li>`);
  list.innerHTML = items.join('');
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

// Scrolls only the code box, never the whole page.
function scrollInside(box, el) {
  const top = el.offsetTop - box.offsetTop;
  if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) {
    box.scrollTop = Math.max(0, top - box.clientHeight / 3);
  }
}

let codeLang = store.get('lwc-code') || 'python';
let lastCode = {};

function visibleTabs() {
  return LANGUAGES.filter((l) => l.id !== srcLang);
}

function renderTabs() {
  if (codeLang === srcLang || !LANGUAGES.some((l) => l.id === codeLang)) codeLang = visibleTabs()[0].id;
  $('#code-tabs').innerHTML = visibleTabs()
    .map((l) => `<button type="button" role="tab" data-code="${l.id}" aria-selected="${l.id === codeLang}">${l.label}</button>`)
    .join('');
}

function renderCode() {
  const code = translate(readable, lang);
  const lines = code[codeLang];
  // lines that did not exist in the previous version light up for a moment
  const before = new Set(lastCode[codeLang] || []);
  const isFirst = !lastCode[codeLang];
  lastCode = Object.fromEntries(Object.entries(code).map(([k, v]) => [k, v.map((l) => l.text)]));
  const view = $('#code');
  view.innerHTML = lines
    .map((line) => {
      const changed = !isFirst && line.text && !before.has(line.text);
      return `<span class="code-line${changed ? ' changed' : ''}" data-src="${line.src ?? ''}">${escapeHtml(line.text) || ' '}</span>`;
    })
    .join('');
  const first = view.querySelector('.changed');
  if (first) scrollInside(view, first);
  highlightCurrentLine();
}

function highlightCurrentLine() {
  const line = editor.value.slice(0, editor.selectionStart).split('\n').length;
  let firstActive = null;
  document.querySelectorAll('.code-line').forEach((el) => {
    const on = el.dataset.src === String(line);
    el.classList.toggle('active', on);
    if (on && !firstActive) firstActive = el;
  });
  if (firstActive) scrollInside($('#code'), firstActive);
}

function status(text, kind) {
  const el = $('#run-status');
  el.textContent = text;
  el.className = `run-status ${kind}`;
}

// ---------- run ----------

function run() {
  const t = UI[lang];
  update();
  if (hasErrors) {
    status(t.runFirst, 'error');
    return;
  }
  const lines = [t.ran];
  if (REAL_LANGUAGES.includes(srcLang)) {
    const result = record(progress, srcLang, readable);
    progress = result.progress;
    saveProgress(store, progress);
    for (const l of result.newlyMastered) lines.push(t.newMastery(l));
    for (const s of result.newlyUnlocked) lines.push(t.newFeline(s));
    renderMastery();
    if (result.newlyUnlocked.length || result.newlyMastered.length) {
      status(lines.join(' '), 'party');
      $('#mastery-box').open = true;
    } else status(lines.join(' '), 'ok');
  } else status(lines.join(' '), 'ok');
  // the cats say what the program told them to, one line after the other
  let delay = 0;
  for (const cat of cats) {
    for (const action of cat.actions) {
      const actor = actors.find((a) => a.cat.name === cat.name);
      if (!actor) continue;
      setTimeout(() => {
        actor.say = action.text;
        actor.sayUntil = Date.now() + 2600;
        renderStage();
      }, delay);
      delay += 1400;
    }
  }
}

// ---------- stage ----------

function syncActors() {
  actors = cats.map((cat, i) => {
    const old = actors.find((a) => a.cat.name === cat.name);
    const width = drawCat(cat).at(0).length;
    return {
      cat,
      width,
      x: old ? Math.max(0, Math.min(old.x, STAGE_WIDTH - width)) : Math.max(0, Math.floor((STAGE_WIDTH - width) * ((i * 0.37 + 0.2) % 1))),
      dir: old ? old.dir : i % 2 ? -1 : 1,
      mode: old ? old.mode : 'walk',
      timer: old ? old.timer : 6 + i * 3,
      step: old ? old.step : 0,
      acc: 0,
      say: old ? old.say : null,
      sayUntil: old ? old.sayUntil : 0,
    };
  });
}

function tick() {
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
        if (a.x <= 0 || a.x >= STAGE_WIDTH - a.width) {
          a.x = Math.max(0, Math.min(a.x, STAGE_WIDTH - a.width));
          a.dir *= -1;
        }
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
  const now = Date.now();
  const rows = [];
  for (const a of actors) {
    const pose = a.mode === 'walk' ? (a.step % 2 ? 'walkB' : 'walkA') : a.mode;
    const say = a.say && a.sayUntil > now ? a.say : null;
    let grid = drawCat(a.cat, pose, say);
    // cats are drawn facing right; walking left means mirrored
    if (a.dir < 0) grid = mirror(grid);
    const shift = a.dir < 0 ? grid[0].length - a.width : 0; // keep the body still when a bubble appears
    for (const row of grid) {
      const line = Array.from({ length: STAGE_WIDTH }, () => ({ ch: ' ' }));
      row.forEach((cell, i) => {
        const x = a.x + i - shift;
        if (x >= 0 && x < STAGE_WIDTH && (cell.ch !== ' ' || cell.bg)) line[x] = cell;
      });
      rows.push(cellsToHtml(line));
    }
  }
  stage.innerHTML = `<pre aria-label="${escapeHtml(cats.map((c) => c.name).join(', '))}">${rows.join('\n')}</pre>`;
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
    editor.setRangeText(srcLang === 'python' || srcLang === 'c' ? '    ' : '  ', editor.selectionStart, editor.selectionEnd, 'end');
    update();
  }
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    run();
  }
});

$('#run').addEventListener('click', run);

$('#messages').addEventListener('click', (e) => {
  const line = Number(e.target.dataset?.line);
  if (!line) return;
  const lines = editor.value.split('\n');
  const start = lines.slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0);
  editor.focus();
  editor.setSelectionRange(start, start + (lines[line - 1] || '').length);
  highlightCurrentLine();
});

// An example written in one language, shown in the language being used.
function loadExample(ex) {
  const from = ex.lang || 'cat';
  if (from === srcLang) return from === 'cat' ? exampleCode(ex, lang) : ex.code;
  const parsed = readProgram(from === 'cat' ? ex.code : ex.code, from, ALL_SPECIES);
  return programIn(parsed.cats, srcLang, lang);
}

$('#examples').addEventListener('change', (e) => {
  const ex = EXAMPLES.find((x) => x.id === e.target.value);
  if (!ex) return;
  editor.value = loadExample(ex);
  e.target.value = '';
  status('', '');
  update();
});

$('#source-lang').addEventListener('change', (e) => {
  const next = e.target.value;
  update();
  if (hasErrors) {
    e.target.value = srcLang;
    status(UI[lang].switchBlocked, 'error');
    return;
  }
  editor.value = programIn(readable, next, lang);
  srcLang = next;
  status('', '');
  renderTabs();
  renderExamples();
  renderCheatsheet();
  delete lastCode[codeLang];
  update();
});

document.querySelectorAll('.lang-switch button').forEach((b) =>
  b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    const next = b.dataset.lang;
    if (srcLang === 'cat') editor.value = translateProgram(editor.value, next);
    else if (!hasErrors) editor.value = programIn(readable, srcLang, next);
    lang = next;
    store.set('lwc-lang', lang);
    applyLanguage();
    update();
  }),
);

$('#code-tabs').addEventListener('click', (e) => {
  const id = e.target.dataset?.code;
  if (!id) return;
  codeLang = id;
  store.set('lwc-code', id);
  delete lastCode[id];
  renderTabs();
  renderCode();
});

// ---------- start ----------

editor.value = store.get('lwc-program') ?? exampleCode(EXAMPLES[0], lang);
renderTabs();
applyLanguage();
update();
setInterval(tick, TICK_MS);
