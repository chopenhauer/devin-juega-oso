// Session cookie of Julia's lab: `<expiry>.<HMAC-SHA256(expiry)>`, keyed by LAB_PASSWORD, so a new
// password logs everyone out. Web Crypto, so the edge middleware can check it too.
export const COOKIE = 'oso_lab';
const DAYS = 30;
const enc = new TextEncoder();
const b64 = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
async function sign(secret, text) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(`oso-lab|${secret}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return b64(await crypto.subtle.sign('HMAC', key, enc.encode(text)));
}
const same = (a, b) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};
export const rightPassword = async (password, input) =>
  Boolean(password) &&
  typeof input === 'string' &&
  same(await sign('login', input), await sign('login', password));
export async function makeToken(password, now = Date.now()) {
  const exp = String(now + DAYS * 86400e3);
  return `${exp}.${await sign(password, exp)}`;
}
export async function validToken(password, token, now = Date.now()) {
  if (!password || typeof token !== 'string') return false;
  const [exp, mac] = token.split('.');
  if (!exp || !mac || !(Number(exp) > now)) return false;
  return same(mac, await sign(password, exp));
}
export const readCookie = (request) =>
  request.headers
    .get('cookie')
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
export const cookieHeader = (token) =>
  `${COOKIE}=${token}; Path=/; Max-Age=${DAYS * 86400}; HttpOnly; Secure; SameSite=Strict`;
export const authorized = async (request, password) => validToken(password, readCookie(request));
