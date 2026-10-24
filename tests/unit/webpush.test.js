import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDecipheriv, createECDH, createPublicKey, hkdfSync, randomBytes, verify } from 'node:crypto';
import { encrypt, sendPush, vapidAuth, vapidKeys } from '../../api/_webpush.js';

const b64 = (buf) => Buffer.from(buf).toString('base64url');

// What the browser does with the body (RFC 8291), to check we encrypt for it.
function browser() {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  const auth = randomBytes(16);
  const keys = { p256dh: b64(ecdh.getPublicKey()), auth: b64(auth) };
  const decrypt = (body) => {
    const salt = body.subarray(0, 16);
    assert.equal(body.readUInt32BE(16), 4096);
    const idLen = body[20];
    const asPublic = body.subarray(21, 21 + idLen);
    const data = body.subarray(21 + idLen);
    const shared = ecdh.computeSecret(asPublic);
    const info = Buffer.concat([Buffer.from('WebPush: info\0'), ecdh.getPublicKey(), asPublic]);
    const ikm = Buffer.from(hkdfSync('sha256', shared, auth, info, 32));
    const cek = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
    const nonce = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
    const decipher = createDecipheriv('aes-128-gcm', cek, nonce);
    decipher.setAuthTag(data.subarray(-16));
    const plain = Buffer.concat([decipher.update(data.subarray(0, -16)), decipher.final()]);
    assert.equal(plain.at(-1), 2);
    return plain.subarray(0, -1).toString();
  };
  return { keys, decrypt };
}

test('encrypts the payload so only that browser can read it', () => {
  const b = browser();
  const text = JSON.stringify({ title: '🗓️ Reto del día n.º 298', url: '/reto' });
  const body = encrypt(text, b.keys);
  assert.equal(b.decrypt(body), text);
  assert.notEqual(encrypt(text, b.keys).toString('hex'), body.toString('hex'));
  assert.throws(() => browser().decrypt(body));
});

test('signs a VAPID token for the push service origin', () => {
  const vapid = { ...vapidKeys(), subject: 'mailto:hola@juegaoso.com' };
  assert.equal(Buffer.from(vapid.publicKey, 'base64url').length, 65);
  const now = Date.UTC(2026, 9, 24, 16);
  const auth = vapidAuth('https://fcm.googleapis.com/fcm/send/abc', vapid, now);
  const [, jwt, k] = auth.match(/^vapid t=([^,]+), k=(.+)$/);
  assert.equal(k, vapid.publicKey);
  const [h, c, s] = jwt.split('.');
  const claims = JSON.parse(Buffer.from(c, 'base64url'));
  assert.deepEqual(claims, {
    aud: 'https://fcm.googleapis.com',
    exp: now / 1000 + 12 * 3600,
    sub: vapid.subject,
  });
  const point = Buffer.from(vapid.publicKey, 'base64url');
  const key = createPublicKey({
    format: 'jwk',
    key: { kty: 'EC', crv: 'P-256', x: b64(point.subarray(1, 33)), y: b64(point.subarray(33)) },
  });
  assert.ok(
    verify(
      'sha256',
      Buffer.from(`${h}.${c}`),
      { key, dsaEncoding: 'ieee-p1363' },
      Buffer.from(s, 'base64url'),
    ),
  );
});

test('posts the encrypted body with the push headers', async () => {
  const b = browser();
  const vapid = { ...vapidKeys(), subject: 'mailto:hola@juegaoso.com' };
  let seen;
  const status = await sendPush(
    { endpoint: 'https://web.push.apple.com/QK', keys: b.keys },
    { title: 'OSO' },
    vapid,
    {
      topic: 'reto',
      fetch: async (url, init) => ((seen = { url, init }), new Response(null, { status: 201 })),
    },
  );
  assert.equal(status, 201);
  assert.equal(seen.url, 'https://web.push.apple.com/QK');
  assert.equal(seen.init.headers['Content-Encoding'], 'aes128gcm');
  assert.equal(seen.init.headers.Topic, 'reto');
  assert.match(seen.init.headers.Authorization, /^vapid t=/);
  assert.equal(b.decrypt(seen.init.body), '{"title":"OSO"}');
});
