import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GAMES_PER_SECRET, knownSecrets, nextSecret, SECRETS } from '../../public/js/secrets.js';

const LIST = [
  { id: 'a', hint: 'A', how: 'Haz A' },
  { id: 'b', hint: 'B', how: 'Haz B' },
  { id: 'c', hint: 'C', how: 'Haz C' },
];
const state = (played, told = [], day = null) => ({ played, told, day });

test('a secret is due every 2 games played, in order and never repeated', () => {
  assert.equal(GAMES_PER_SECRET, 2);
  assert.equal(nextSecret(state(1), '2026-10-12', LIST), null);
  assert.equal(nextSecret(state(2), '2026-10-12', LIST).id, 'a');
  assert.equal(nextSecret(state(3, ['a'], '2026-10-11'), '2026-10-12', LIST), null);
  assert.equal(nextSecret(state(4, ['a'], '2026-10-11'), '2026-10-12', LIST).id, 'b');
  assert.equal(nextSecret(state(40, ['a', 'b', 'c'], '2026-10-11'), '2026-10-12', LIST), null);
});

test('at most one secret a day, however many games', () => {
  assert.equal(nextSecret(state(9, ['a'], '2026-10-12'), '2026-10-12', LIST), null);
  assert.equal(nextSecret(state(9, ['a'], '2026-10-12'), '2026-10-13', LIST).id, 'b');
});

test('a new secret added later is told to whoever already knew the others', () => {
  assert.equal(nextSecret(state(30, ['a', 'b'], '2026-10-01'), '2026-10-12', LIST).id, 'c');
});

test('«Ya sabías…» lists the secrets told before, oldest first', () => {
  assert.deepEqual(
    knownSecrets(state(6, ['b', 'a']), 'c', LIST).map((s) => s.id),
    ['a', 'b'],
  );
  assert.deepEqual(knownSecrets(state(2), 'a', LIST), []);
});

test('every secret says how to trigger it and has a short hint', () => {
  const ids = SECRETS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of SECRETS) {
    assert.match(s.id, /^[a-z_]+$/);
    assert.ok(s.hint.length > 0 && s.hint.length <= 40, s.id);
    assert.ok(s.how.length > s.hint.length, s.id);
  }
});
