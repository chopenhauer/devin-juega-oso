// Referee for online 1 vs 1 games (docs/ONLINE.md). One endpoint, /api/sala:
//   GET  ?code=K7QD2&rev=3   room state (just {rev, same} if unchanged), settles the clock
//   GET  ?stats=1            this month's anonymous counters
//   POST {action: create | join | move | rematch | leave, ...}
// The client only sends intentions; turns, clocks, scores and winners are decided here.
import { createHash, randomBytes, randomInt } from 'node:crypto';
import * as Match from '../public/js/match.js';

export const SIZES = [4, 5, 6, 7, 8];
export const ROOM_TTL = 24 * 3600;
const STATS_TTL = 400 * 24 * 3600;
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_RE = new RegExp(`^[${CODE_CHARS}]{5}$`);
const RATE = { limit: 20, window: 600 };
const MOVES = {
  place: (m, p, x, now) => Match.place(m, p, x.index, x.letter, now),
  swap: (m, p, x, now) => Match.swap(m, p, x.index, now),
  sos: (m, p, x, now) => Match.sos(m, p, now),
  power: (m, p, x, now) => Match.usePower(m, p, x.power, now),
};

const hash = (s) => createHash('sha256').update(s).digest('hex');
const newCode = () => Array.from({ length: 5 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('');
const month = (now) => `stats:${new Date(now).toISOString().slice(0, 7)}`;

// Nicknames are shown to the rival: plain text, no control characters, 16 max.
const cleanName = (s, fallback) =>
  (typeof s === 'string' ? s.replace(/[\p{C}<>]/gu, '').trim() : '').slice(0, 16) || fallback;
const cleanAvatar = (s, fallback) =>
  typeof s === 'string' && s.length > 0 && s.length <= 16 && !/[\p{L}\p{N}<>]/u.test(s) ? s : fallback;

class HttpError extends Error {
  constructor(status, code, room) {
    super(code);
    Object.assign(this, { status, code, room });
  }
}

// What both players may see: never the seat tokens.
export function publicView(room, now) {
  const m = room.match && Match.fromJSON(room.match);
  return {
    code: room.code,
    rev: room.rev,
    status: room.status,
    game: room.game,
    seats: room.seats.map(({ name, avatar, rematch }) => ({ name, avatar, rematch: !!rematch })),
    match: m && {
      ...room.match,
      since: undefined,
      clocks: Match.clocks(m, now),
      holdMs: m.since !== null && m.since > now ? m.since - now : 0,
    },
  };
}

export function createHandler(store, { now: clock = Date.now } = {}) {
  async function load(code) {
    if (!CODE_RE.test(code ?? '')) throw new HttpError(400, 'code');
    const room = await store.get(`sala:${code}`);
    if (!room) throw new HttpError(404, 'no_room');
    return room;
  }

  async function save(room, expected) {
    room.rev = expected + 1;
    if (!(await store.cas(`sala:${room.code}`, expected, room, ROOM_TTL))) throw new HttpError(409, 'stale');
    return room;
  }

  function seatOf(room, token) {
    const h = typeof token === 'string' && hash(token);
    const seat = room.seats.findIndex((s) => s.hash === h);
    if (seat < 0) throw new HttpError(403, 'token');
    return seat;
  }

  function startGame(room, now, first) {
    room.status = 'playing';
    room.first = first;
    room.match = Match.toJSON(Match.newMatch({ size: room.size, first, now }));
    room.seats.forEach((s) => (s.rematch = false));
  }

  // Time can run out between requests: whoever asks next makes it official.
  function settle(room, now, stats) {
    if (room.status !== 'playing') return false;
    const m = Match.fromJSON(room.match);
    const events = Match.settle(m, now);
    if (!events.length) return false;
    room.match = Match.toJSON(m);
    finished(room, events, stats);
    return true;
  }

  function finished(room, events, stats) {
    const end = events.find((e) => e.type === 'end');
    if (!end) return;
    room.status = 'over';
    stats.finished = 1;
    stats[`end_${end.reason}`] = 1;
  }

  async function create(body, now, stats, ip) {
    if ((await store.hit(`rl:${hash(ip).slice(0, 16)}`, RATE.window)) > RATE.limit)
      throw new HttpError(429, 'rate');
    const size = SIZES.includes(body.size) ? body.size : 5;
    const token = randomBytes(16).toString('base64url');
    const seat = {
      hash: hash(token),
      name: cleanName(body.name, 'Jugador 1'),
      avatar: cleanAvatar(body.avatar, '🐻'),
    };
    for (let tries = 0; tries < 5; tries++) {
      const room = { code: newCode(), rev: 0, status: 'waiting', game: 1, size, seats: [seat], created: now };
      try {
        await save(room, 0);
        stats.created = 1;
        return { seat: 0, token, room };
      } catch (e) {
        if (e.code !== 'stale') throw e;
      }
    }
    throw new HttpError(503, 'busy');
  }

  async function join(body, now, stats) {
    const room = await load(body.code);
    if (room.status !== 'waiting') throw new HttpError(409, 'full');
    const avatar = cleanAvatar(body.avatar, '🐼');
    if (avatar === room.seats[0].avatar) throw new HttpError(409, 'avatar_taken', room);
    const token = randomBytes(16).toString('base64url');
    const expected = room.rev;
    room.seats.push({ hash: hash(token), name: cleanName(body.name, 'Jugador 2'), avatar });
    startGame(room, now, 0);
    await save(room, expected);
    Object.assign(stats, { joined: 1, started: 1 });
    return { seat: 1, token, room };
  }

  async function move(body, now, stats) {
    const room = await load(body.code);
    const seat = seatOf(room, body.token);
    const expected = room.rev;
    if (body.rev !== expected) throw new HttpError(409, 'stale', room);
    if (room.status !== 'playing') throw new HttpError(409, 'not_playing', room);
    const apply = MOVES[body.move?.type];
    if (!apply) throw new HttpError(400, 'move');
    const m = Match.fromJSON(room.match);
    const result = apply(m, seat, body.move, now);
    room.match = Match.toJSON(m);
    finished(room, result.events, stats);
    if (!result.ok) {
      if (result.events.length) await save(room, expected);
      throw new HttpError(result.error === 'turn' || result.error === 'time' ? 409 : 422, result.error, room);
    }
    stats.moves = 1;
    if (body.move.type !== 'place') stats[`power_${body.move.power ?? body.move.type}`] = 1;
    await save(room, expected);
    return { seat, room };
  }

  async function rematch(body, now, stats) {
    const room = await load(body.code);
    const seat = seatOf(room, body.token);
    if (room.status !== 'over') throw new HttpError(409, 'not_over', room);
    const expected = room.rev;
    room.seats[seat].rematch = true;
    if (room.seats.every((s) => s.rematch)) {
      startGame(room, now, 1 - room.first);
      room.game++;
      Object.assign(stats, { rematches: 1, started: 1 });
    }
    await save(room, expected);
    return { seat, room };
  }

  async function leave(body, now, stats) {
    const room = await load(body.code);
    const seat = seatOf(room, body.token);
    const expected = room.rev;
    if (room.status === 'waiting') room.status = 'closed';
    else if (room.status !== 'playing') room.seats[seat].left = true;
    else if (!settle(room, now, stats)) {
      const m = Match.fromJSON(room.match);
      finished(room, Match.leave(m, seat).events, stats);
      room.match = Match.toJSON(m);
      stats.abandoned = 1;
    }
    await save(room, expected);
    return { seat, room };
  }

  const ACTIONS = { create, join, move, rematch, leave };

  return async function handle(request) {
    const started = clock();
    const commandsBefore = store.commands();
    const now = started;
    const stats = {};
    let status = 200;
    let body;
    try {
      const url = new URL(request.url);
      if (request.method === 'GET') {
        if (url.searchParams.get('stats')) {
          body = { month: month(now).slice(6), counters: await store.counters(month(now)) };
        } else {
          let room = await load(url.searchParams.get('code'));
          if (settle(room, now, stats)) {
            const expected = room.rev;
            room = await save(room, expected).catch(() => load(room.code));
          }
          body =
            String(room.rev) === url.searchParams.get('rev')
              ? { rev: room.rev, same: true }
              : publicView(room, now);
        }
      } else if (request.method === 'POST') {
        stats.requests = 1;
        const input = await request.json().catch(() => null);
        const action = ACTIONS[input?.action];
        if (!action) throw new HttpError(400, 'action');
        const ip =
          request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0] ?? '-';
        const { seat, token, room } = await action(input, now, stats, ip);
        body = { seat, token, ...publicView(room, now) };
      } else throw new HttpError(405, 'method');
    } catch (e) {
      status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(e);
      body = { error: e instanceof HttpError ? e.code : 'server', room: e.room && publicView(e.room, now) };
      stats[status >= 500 ? 'e5xx' : 'e4xx'] = 1;
      if (e.code === 'stale') stats.conflicts = 1;
    }
    if (Object.keys(stats).length) {
      stats.ms = clock() - started;
      stats.timed = 1;
      stats.redis_cmds = store.commands() - commandsBefore + 1;
      await store.count(month(now), stats, STATS_TTL).catch((e) => console.error(e));
    }
    return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  };
}
