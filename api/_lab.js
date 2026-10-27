// Julia's lab (/lab): the live values (public/js/tuning.js) and her notebook, in one Redis key.
//   GET  /api/config                              public: { version, values } for the game
//   POST /api/lab { action: 'login', password }   sets the session cookie (api/_labauth.js)
//   GET  /api/lab                                 values, defaults, ranges and notebook
//   POST /api/lab { action: 'set', values, note } | { action: 'undo', version, note } | { action: 'reset', note }
import { createHash } from 'node:crypto';
import { TUNABLE, DEFAULTS, cleanValues } from '../public/js/tuning.js';
import { rightPassword, makeToken, cookieHeader, authorized } from './_labauth.js';

export const LAB_KEY = 'lab:config';
const KEEP = 10 * 365 * 86400;
const MAX_NOTES = 500;
const NOTE_LENGTH = 500;
const TRIES = 20;
const TRIES_ALL = 200;
const TRIES_WINDOW = 15 * 60;
const ipKey = (request) => {
  const ip = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0] ?? '-';
  return `lab:tries:${createHash('sha256').update(ip).digest('hex').slice(0, 16)}`;
};
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
const empty = () => ({ rev: 0, version: 0, values: {}, notes: [] });
const effective = (s) => ({ ...DEFAULTS, ...s.values });
// Keeps only what differs from config.js.
const own = (values) => Object.fromEntries(Object.entries(values).filter(([p, v]) => DEFAULTS[p] !== v));
const cleanNote = (note) =>
  [...String(note ?? '')]
    .map((c) => (c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 ? ' ' : c))
    .join('')
    .trim()
    .slice(0, NOTE_LENGTH);

export function createConfigHandler(store) {
  return async function handle() {
    const s = (await store.get(LAB_KEY).catch(() => null)) ?? empty();
    return new Response(JSON.stringify({ version: s.version, values: s.values }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=0, s-maxage=15' },
    });
  };
}

export function createLabHandler(store, { password, now = Date.now } = {}) {
  async function save(change) {
    for (let i = 0; i < 3; i++) {
      const cur = (await store.get(LAB_KEY)) ?? empty();
      const next = change(cur);
      if (!next) return null;
      if (await store.cas(LAB_KEY, cur.rev, { ...next, rev: cur.rev + 1 }, KEEP)) return next;
    }
    throw new Error('stale');
  }
  const view = (s) => ({
    version: s.version,
    values: effective(s),
    defaults: DEFAULTS,
    tunable: TUNABLE,
    notes: [...s.notes].reverse(),
  });
  // One notebook entry with what changed from `before` to `after`.
  const entry = (s, before, after, extra) => {
    const changes = Object.keys(TUNABLE)
      .filter((p) => before[p] !== after[p])
      .map((path) => ({ path, from: before[path], to: after[path] }));
    if (!changes.length) return null;
    const version = s.version + 1;
    const notes = [...s.notes, { version, at: new Date(now()).toISOString(), changes, ...extra }].slice(
      -MAX_NOTES,
    );
    return { version, values: own(after), notes };
  };

  return async function handle(request) {
    if (!password) return json({ error: 'off' }, 503);
    const input = request.method === 'POST' ? await request.json().catch(() => null) : null;
    if (input?.action === 'login') {
      // Per-IP budget first, so one source can't use up the global backstop.
      if ((await store.hit(ipKey(request), TRIES_WINDOW)) > TRIES) return json({ error: 'rate' }, 429);
      if ((await store.hit('lab:tries', TRIES_WINDOW)) > TRIES_ALL) return json({ error: 'rate' }, 429);
      if (!(await rightPassword(password, input.password))) return json({ error: 'password' }, 401);
      return json({ ok: true }, 200, { 'Set-Cookie': cookieHeader(await makeToken(password, now())) });
    }
    if (!(await authorized(request, password))) return json({ error: 'auth' }, 401);
    if (request.method === 'GET') return json(view((await store.get(LAB_KEY)) ?? empty()));
    if (request.method !== 'POST' || !input) return json({ error: 'bad' }, 400);
    const note = cleanNote(input.note);
    try {
      const saved = await save((s) => {
        const before = effective(s);
        if (input.action === 'set') {
          const after = { ...before, ...cleanValues(input.values) };
          cleanValues(own(after));
          return entry(s, before, after, { kind: 'set', note });
        }
        if (input.action === 'undo') {
          const target = s.notes.find((n) => n.version === input.version);
          if (!target) return null;
          const after = { ...before, ...Object.fromEntries(target.changes.map((c) => [c.path, c.from])) };
          cleanValues(own(after));
          return entry(s, before, after, { kind: 'undo', undoes: target.version, note });
        }
        if (input.action === 'reset') return entry(s, before, { ...DEFAULTS }, { kind: 'reset', note });
        throw new Error('action');
      });
      if (!saved) return json({ error: 'nothing' }, 400);
      return json(view(saved));
    } catch (e) {
      return json(
        { error: e.message === 'stale' ? 'stale' : 'invalid', field: e.message },
        e.message === 'stale' ? 409 : 400,
      );
    }
  };
}
