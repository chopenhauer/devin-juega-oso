import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, ROOM_TTL } from '../../api/_sala.js';
import { memoryStore } from '../../api/_store.js';
import { timeFor } from '../../public/js/engine.js';

function setup() {
  const store = memoryStore();
  const clock = { t: 1_000_000 };
  const handle = createHandler(store, { now: () => clock.t });
  const call = async (body, ip = '1.2.3.4') => {
    const res = await handle(
      new Request('http://x/api/sala', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'x-real-ip': ip },
      }),
    );
    return { http: res.status, ...(await res.json()) };
  };
  const get = async (query) => {
    const res = await handle(new Request(`http://x/api/sala?${query}`));
    return { http: res.status, ...(await res.json()) };
  };
  return { store, clock, call, get };
}

async function startedRoom(s, size = 4) {
  const host = await s.call({ action: 'create', name: 'Ana', avatar: '🐻', size });
  const guest = await s.call({ action: 'join', code: host.code, name: 'Leo', avatar: '🐼' });
  return { host, guest, code: host.code };
}

test('create gives a 5-character code and a secret seat; join starts the game', async () => {
  const s = setup();
  const host = await s.call({ action: 'create', name: '  Ana  ', avatar: '🐻', size: 6 });
  assert.equal(host.http, 200);
  assert.match(host.code, /^[A-HJKMNP-Z2-9]{5}$/);
  assert.equal(host.seat, 0);
  assert.equal(host.http, 200);
  assert.equal(host.seats[0].name, 'Ana');
  assert.equal(JSON.stringify(host).includes('hash'), false);
  assert.equal(JSON.stringify([...s.store.data.values()]).includes(host.token), false);

  const guest = await s.call({ action: 'join', code: host.code, name: 'Leo', avatar: '🐼' });
  assert.equal(guest.seat, 1);
  assert.equal(guest.http, 200);
  assert.equal(guest.match.size, 6);
  assert.deepEqual(guest.match.clocks, [timeFor(6), timeFor(6)]);
  assert.equal((await s.call({ action: 'join', code: host.code, avatar: '🐸' })).error, 'full');
});

test('names and avatars are cleaned; a taken avatar is refused', async () => {
  const s = setup();
  const host = await s.call({
    action: 'create',
    name: '<b>Una niña muy larga de nombre</b>',
    avatar: 'hola',
  });
  assert.equal(host.seats[0].name, 'bUna niña muy la');
  assert.equal(host.seats[0].avatar, '🐻');
  const r = await s.call({ action: 'join', code: host.code, avatar: '🐻' });
  assert.equal(r.http, 409);
  assert.equal(r.error, 'avatar_taken');
});

test('moves are refereed: turn, version, token and rules', async () => {
  const s = setup();
  const { host, guest, code } = await startedRoom(s);
  const place = (who, rev, index, letter = 'O') =>
    s.call({ action: 'move', code, token: who.token, rev, move: { type: 'place', index, letter } });

  assert.equal((await place(guest, guest.rev, 0)).error, 'turn');
  assert.equal((await s.call({ action: 'move', code, token: 'nope', rev: guest.rev, move: {} })).http, 403);
  const a = await place(host, guest.rev, 0);
  assert.equal(a.http, 200);
  assert.equal(a.match.current, 1);
  const stale = await place(guest, guest.rev, 1);
  assert.equal(stale.http, 409);
  assert.equal(stale.error, 'stale');
  assert.equal(stale.room.rev, a.rev);
  assert.equal((await place(guest, a.rev, 0)).error, 'occupied');
  assert.equal((await place(guest, a.rev, 1, 'X')).error, 'letter');
  const b = await place(guest, a.rev, 1, 'S');
  const c = await place(host, b.rev, 2);
  assert.deepEqual(c.match.scores, [1, 0]);
  assert.equal(c.match.current, 0);
});

test('polling returns only the revision when nothing changed', async () => {
  const s = setup();
  const { guest, code } = await startedRoom(s);
  assert.deepEqual(await s.get(`code=${code}&rev=${guest.rev}`), { http: 200, rev: guest.rev, same: true });
  const full = await s.get(`code=${code}&rev=0`);
  assert.equal(full.code, code);
  assert.equal((await s.get('code=ZZZZZ')).http, 404);
  assert.equal((await s.get('code=../x')).http, 400);
});

test('the server clock decides who runs out of time, even without moves', async () => {
  const s = setup();
  const { code } = await startedRoom(s);
  s.clock.t += 30_000;
  assert.equal((await s.get(`code=${code}`)).match.clocks[0], timeFor(4) - 30);
  s.clock.t += timeFor(4) * 1000;
  const after = await s.get(`code=${code}`);
  assert.equal(after.status, 'over');
  assert.equal(after.match.winner, 1);
  assert.equal(after.match.reason, 'tiempo');
});

test('SOS and swap go through the referee; SOS holds the clock for the replay', async () => {
  const s = setup();
  const { host, guest, code } = await startedRoom(s);
  const mv = (who, rev, move) => s.call({ action: 'move', code, token: who.token, rev, move });
  const a = await mv(host, guest.rev, { type: 'place', index: 0, letter: 'S' });
  const b = await mv(guest, a.rev, { type: 'sos' });
  assert.equal(b.match.word, 'SOS');
  assert.ok(b.match.holdMs > 0);
  const c = await mv(guest, b.rev, { type: 'swap', index: 0 });
  assert.equal(c.match.board[0], 'O');
  assert.equal((await mv(host, c.rev, { type: 'sos' })).error, 'used');
  assert.equal((await mv(host, c.rev, { type: 'fly' })).error, 'move');
});

test('leaving gives the game to the rival and closes the room for rematches', async () => {
  const s = setup();
  const { host, guest, code } = await startedRoom(s);
  const left = await s.call({ action: 'leave', code, token: guest.token });
  assert.equal(left.status, 'over');
  assert.equal(left.match.winner, 0);
  assert.equal(left.match.reason, 'abandono');
  assert.deepEqual(
    left.seats.map((x) => x.left),
    [false, true],
  );
  assert.equal((await s.call({ action: 'rematch', code, token: host.token })).error, 'left');
});

test('after a game ends both must ask for a rematch and who starts alternates', async () => {
  const s = setup();
  const { host, guest, code } = await startedRoom(s);
  s.clock.t += timeFor(4) * 1000 + 1;
  assert.equal((await s.get(`code=${code}`)).match.reason, 'tiempo');
  const r1 = await s.call({ action: 'rematch', code, token: host.token });
  assert.equal(r1.status, 'over');
  assert.deepEqual(
    r1.seats.map((x) => x.rematch),
    [true, false],
  );
  const r2 = await s.call({ action: 'rematch', code, token: guest.token });
  assert.equal(r2.status, 'playing');
  assert.equal(r2.game, 2);
  assert.equal(r2.match.current, 1);
});

test('creating rooms is rate limited per IP and rooms expire after a day', async () => {
  const s = setup();
  for (let i = 0; i < 20; i++) await s.call({ action: 'create' }, '9.9.9.9');
  assert.equal((await s.call({ action: 'create' }, '9.9.9.9')).http, 429);
  assert.equal((await s.call({ action: 'create' }, '8.8.8.8')).http, 200);
  assert.equal(ROOM_TTL, 86400);
});

test('anonymous counters track rooms, games, endings and errors', async () => {
  const s = setup();
  const { host, guest, code } = await startedRoom(s);
  await s.call({
    action: 'move',
    code,
    token: host.token,
    rev: guest.rev,
    move: { type: 'place', index: 0, letter: 'O' },
  });
  await s.call({
    action: 'move',
    code,
    token: host.token,
    rev: guest.rev,
    move: { type: 'place', index: 1, letter: 'O' },
  });
  await s.call({ action: 'leave', code, token: guest.token });
  await s.call({ action: 'nope' });
  const { counters } = await s.get('stats=1');
  assert.equal(counters.created, 1);
  assert.equal(counters.joined, 1);
  assert.equal(counters.started, 1);
  assert.equal(counters.moves, 1);
  assert.equal(counters.conflicts, 1);
  assert.equal(counters.finished, 1);
  assert.equal(counters.end_abandono, 1);
  assert.equal(counters.abandoned, 1);
  assert.equal(counters.e4xx, 2);
  assert.ok(counters.timed >= 6);
});

test('«¡Sigo aquí!» pings are visible to the rival and need a valid seat', async () => {
  const s = setup();
  const { host, guest, code } = await startedRoom(s);
  s.clock.t += 21_000;
  const p = await s.call({ action: 'ping', code, token: host.token });
  assert.equal(p.seats[0].here, s.clock.t);
  assert.equal(p.seats[1].here, 0);
  assert.equal((await s.get(`code=${code}&rev=${guest.rev}`)).seats[0].here, s.clock.t);
  assert.equal((await s.call({ action: 'ping', code, token: 'nope' })).http, 403);
});
