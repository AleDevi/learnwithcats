// Wires the page together: editor -> program reader -> cats -> stage, cards,
// code panels and mastery.

import { readProgram } from './program.js';
import { makeCat, drawFace } from './cat.js';
import { escapeHtml, cellsToHtml } from './html.js';
import { placeActors, stepActors, actorsToHtml } from './motion.js';
import { translate, programIn, LANGUAGES, REAL_LANGUAGES, fieldName, valueCode } from './translate.js';
import { UI, message, MESSAGES, coatName, translateProgram, EXAMPLES, exampleCode, KEYWORDS, VALUES } from './i18n.js';
import { PROPERTY_ORDER, ADVANCED, ADVANCED_ORDER, SPECIES_UNLOCK } from './words.js';
import { connect, toRecord, MAX_LIVING_PER_PLAYER } from './world/store.js';
import { lifeOf, dueLitters } from './world/life.js';
import { createWorldView, livingHtml, cemeteryHtml } from './world/view.js';
import { loadBlockedWords, isBlocked } from './world/moderation.js';
import { loadProgress, saveProgress, record, isMastered, unlockedSpecies, CATS_NEEDED, OPTIONS_NEEDED } from './progress.js';

const STAGE_WIDTH = 64;
const TICK_MS = 220;
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
let blocked = null; // words not allowed in names, loaded at start
let ranOk = false; // the program ran without errors since the last change

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
  $('#player-name').placeholder = t.playerNamePlaceholder;
  renderWorldMode();
  renderWorldLists();
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
    if (isBlocked(blocked, p.name)) cat.errors.push({ line: p.line, code: 'blocked_name', params: { what: 'name' } });
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
  if (source !== lastRunSource) ranOk = false;
  $('#to-world').disabled = !ranOk;
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

let lastRunSource = null;

function run() {
  const t = UI[lang];
  update();
  if (hasErrors) {
    status(t.runFirst, 'error');
    return;
  }
  lastRunSource = editor.value;
  ranOk = cats.length > 0;
  $('#to-world').disabled = !ranOk;
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
  actors = placeActors(cats, actors, STAGE_WIDTH);
}

function tick() {
  stepActors(actors, STAGE_WIDTH);
  renderStage();
}

function renderStage() {
  const stage = $('#stage');
  if (!actors.length) {
    stage.innerHTML = `<p class="empty">${UI[lang].noCats}</p>`;
    return;
  }
  stage.innerHTML = `<pre aria-label="${escapeHtml(cats.map((c) => c.name).join(', '))}">${actorsToHtml(actors, STAGE_WIDTH)}</pre>`;
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

// ---------- the shared world ----------

const player = (() => {
  let saved = null;
  try {
    saved = JSON.parse(store.get('lwc-player') || 'null');
  } catch {
    /* new player */
  }
  if (saved && /^[A-Za-z0-9-]{16,64}$/.test(saved.id)) return saved;
  const id = globalThis.crypto?.randomUUID?.() || Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const fresh = { id, name: '' };
  store.set('lwc-player', JSON.stringify(fresh));
  return fresh;
})();

const reported = new Set((() => {
  try {
    return JSON.parse(store.get('lwc-reported') || '[]');
  } catch {
    return [];
  }
})());

let world = null; // the store
let worldRecords = [];
let worldNow = Math.floor(Date.now() / 1000);
let worldView = 'square';
const square = createWorldView();

const worldError = (err) => message({ code: MESSAGES[err.code] ? err.code : 'server', params: err.params }, lang);

function worldStatus(text, kind) {
  const el = $('#world-status');
  el.textContent = text;
  el.className = `run-status ${kind}`;
}

function renderWorldMode() {
  if (!world) return;
  const el = $('#world-mode');
  el.textContent = world.mode === 'local' ? UI[lang].localMode : UI[lang].sharedMode;
  el.className = `world-mode ${world.mode}`;
}

function splitWorld() {
  const now = worldNow;
  const visible = worldRecords.filter((r) => !reported.has(r.id));
  return {
    living: visible.filter((r) => lifeOf(r, now).alive),
    dead: visible.filter((r) => !lifeOf(r, now).alive),
  };
}

function renderWorldLists() {
  if (!world) return;
  const t = UI[lang];
  const { living, dead } = splitWorld();
  $('#living').innerHTML = livingHtml(living, worldRecords, worldNow, t);
  $('#cemetery').innerHTML = cemeteryHtml(dead, worldNow, t, lang === 'it' ? 'it-IT' : 'en-GB') || `<li class="empty">${t.emptyCemetery}</li>`;
  const mine = living.filter((r) => r.mine && !r.mother).length;
  $('#your-count').textContent = t.yourCount(mine, MAX_LIVING_PER_PLAYER);
  renderSquare();
}

function renderSquare() {
  $('#square').innerHTML = square.squareHtml(UI[lang].nobodyHere);
}

async function refreshWorld() {
  if (!world) return;
  try {
    let { now, records } = await world.list(player);
    // anyone's browser can bring today's kittens into the world: they are the
    // same everywhere, and the server keeps only the first copy
    const litters = dueLitters(records, now);
    if (litters.length) {
      const born = [];
      for (const litter of litters) {
        try {
          const res = await world.addLitter(litter);
          if (res.cats.length) born.push(litter);
        } catch {
          /* someone else was faster, or the server said no */
        }
      }
      ({ now, records } = await world.list(player));
      for (const litter of born) {
        const mother = records.find((r) => r.id === litter.mother);
        if (mother?.mine) worldStatus(UI[lang].newKittens(mother.name, litter.kittens.map((k) => k.name).join(', ')), 'party');
      }
    }
    worldRecords = records;
    worldNow = now;
    clockOffset = now - Date.now() / 1000;
    square.setCats(splitWorld().living, now);
    renderWorldLists();
  } catch (err) {
    worldStatus(worldError(err), 'error');
  }
}

let clockOffset = 0; // server time minus this computer's time

async function putInWorld() {
  const t = UI[lang];
  const name = $('#player-name').value.trim();
  if (!ranOk || hasErrors) return status(t.runBeforeWorld, 'error');
  if (!name) {
    status(t.needName, 'error');
    $('#player-name').focus();
    return;
  }
  if (!/^[\p{L}\p{N}][\p{L}\p{N} ]{0,19}$/u.test(name)) return status(message({ code: 'bad_name', params: { name } }, lang), 'error');
  if (isBlocked(blocked, name)) return status(message({ code: 'blocked_name', params: { what: 'player' } }, lang), 'error');
  player.name = name;
  store.set('lwc-player', JSON.stringify(player));
  const button = $('#to-world');
  button.disabled = true;
  try {
    const res = await world.add(player, cats.map((cat) => toRecord(cat, { srcLang })));
    status(t.added(res.cats.map((c) => c.name).join(', ')), 'party');
    ranOk = false;
    await refreshWorld();
  } catch (err) {
    status(worldError(err), 'error');
    button.disabled = false;
  }
}

async function reportCat(id) {
  const t = UI[lang];
  const cat = worldRecords.find((r) => r.id === id);
  if (!cat || !window.confirm(t.reportConfirm(cat.name))) return;
  try {
    await world.report(id, { id: player.id, name: player.name || 'Player' });
  } catch {
    /* hidden for this player anyway */
  }
  reported.add(id);
  store.set('lwc-reported', JSON.stringify([...reported]));
  worldStatus(t.reported, 'ok');
  square.setCats(splitWorld().living, worldNow);
  renderWorldLists();
}

function showWorldView(view) {
  worldView = view;
  document.querySelectorAll('.world-tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === view)));
  $('#square-view').hidden = view !== 'square';
  $('#cemetery-view').hidden = view !== 'cemetery';
}

$('#to-world').addEventListener('click', putInWorld);
$('#living').addEventListener('click', (e) => {
  const id = e.target.dataset?.report;
  if (id) reportCat(id);
});
$('.world-tabs').addEventListener('click', (e) => {
  if (e.target.dataset?.view) showWorldView(e.target.dataset.view);
});
$('#player-name').value = player.name || '';
$('#player-name').addEventListener('change', (e) => {
  player.name = e.target.value.trim();
  store.set('lwc-player', JSON.stringify(player));
});

// ---------- start ----------

editor.value = store.get('lwc-program') ?? exampleCode(EXAMPLES[0], lang);
renderTabs();
applyLanguage();
update();
setInterval(() => {
  tick();
  if (world && worldView === 'square' && !document.hidden) {
    square.tick();
    renderSquare();
  }
}, TICK_MS);

(async () => {
  blocked = await loadBlockedWords();
  update();
  world = await connect(store, blocked);
  renderWorldMode();
  await refreshWorld();
  // ages change slowly: once a minute is plenty
  setInterval(() => {
    worldNow = Math.floor(Date.now() / 1000 + clockOffset);
    refreshWorld();
  }, 60000);
})();
