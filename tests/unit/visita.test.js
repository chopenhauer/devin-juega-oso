import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVisitHandler } from '../../api/_visita.js';
import { memoryStore } from '../../api/_store.js';

function setup() {
  const store = memoryStore();
  const handle = createVisitHandler(store, { now: () => Date.UTC(2026, 9, 17) });
  const post = async (body) =>
    (await handle(new Request('http://x/api/visita', { method: 'POST', body: JSON.stringify(body) }))).status;
  return { store, post, counters: () => store.counters('stats:2026-10') };
}

test('counts page loads by stored consent and banner choices', async () => {
  const s = setup();
  for (const consent of ['granted', 'denied', 'unset', 'unset']) assert.equal(await s.post({ consent }), 204);
  assert.equal(await s.post({ choice: 'denied' }), 204);
  assert.equal(await s.post({ choice: 'granted' }), 204);
  const c = await s.counters();
  assert.equal(c.visits, 4);
  assert.deepEqual(
    [c.visit_granted, c.visit_denied, c.visit_unset, c.consent_granted, c.consent_denied],
    [1, 1, 2, 1, 1],
  );
});

test('ignores anything else and only accepts POST', async () => {
  const s = setup();
  assert.equal(await s.post({ consent: 'maybe' }), 400);
  assert.equal(await s.post({ choice: 'unset' }), 400);
  assert.equal(await s.post(null), 400);
  const get = await createVisitHandler(s.store)(new Request('http://x/api/visita'));
  assert.equal(get.status, 405);
  assert.deepEqual(await s.counters(), {});
});

test('counts each setup screen by how the visit came in', async () => {
  const s = setup();
  for (const step of ['welcome', 'rules_1', 'mode', 'start'])
    assert.equal(await s.post({ step, entry: 'first' }), 204);
  assert.equal(await s.post({ step: 'mode', entry: 'return' }), 204);
  assert.equal(await s.post({ step: 'players', entry: 'challenge' }), 204);
  assert.deepEqual(await s.counters(), {
    setup_first_welcome: 1,
    setup_first_rules_1: 1,
    setup_first_mode: 1,
    setup_first_start: 1,
    setup_return_mode: 1,
    setup_challenge_players: 1,
    redis_cmds: 6,
  });
  for (const bad of [
    { step: 'mode' },
    { step: 'Jugador 1', entry: 'first' },
    { step: 'rules_10', entry: 'first' },
    { step: 'mode', entry: 'other' },
  ])
    assert.equal(await s.post(bad), 400);
});

test('counts the 🔔 reto notices that are tapped', async () => {
  const s = setup();
  assert.equal(await s.post({ push: 'click' }), 204);
  assert.equal(await s.post({ push: 'other' }), 400);
  assert.equal((await s.counters()).push_click, 1);
});

test('counts where a visit came from, only for known campaigns and sources', async () => {
  const s = setup();
  await s.post({ consent: 'unset', campaign: 'racha', source: 'whatsapp', fresh: true });
  await s.post({ consent: 'granted', campaign: 'racha', source: 'native', fresh: false });
  await s.post({ consent: 'denied', campaign: 'buscador' });
  await s.post({ consent: 'unset', campaign: 'hackeo', source: 'x'.repeat(500), fresh: 'yes' });
  const c = await s.counters();
  assert.equal(c.visits, 4);
  assert.equal(c.visits_new, 1);
  assert.deepEqual(
    [c.arrive_racha, c.arrive_racha_new, c.arrive_src_whatsapp, c.arrive_src_native, c.arrive_buscador],
    [2, 1, 1, 1, 1],
  );
  assert.deepEqual(
    Object.keys(c).filter((k) => k.startsWith('arrive_')),
    ['arrive_racha', 'arrive_racha_new', 'arrive_src_whatsapp', 'arrive_src_native', 'arrive_buscador'],
  );
});

test('counts shares by channel and place, and visits to /como-jugar', async () => {
  const s = setup();
  assert.equal(await s.post({ share: 'whatsapp', place: 'streak' }), 204);
  assert.equal(await s.post({ share: 'native', place: 'end' }), 204);
  assert.equal(await s.post({ share: 'telegram', place: 'end' }), 400);
  assert.equal(await s.post({ share: 'copy', place: 'anywhere' }), 400);
  assert.equal(await s.post({ page: 'como_jugar', campaign: 'buscador' }), 204);
  assert.equal(await s.post({ page: 'otra' }), 400);
  const c = await s.counters();
  assert.equal(c.shares, 2);
  assert.deepEqual([c.share_whatsapp_streak, c.share_native_end], [1, 1]);
  assert.deepEqual([c.page_como_jugar, c.arrive_buscador, c.visits], [1, 1, undefined]);
});
