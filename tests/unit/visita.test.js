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
