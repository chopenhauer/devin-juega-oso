import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLabHandler, createConfigHandler } from '../../api/_lab.js';
import { createHandler } from '../../api/_sala.js';
import { memoryStore } from '../../api/_store.js';
import { validToken } from '../../api/_labauth.js';
import { TUNABLE, DEFAULTS, cleanValues, applyTuning, tuned, labVersion } from '../../public/js/tuning.js';
import { chooseMachineMove, timeFor } from '../../public/js/engine.js';

const PW = 'oso-secreto';
function setup() {
  const store = memoryStore();
  const lab = createLabHandler(store, { password: PW });
  let cookie = '';
  const call = async (method, body) => {
    const r = await lab(
      new Request('http://x/api/lab', {
        method,
        headers: cookie ? { cookie } : {},
        body: body && JSON.stringify(body),
      }),
    );
    const set = r.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return { status: r.status, body: await r.json(), set };
  };
  const config = async () => (await createConfigHandler(store)(new Request('http://x/api/config'))).json();
  return { store, call, config, logout: () => (cookie = '') };
}

test('ranges cover what Julia can tune and config.js is inside them', () => {
  assert.deepEqual(Object.keys(TUNABLE).slice(0, 3), ['machine.easyAim', 'machine.hardAim', 'machine.pool']);
  for (const [path, r] of Object.entries(TUNABLE))
    assert.ok(DEFAULTS[path] >= r.min && DEFAULTS[path] <= r.max, path);
  assert.deepEqual(cleanValues({ 'machine.easyAim': 0.35, 'board.seconds.5': 75 }), {
    'machine.easyAim': 0.35,
    'board.seconds.5': 75,
  });
  for (const bad of [
    { 'machine.easyAim': 1.5 },
    { 'machine.easyAim': 0.33 },
    { 'machine.pool': 0 },
    { 'board.seconds.5': 10 },
    { 'machine.delayMs': 100 },
    { 'machine.easyAim': '0.3' },
    { 'machine.easyAim': 0.9, 'machine.hardAim': 0.5 },
  ])
    assert.throws(() => cleanValues(bad), JSON.stringify(bad));
});

test('without the password nothing is readable or writable, and tries are limited', async () => {
  const s = setup();
  assert.equal((await s.call('GET')).status, 401);
  assert.equal((await s.call('POST', { action: 'set', values: { 'machine.easyAim': 0.3 } })).status, 401);
  assert.equal((await s.call('POST', { action: 'login', password: 'no' })).status, 401);
  const ok = await s.call('POST', { action: 'login', password: PW });
  assert.equal(ok.status, 200);
  assert.match(ok.set, /HttpOnly; Secure; SameSite=Strict/);
  assert.ok(await validToken(PW, ok.set.split(';')[0].split('=')[1]));
  assert.equal(await validToken('otra', ok.set.split(';')[0].split('=')[1]), false);
  assert.equal((await s.call('GET')).status, 200);
  s.logout();
  for (let i = 0; i < 20; i++) await s.call('POST', { action: 'login', password: 'x' });
  assert.equal((await s.call('POST', { action: 'login', password: PW })).status, 429);
  assert.equal((await createLabHandler(memoryStore(), {})(new Request('http://x/api/lab'))).status, 503);
});

test('a change applies to everyone, is written in the notebook and can be undone', async () => {
  const s = setup();
  await s.call('POST', { action: 'login', password: PW });
  assert.deepEqual(await s.config(), { version: 0, values: {} });
  const set = await s.call('POST', {
    action: 'set',
    values: { 'machine.easyAim': 0.3, 'board.seconds.5': 75 },
    note: 'Creo que así los peques ganarán más\u0007',
  });
  assert.equal(set.status, 200);
  assert.equal(set.body.version, 1);
  assert.equal(set.body.values['machine.easyAim'], 0.3);
  const [note] = set.body.notes;
  assert.equal(note.note, 'Creo que así los peques ganarán más');
  assert.deepEqual(note.changes, [
    { path: 'machine.easyAim', from: 0.5, to: 0.3 },
    { path: 'board.seconds.5', from: 90, to: 75 },
  ]);
  assert.deepEqual(await s.config(), {
    version: 1,
    values: { 'machine.easyAim': 0.3, 'board.seconds.5': 75 },
  });
  assert.equal(
    (await s.call('POST', { action: 'set', values: { 'machine.easyAim': 0.3 } })).body.error,
    'nothing',
  );
  assert.equal((await s.call('POST', { action: 'set', values: { 'machine.hardAim': 2 } })).status, 400);

  const undo = await s.call('POST', { action: 'undo', version: 1 });
  assert.equal(undo.body.version, 2);
  assert.equal(undo.body.notes[0].undoes, 1);
  assert.deepEqual((await s.config()).values, {});
  await s.call('POST', { action: 'set', values: { 'machine.pool': 3 } });
  const reset = await s.call('POST', { action: 'reset', note: 'De fábrica' });
  assert.deepEqual(reset.body.notes[0].changes, [
    { path: 'machine.pool', from: 3, to: DEFAULTS['machine.pool'] },
  ]);
  assert.equal(reset.body.notes.length, 4);
});

test('the game, the machine and the online referee use the live values', async () => {
  applyTuning({ version: 7, values: { 'board.seconds.5': 75, 'machine.easyAim': 0 } });
  assert.equal(timeFor(5), 75);
  assert.equal(labVersion(), 7);
  assert.equal(tuned('machine.easyAim'), 0);
  // With easyAim 0 the easy machine never takes the OSO in O S _ .
  const board = ['O', 'S', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''].slice(0, 16);
  const moves = Array.from({ length: 30 }, () => chooseMachineMove(board, 4, new Set(), 'OSO', 'easy'));
  assert.ok(moves.every((m) => !(m.index === 2 && m.letter === 'O')));
  applyTuning({ values: { 'machine.easyAim': 5 } });
  assert.equal(timeFor(5), DEFAULTS['board.seconds.5']);
  assert.equal(labVersion(), 0);

  const store = memoryStore();
  await store.cas('lab:config', 0, { rev: 1, version: 3, values: { 'board.seconds.5': 60 }, notes: [] }, 60);
  const sala = createHandler(store);
  const res = await sala(
    new Request('http://x/api/sala', { method: 'POST', body: JSON.stringify({ action: 'create', size: 5 }) }),
  );
  assert.ok(res.status < 500);
  assert.equal(timeFor(5), 60);
  applyTuning(null);
});
