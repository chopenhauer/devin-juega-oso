// Real games from GA4 for Julia's lab: who wins in each difficulty and how many games end on time,
// per lab_version. Protected by the lab cookie; each instance asks GA4 at most every 10 minutes.
import { authorized } from './_labauth.js';

const PROPERTY = 'properties/558226686';
const CACHE_MS = 10 * 60 * 1000;
const DIMENSIONS = ['difficulty', 'result', 'end_reason', 'board_size', 'lab_version'];

const b64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const text = (s) => new TextEncoder().encode(s);

async function accessToken(account, fetchFn) {
  const pem = account.private_key.replace(/-----[^-]+-----|\s/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(text(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = b64url(
    text(
      JSON.stringify({
        iss: account.client_email,
        scope: 'https://www.googleapis.com/auth/analytics.readonly',
        aud: account.token_uri,
        iat: now,
        exp: now + 3600,
      }),
    ),
  );
  const signature = b64url(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, text(`${head}.${claims}`)));
  const r = await fetchFn(account.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${head}.${claims}.${signature}`,
  });
  if (!r.ok) throw new Error('token');
  return (await r.json()).access_token;
}

// GA4 rows -> [{ difficulty, result, end_reason, board_size, lab_version, games }]
export async function fetchGames(account, fetchFn = fetch) {
  const token = await accessToken(account, fetchFn);
  const r = await fetchFn(`https://analyticsdata.googleapis.com/v1beta/${PROPERTY}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
      dimensions: DIMENSIONS.map((d) => ({ name: `customEvent:${d}` })),
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'game_end' } } },
      limit: 10000,
    }),
  });
  if (!r.ok) throw new Error('report');
  const body = await r.json();
  // Anyone can send GA4 events, so only keep lab versions the lab can have written.
  return (body.rows ?? [])
    .map((row) => ({
      ...Object.fromEntries(DIMENSIONS.map((d, i) => [d, row.dimensionValues[i].value])),
      games: Number(row.metricValues[0].value),
    }))
    .filter((row) => row.lab_version === '(not set)' || /^\d{1,9}$/.test(row.lab_version));
}

export function createLabDataHandler({ password, account, fetchFn = fetch, now = Date.now } = {}) {
  let cached = null;
  return async function handle(request) {
    if (!password) return Response.json({ error: 'off' }, { status: 503 });
    if (!(await authorized(request, password))) return Response.json({ error: 'auth' }, { status: 401 });
    if (!account) return Response.json({ error: 'nodata' }, { status: 503 });
    if (cached && now() - cached.at < CACHE_MS) return Response.json(cached);
    try {
      cached = { at: now(), rows: await fetchGames(account, fetchFn) };
      return Response.json(cached);
    } catch {
      return cached ? Response.json(cached) : Response.json({ error: 'ga4' }, { status: 502 });
    }
  };
}
