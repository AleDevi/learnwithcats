// Where the shared world is kept.
//
// RemoteStore talks to the small PHP API in /api (the real, shared world).
// LocalStore keeps a world in this browser only: used for previews and when
// the API can't be reached, with a few neighbour cats so the square isn't empty.

import { makeRng } from '../rng.js';
import { DAY, lifeOf, inherit, kittenName } from './life.js';
import { makeCat } from '../cat.js';
import { isBlocked } from './moderation.js';

export const MAX_LIVING_PER_PLAYER = 3;

const API = 'api/index.php';

export class WorldError extends Error {
  constructor(code, params = {}) {
    super(code);
    this.code = code;
    this.params = params;
  }
}

async function call(action, body, query = '') {
  let res;
  try {
    res = await fetch(`${API}?action=${action}${query}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new WorldError('network');
  }
  let data;
  try {
    data = await res.json();
  } catch {
    throw new WorldError('server');
  }
  if (!res.ok || data.error) throw new WorldError(data.error || 'server', data.params || {});
  return data;
}

export class RemoteStore {
  constructor() {
    this.mode = 'shared';
  }
  async list(player) {
    const data = await call('world', null, player ? `&player=${encodeURIComponent(player.id)}` : '');
    return { now: data.now, records: data.cats };
  }
  async add(player, records) {
    return call('add', { player, cats: records });
  }
  async addLitter(litter) {
    return call('litter', litter);
  }
  async report(id, player) {
    return call('report', { id, player });
  }
}

const LOCAL_KEY = 'lwc-world';

// A few cats from pretend neighbours, at different ages, plus two that already
// died (so the cemetery isn't empty) and a kitten with its parents.
// `part` is how much of its life a cat has lived.
const NEIGHBOURS = [
  { name: 'Tofu', owner: 'Marco', part: 0.5, colors: ['cream', 'white'], sex: 'male' },
  { name: 'Nebbia', owner: 'Sara', part: 0.3, colors: ['grey'], sex: 'female' },
  { name: 'Zucca', owner: 'Giulia', part: 0.6, colors: ['orange'], sex: 'male' },
  { name: 'Ombra', owner: 'Luca', part: 0.88, colors: ['black'], sex: 'female' },
  { name: 'Briciola', owner: 'Marco', part: 0.4, colors: ['orange', 'black', 'white'], sex: 'female' },
  { name: 'Pepe', owner: 'Sara', part: 1.3, colors: ['black', 'white'], sex: 'male' },
  { name: 'Mirtillo', owner: 'Luca', part: 1.9, colors: ['grey', 'white'], sex: 'male' },
];

function neighbours(now) {
  const tag = now.toString(36);
  const records = NEIGHBOURS.map((s, i) => {
    const props = { colors: { value: s.colors }, sex: { value: s.sex } };
    const cat = makeCat({ name: s.name, props, adv: {} });
    const born = Math.floor(now - s.part * cat.lifespan * DAY);
    return toRecord(cat, { id: `demo${i}${tag}`, owner: `demo-${s.owner}`, ownerName: s.owner, srcLang: 'cat', born });
  });
  const [tofu, , , , briciola] = records;
  const rng = makeRng(`demo-kitten:${tag}`);
  const { genome, props } = inherit(briciola, tofu, rng);
  const lifespan = 4 + genome.L[0] + genome.L[1];
  records.push({
    ...toRecord({ name: kittenName(rng), lifespan, genome, traits: props }),
    id: `demok${tag}`,
    owner: briciola.owner,
    ownerName: briciola.ownerName,
    srcLang: 'cat',
    born: Math.floor(now - 0.08 * lifespan * DAY),
    mother: briciola.id,
    father: tofu.id,
    litter: `${briciola.id}:${tofu.id}:demo`,
  });
  return records;
}

export class LocalStore {
  constructor(storage, blocked = null) {
    this.mode = 'local';
    this.storage = storage;
    this.blocked = blocked;
  }
  read(now) {
    let data = [];
    try {
      const saved = JSON.parse(this.storage.get(LOCAL_KEY) || 'null');
      if (Array.isArray(saved)) data = saved;
    } catch {
      /* start a new world */
    }
    // an empty square is sad: the neighbours come back with new cats
    if (!data.some((r) => lifeOf(r, now).alive)) {
      data = [...data, ...neighbours(now)];
      this.write(data);
    }
    return data;
  }
  write(records) {
    this.storage.set(LOCAL_KEY, JSON.stringify(records));
  }
  async list(player) {
    const now = Math.floor(Date.now() / 1000);
    const records = this.read(now)
      .filter((r) => now < r.born + (r.lifespan + 30) * DAY)
      .map((r) => ({ ...r, mine: !!player && r.owner === player.id }));
    return { now, records };
  }
  async add(player, incoming) {
    const now = Math.floor(Date.now() / 1000);
    const records = this.read(now);
    if (isBlocked(this.blocked, player.name)) throw new WorldError('blocked_name', { what: 'player' });
    for (const r of incoming) if (isBlocked(this.blocked, r.name)) throw new WorldError('blocked_name', { what: 'name' });
    const mine = records.filter((r) => r.owner === player.id && lifeOf(r, now).alive && !r.mother);
    if (mine.length + incoming.length > MAX_LIVING_PER_PLAYER) {
      throw new WorldError('too_many_living', { max: MAX_LIVING_PER_PLAYER, living: mine.length });
    }
    for (const r of incoming) {
      if (records.some((o) => o.name.toLowerCase() === r.name.toLowerCase() && lifeOf(o, now).alive)) {
        throw new WorldError('name_taken', { name: r.name });
      }
    }
    const rng = makeRng(`${player.id}:${now}`);
    const added = incoming.map((r) => ({
      ...r,
      id: `l${now.toString(36)}${Math.floor(rng.next() * 1e6).toString(36)}`,
      owner: player.id,
      ownerName: player.name,
      born: now,
    }));
    this.write([...records, ...added]);
    return { cats: added.map((r) => ({ ...r, mine: true })) };
  }
  async addLitter(litter) {
    const now = Math.floor(Date.now() / 1000);
    const records = this.read(now);
    if (records.some((r) => r.litter === litter.key)) return { cats: [] };
    const mother = records.find((r) => r.id === litter.mother);
    const added = litter.kittens.map((k, i) => ({
      id: `${litter.mother}-${litter.key.split(':').at(-1)}-${i}`,
      name: k.name,
      owner: mother.owner,
      ownerName: mother.ownerName,
      srcLang: mother.srcLang,
      born: litter.born,
      lifespan: 4 + k.genome.L[0] + k.genome.L[1],
      genome: k.genome,
      looks: k.looks,
      props: {},
      adv: {},
      species: null,
      mother: litter.mother,
      father: litter.father,
      litter: litter.key,
    }));
    this.write([...records, ...added]);
    return { cats: added };
  }
  async report() {
    return { ok: true };
  }
}

// What the world keeps of a cat: enough to draw it the same way everywhere.
export function toRecord(cat, extra = {}) {
  return {
    name: cat.name,
    lifespan: cat.lifespan,
    genome: cat.genome,
    looks: cat.traits,
    props: cat.props || {},
    adv: cat.adv || {},
    species: cat.species || null,
    mother: null,
    father: null,
    litter: null,
    ...extra,
  };
}

// Back from a record to a drawable cat.
export function fromRecord(record) {
  const props = {};
  for (const [k, v] of Object.entries(record.looks || {})) props[k] = { value: v };
  if (record.species) props.species = { value: record.species };
  const adv = {};
  for (const [k, v] of Object.entries(record.adv || {})) adv[k] = { value: v };
  return makeCat({ name: record.name, props, adv, genome: record.genome, actions: [] });
}

// The shared world when the API answers, otherwise a world in this browser.
export async function connect(storage, blocked) {
  try {
    const remote = new RemoteStore();
    await remote.list();
    return remote;
  } catch {
    return new LocalStore(storage, blocked);
  }
}
