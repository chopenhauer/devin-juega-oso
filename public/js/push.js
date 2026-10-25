// 🔔 Avisos del reto del día (Web Push, api/_push.js). Never asked on entering: only once, at the
// end of the first reto of the day, and it can be turned on or off from the menu. With no
// PushManager (e.g. iPhone without OSO on the home screen) nothing is shown.
import { t } from './i18n.js';
import { GAME } from './config.js';
import { readDaily } from './daily.js';
import { track } from './telemetry.js';

const KEY = 'oso.push.v1';
const q = (id) => document.getElementById(id);

export const pushSupported = (w = globalThis) =>
  !!(w.navigator?.serviceWorker && w.PushManager && w.Notification);

// Whether the end of a reto game should ask: first game of that day, never asked, never answered.
export const shouldAsk = ({ supported, permission, asked, first, quiet }) =>
  supported && permission === 'default' && !asked && first && !quiet;

function asked() {
  try {
    return !!JSON.parse(localStorage.getItem(KEY))?.asked;
  } catch {
    return false;
  }
}
function remember() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ asked: true }));
  } catch {
    /* storage unavailable: it may ask again after another reto */
  }
}

const bytes = (b64url) =>
  Uint8Array.from(atob(b64url.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const post = (body) =>
  fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

async function subscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

async function save(sub, update = false) {
  const res = await post({ subscription: sub.toJSON(), played: readDaily().last, update });
  if (!res.ok) throw new Error(`push ${res.status}`);
}

// 'on', 'denied' or 'failed'.
async function turnOn(place) {
  const permission = await Notification.requestPermission();
  track('push_optin', { action: permission, place });
  if (permission !== 'granted') return 'denied';
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const { key } = await (await fetch('/api/push')).json();
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes(key) });
    }
    await save(sub);
    return 'on';
  } catch (e) {
    console.error(e);
    track('push_optin', { action: 'error', place });
    return 'failed';
  }
}

async function turnOff() {
  const sub = await subscription();
  if (!sub) return;
  await post({ unsubscribe: sub.endpoint }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
  track('push_optin', { action: 'off', place: 'menu' });
}

export async function syncPushMenu() {
  const menu = q('pushMenu');
  menu.classList.toggle('hidden', !pushSupported());
  if (!pushSupported()) return;
  const on = Notification.permission === 'granted' && !!(await subscription().catch(() => null));
  menu.textContent = on ? t('push.menu_on') : t('pushMenu');
  menu.setAttribute('aria-pressed', String(on));
}

// End of a reto game. Tells the server today's is played (no notice today) and, the first time,
// offers the notice. Returns whether it is asking, so the other questions wait.
export function pushAfterDaily({ first, quiet = false }) {
  const box = q('pushAsk');
  const ask = shouldAsk({
    supported: pushSupported(),
    permission: globalThis.Notification?.permission,
    asked: asked(),
    first,
    quiet,
  });
  box.classList.toggle('hidden', !ask);
  if (ask) {
    box.classList.remove('done');
    q('pushTitle').classList.remove('hidden');
    q('pushActions').classList.remove('hidden');
    q('pushText').textContent = t('push.text', { hour: GAME.push.hour });
    track('push_optin', { action: 'shown', place: 'end' });
  } else if (first)
    subscription()
      .then((sub) => sub && save(sub, true))
      .catch(() => {});
  return ask;
}

export const hidePushAsk = () => q('pushAsk').classList.add('hidden');

if (typeof document !== 'undefined') {
  q('pushYes').addEventListener('click', async () => {
    remember();
    q('pushActions').classList.add('hidden');
    const result = await turnOn('end');
    // Once on, a single short line: the end screen is for the result and the rematch.
    q('pushAsk').classList.toggle('done', result === 'on');
    q('pushTitle').classList.toggle('hidden', result === 'on');
    q('pushText').textContent =
      result === 'on'
        ? t('push.done', { hour: GAME.push.hour })
        : result === 'denied'
          ? t('push.denied')
          : t('push.failed');
    syncPushMenu();
  });
  q('pushNo').addEventListener('click', () => {
    remember();
    track('push_optin', { action: 'no', place: 'end' });
    hidePushAsk();
    q('rematch')?.focus({ preventScroll: true });
  });
  q('pushMenu').addEventListener('click', async () => {
    const menu = q('pushMenu');
    if (menu.getAttribute('aria-pressed') === 'true') await turnOff();
    else if ((await turnOn('menu')) === 'denied') {
      menu.textContent = t('push.denied');
      return;
    }
    syncPushMenu();
  });
  syncPushMenu();
}
