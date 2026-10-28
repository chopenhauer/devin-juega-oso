import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cheer,
  codeFromUrl,
  fetchRoom,
  qualityParams,
  newQuality,
  send,
  urlWithoutRoom,
} from '../../public/js/online.js';

test('the room code leaves the address but the UTM tags stay for GA', () => {
  assert.equal(
    urlWithoutRoom(
      'https://juegaoso.com/?sala=K7QD2&utm_source=whatsapp&utm_medium=share&utm_campaign=en_linea',
    ),
    '/?utm_source=whatsapp&utm_medium=share&utm_campaign=en_linea',
  );
  assert.equal(urlWithoutRoom('https://juegaoso.com/?sala=K7QD2'), '/');
});

test('the waiting player gets a message that fits the game', () => {
  const base = { mine: 0, theirs: 0, free: 9, rivalName: 'Bea', rivalTime: 60 };
  assert.match(cheer({ ...base, mine: 3, theirs: 1 }), /Vas 3–1/);
  assert.match(cheer({ ...base, mine: 1, theirs: 3 }), /quedan 9 casillas/);
  assert.match(cheer({ ...base, mine: 2, theirs: 2 }), /Empate a 2/);
  assert.match(cheer(base), /Todo por decidir/);
  assert.match(cheer({ ...base, rivalTime: 14.2 }), /reloj de Bea corre: le quedan 15 s/);
});

test('invite codes are read from the URL and quality is summarised in percentiles', () => {
  assert.equal(codeFromUrl('?sala=k7qd2'), 'K7QD2');
  assert.equal(codeFromUrl('?sala=K7QD0'), null);
  assert.equal(codeFromUrl(''), null);
  const q = newQuality();
  q.rtt.push(100, 200, 300, 400, 1000);
  assert.equal(qualityParams(q).move_rtt_p50_ms, 300);
  assert.equal(qualityParams(q).move_rtt_p95_ms, 1000);
  assert.equal(qualityParams(q).sync_p95_ms, 0);
});

test('a request to the room that hangs gives up and counts as a network error', async (t) => {
  const seen = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    seen.push(init.signal);
    throw new DOMException('timed out', 'TimeoutError');
  });
  const quality = newQuality();
  assert.deepEqual(await fetchRoom('K7QD2', 3, quality), { ok: false, http: 0, error: 'network' });
  assert.deepEqual(await send({ action: 'ping' }), { ok: false, http: 0, error: 'network' });
  assert.equal(quality.poll_errors, 1);
  assert.ok(seen.every((s) => s instanceof AbortSignal));
  assert.equal(seen.length, 2);
});
