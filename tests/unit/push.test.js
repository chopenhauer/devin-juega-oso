import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createECDH, randomBytes } from 'node:crypto';
import { SUBS, cleanSubscription, createPushCron, createPushHandler } from '../../api/_push.js';
import { memoryStore } from '../../api/_store.js';

const b64 = (buf) => Buffer.from(buf).toString('base64url');
const ecdh = createECDH('prime256v1');
const keys = { p256dh: b64(ecdh.generateKeys()), auth: b64(randomBytes(16)) };
const sub = (n = 1, host = 'fcm.googleapis.com') => ({ endpoint: `https://${host}/fcm/send/abc${n}`, keys });
// 24-10-2026 18:10 in Madrid (summer time, UTC+2) and 26-10-2026 18:10 (winter time, UTC+1).
const SUMMER = Date.UTC(2026, 9, 24, 16, 10);
const WINTER = Date.UTC(2026, 9, 26, 17, 10);

function setup(now = SUMMER) {
  const store = memoryStore();
  const handle = createPushHandler(store, { publicKey: 'PUB', now: () => now });
  const post = async (body) =>
    handle(new Request('http://x/api/push', { method: 'POST', body: JSON.stringify(body) }));
  return { store, handle, post, subs: () => store.all(SUBS) };
}

test('only accepts real push services and well-formed keys', () => {
  assert.ok(cleanSubscription(sub()));
  assert.ok(cleanSubscription(sub(1, 'web.push.apple.com')));
  assert.ok(cleanSubscription(sub(1, 'jmt17.google.com')));
  assert.equal(cleanSubscription(sub(1, 'evilgoogle.com')), null);
  assert.ok(cleanSubscription(sub(1, 'updates.push.services.mozilla.com')));
  assert.equal(cleanSubscription(sub(1, 'evil.example.com')), null);
  assert.equal(cleanSubscription(sub(1, 'fcm.googleapis.com.evil.com')), null);
  assert.equal(cleanSubscription({ ...sub(), endpoint: 'http://fcm.googleapis.com/x' }), null);
  assert.equal(cleanSubscription({ ...sub(), keys: { ...keys, auth: 'short' } }), null);
  assert.equal(cleanSubscription(null), null);
});

test('gives the public key, saves, updates and removes a subscription', async () => {
  const s = setup();
  assert.deepEqual(await (await s.handle(new Request('http://x/api/push'))).json(), { key: 'PUB' });
  assert.equal((await s.post({ subscription: sub() })).status, 200);
  assert.equal((await s.post({ subscription: sub(), played: '2026-10-24', update: true })).status, 200);
  const saved = Object.values(await s.subs());
  assert.equal(saved.length, 1);
  assert.equal(saved[0].played, '2026-10-24');
  assert.equal((await s.post({ subscription: sub(1, 'evil.example.com') })).status, 400);
  assert.equal((await s.post({ unsubscribe: sub().endpoint })).status, 200);
  assert.deepEqual(await s.subs(), {});
  const c = await s.store.counters('stats:2026-10');
  assert.deepEqual([c.push_on, c.push_played, c.push_off], [1, 1, 1]);
  const off = createPushHandler(s.store, {});
  assert.equal((await off(new Request('http://x/api/push'))).status, 503);
});

function cron(store, now, send) {
  const handle = createPushCron(store, {
    secret: 'S',
    vapid: { publicKey: 'PUB', privateKey: 'PRIV', subject: 'mailto:x@y' },
    now: () => now,
    send,
  });
  return async (auth = 'Bearer S') =>
    (await handle(new Request('http://x/api/push-cron', { headers: { authorization: auth } }))).json();
}

test('the daily notice goes once, at 18:00 Madrid, to who has not played today', async () => {
  const s = setup();
  await s.post({ subscription: sub(1) });
  await s.post({ subscription: sub(2), played: '2026-10-24' });
  await s.post({ subscription: sub(3), played: '2026-10-23' });
  await s.post({ subscription: sub(4) });
  const sent = [];
  const send = async (to, payload) => (
    sent.push({ to: to.endpoint, payload }),
    to.endpoint.endsWith('4') ? 410 : 201
  );
  assert.deepEqual(await cron(s.store, SUMMER, send)('Bearer nope'), { error: 'auth' });
  assert.deepEqual(await cron(s.store, SUMMER - 3600e3, send)(), { skipped: 'hour' });
  const out = await cron(s.store, SUMMER, send)();
  assert.deepEqual(out, {
    day: '2026-10-24',
    push_sent: 2,
    push_gone: 1,
    push_fail: 0,
    push_played_today: 1,
  });
  assert.equal(sent[0].payload.title, '🗓️ Reto del día n.º 297');
  assert.match(sent[0].payload.body, /^6×6 contra la máquina en fácil/);
  assert.match(sent[0].payload.url, /^\/reto\?utm_source=push&utm_medium=notification/);
  assert.equal(Object.keys(await s.subs()).length, 3);
  assert.deepEqual(await cron(s.store, SUMMER + 60e3, send)(), { skipped: 'sent' });
  assert.equal(sent.length, 3);
});

test('in winter time it is the other UTC run that sends', async () => {
  const s = setup(WINTER);
  await s.post({ subscription: sub() });
  const send = async () => 201;
  assert.deepEqual(await cron(s.store, WINTER - 3600e3, send)(), { skipped: 'hour' });
  assert.equal((await cron(s.store, WINTER, send)()).push_sent, 1);
});
