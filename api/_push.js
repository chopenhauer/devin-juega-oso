// Reto del día reminders (Web Push, docs/ideas/avisos.md). No email or account: the browser gives an
// anonymous address (subscription) and we keep it until it is turned off or stops working.
//   GET  /api/push                              the public VAPID key the browser subscribes with
//   POST /api/push {subscription, played?}      turn on, or update the last reto day played
//   POST /api/push {unsubscribe: endpoint}      turn off
//   GET  /api/push-cron                         Vercel Cron: one notice a day at GAME.push.hour (Madrid)
import { createHash } from 'node:crypto';
import es from '../public/locales/es.json' with { type: 'json' };
import { GAME } from '../public/js/config.js';
import { TIME_ZONE, dailyChallenge, dayKey } from '../public/js/daily.js';
import { month, STATS_TTL } from './_sala.js';
import { sendPush } from './_webpush.js';

export const SUBS = 'push:subs';
const RATE = { limit: 30, window: 600 };
// Only the browsers' push services: the cron must never post to any other address.
const HOSTS = ['fcm.googleapis.com', 'push.services.mozilla.com', 'push.apple.com', 'notify.windows.com'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const hash = (text) => createHash('sha256').update(text).digest('base64url');
const fill = (key, vars) => es[key].replace(/\{(\w+)\}/g, (_, k) => vars[k]);
const bytes = (text, n) => typeof text === 'string' && Buffer.from(text, 'base64url').length === n;

export function cleanSubscription(input) {
  let url;
  try {
    url = new URL(input?.endpoint);
  } catch {
    return null;
  }
  const host = url.hostname;
  if (url.protocol !== 'https:' || !HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return null;
  if (input.endpoint.length > 1000 || !bytes(input.keys?.p256dh, 65) || !bytes(input.keys?.auth, 16))
    return null;
  return { endpoint: input.endpoint, keys: { p256dh: input.keys.p256dh, auth: input.keys.auth } };
}

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export function createPushHandler(store, { publicKey, now = Date.now } = {}) {
  return async function handle(request) {
    if (request.method === 'GET') return publicKey ? json({ key: publicKey }) : json({ error: 'off' }, 503);
    if (request.method !== 'POST') return json({ error: 'method' }, 405);
    const ip =
      request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0] ?? '-';
    if ((await store.hit(`rl:push:${hash(ip).slice(0, 16)}`, RATE.window)) > RATE.limit)
      return json({ error: 'rate' }, 429);
    const input = await request.json().catch(() => null);
    let stats;
    if (typeof input?.unsubscribe === 'string') {
      await store.drop(SUBS, hash(input.unsubscribe));
      stats = { push_off: 1 };
    } else {
      const sub = cleanSubscription(input?.subscription);
      if (!sub) return json({ error: 'subscription' }, 400);
      const played = DAY.test(input.played) ? input.played : null;
      await store.put(SUBS, hash(sub.endpoint), { ...sub, played });
      stats = input.update ? { push_played: 1 } : { push_on: 1 };
    }
    await store.count(month(now()), { ...stats, redis_cmds: 3 }, STATS_TTL).catch((e) => console.error(e));
    return json({ ok: true });
  };
}

const madridHour = (date) =>
  +new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', hourCycle: 'h23' }).format(date);

// Vercel runs it at two UTC hours (summer and winter time); only the one that is GAME.push.hour in
// Madrid sends, once per day, and only to whoever has not played today's reto yet.
export function createPushCron(
  store,
  { vapid, secret, now = Date.now, send = sendPush, hour = GAME.push.hour } = {},
) {
  return async function handle(request) {
    if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`)
      return json({ error: 'auth' }, 401);
    if (!vapid?.publicKey || !vapid?.privateKey) return json({ error: 'off' }, 503);
    const date = new Date(now());
    if (madridHour(date) !== hour) return json({ skipped: 'hour' });
    const key = dayKey(date);
    if ((await store.hit(`push:sent:${key}`, 2 * 86400)) > 1) return json({ skipped: 'sent' });
    const daily = dailyChallenge(key);
    const payload = {
      title: fill('push.title', { number: daily.number }),
      body: fill('push.body', { size: daily.size, level: es[`summary.${daily.difficulty}`] }),
      url: '/reto?utm_source=push&utm_medium=notification&utm_campaign=reto_del_dia',
    };
    const stats = { push_sent: 0, push_gone: 0, push_fail: 0, push_played_today: 0 };
    const subs = Object.entries(await store.all(SUBS));
    const due = subs.filter(([, s]) => s.played !== key);
    stats.push_played_today = subs.length - due.length;
    for (let i = 0; i < due.length; i += 25) {
      await Promise.all(
        due.slice(i, i + 25).map(async ([id, sub]) => {
          const status = await send(sub, payload, vapid, { topic: 'reto' }).catch(() => 0);
          if (status >= 200 && status < 300) stats.push_sent++;
          else if (status === 404 || status === 410) {
            stats.push_gone++;
            await store.drop(SUBS, id);
          } else stats.push_fail++;
        }),
      );
    }
    await store.count(month(now()), { ...stats, push_runs: 1 }, STATS_TTL).catch((e) => console.error(e));
    return json({ day: key, ...stats });
  };
}
