// Web Push without dependencies (node:crypto): VAPID identity (RFC 8292) and the aes128gcm
// payload encryption (RFC 8291) that every browser push service expects.
import {
  createCipheriv,
  createECDH,
  createPrivateKey,
  generateKeyPairSync,
  hkdfSync,
  randomBytes,
  sign,
} from 'node:crypto';

const b64 = (buf) => Buffer.from(buf).toString('base64url');
const unb64 = (text) => Buffer.from(text, 'base64url');

// A new VAPID key pair, as base64url: `publicKey` (65-byte uncompressed point) for the browser,
// `privateKey` (32 bytes) for the server only.
export function vapidKeys() {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const pub = publicKey.export({ format: 'jwk' });
  const priv = privateKey.export({ format: 'jwk' });
  return {
    publicKey: b64(Buffer.concat([Buffer.from([4]), unb64(pub.x), unb64(pub.y)])),
    privateKey: priv.d,
  };
}

// `Authorization` header that proves to the push service that the message comes from us.
export function vapidAuth(endpoint, { publicKey, privateKey, subject }, now = Date.now()) {
  const point = unb64(publicKey);
  const key = createPrivateKey({
    format: 'jwk',
    key: {
      kty: 'EC',
      crv: 'P-256',
      d: privateKey,
      x: b64(point.subarray(1, 33)),
      y: b64(point.subarray(33)),
    },
  });
  const header = b64(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const claims = b64(
    JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: subject }),
  );
  const signature = sign('sha256', Buffer.from(`${header}.${claims}`), { key, dsaEncoding: 'ieee-p1363' });
  return `vapid t=${header}.${claims}.${b64(signature)}, k=${publicKey}`;
}

// The body for one subscription: only that browser can read it.
export function encrypt(payload, { p256dh, auth }, { salt = randomBytes(16), ecdh } = {}) {
  const uaPublic = unb64(p256dh);
  if (!ecdh) {
    ecdh = createECDH('prime256v1');
    ecdh.generateKeys();
  }
  const asPublic = ecdh.getPublicKey();
  const shared = ecdh.computeSecret(uaPublic);
  const info = Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]);
  const ikm = Buffer.from(hkdfSync('sha256', shared, unb64(auth), info, 32));
  const cek = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
  const cipher = createCipheriv('aes-128-gcm', cek, nonce);
  const body = Buffer.concat([
    cipher.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])),
    cipher.final(),
  ]);
  const head = Buffer.alloc(21);
  salt.copy(head, 0);
  head.writeUInt32BE(4096, 16);
  head.writeUInt8(asPublic.length, 20);
  return Buffer.concat([head, asPublic, body, cipher.getAuthTag()]);
}

// Sends one notification. Resolves to the push service's HTTP status (201 = accepted;
// 404/410 = that subscription is gone for good).
export async function sendPush(
  subscription,
  payload,
  vapid,
  { ttl = 6 * 3600, topic, fetch = globalThis.fetch } = {},
) {
  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization: vapidAuth(subscription.endpoint, vapid),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttl),
      Urgency: 'normal',
      ...(topic ? { Topic: topic } : {}),
    },
    body: encrypt(JSON.stringify(payload), subscription.keys),
    // Recommended by Norma — fixed with Devin (Cognition AI) via Devin
    // A push service that doesn't answer counts as a failed send (push_fail) and the rest go on.
    signal: AbortSignal.timeout(10_000),
  });
  return res.status;
}
