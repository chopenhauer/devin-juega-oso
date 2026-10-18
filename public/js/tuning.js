// Live values Julia can change from her lab (/lab). They apply over config.js for everyone:
// the game, the machine and the online referee. Values out of range are rejected (TUNABLE), and if
// the server can't be reached the game uses the last values it got, or else config.js.
import { GAME, BOARD_SIZES } from './config.js';

const at = (path) => path.split('.').reduce((o, k) => o?.[k], GAME);
export const TUNABLE = {
  'machine.easyAim': { min: 0, max: 1, step: 0.05 },
  'machine.hardAim': { min: 0, max: 1, step: 0.05 },
  'machine.pool': { min: 1, max: 20, step: 1 },
  ...Object.fromEntries(BOARD_SIZES.map((n) => [`board.seconds.${n}`, { min: 30, max: 300, step: 5 }])),
};
export const DEFAULTS = Object.freeze(Object.fromEntries(Object.keys(TUNABLE).map((p) => [p, at(p)])));

// Only known paths with numbers in range and on their step; throws on anything else.
export function cleanValues(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('values');
  const out = {};
  for (const [path, v] of Object.entries(values)) {
    const r = TUNABLE[path];
    if (!r || typeof v !== 'number' || !Number.isFinite(v) || v < r.min || v > r.max) throw new Error(path);
    const steps = (v - r.min) / r.step;
    if (Math.abs(steps - Math.round(steps)) > 1e-6) throw new Error(path);
    out[path] = Math.round(v * 1000) / 1000;
  }
  const easy = out['machine.easyAim'] ?? DEFAULTS['machine.easyAim'];
  const hard = out['machine.hardAim'] ?? DEFAULTS['machine.hardAim'];
  if (easy > hard) throw new Error('order');
  return out;
}

let current = { ...DEFAULTS };
let version = 0;
export const tuned = (path) => current[path] ?? at(path);
// 0 = the values of config.js; each change saved in the lab adds one.
export const labVersion = () => version;
export function applyTuning(state) {
  try {
    current = { ...DEFAULTS, ...cleanValues(state?.values ?? {}) };
    version = Number.isInteger(state?.version) ? state.version : 0;
  } catch {
    current = { ...DEFAULTS };
    version = 0;
  }
}

// In the browser: the last values received apply at once and fresh ones are kept for the next
// visit; on a first visit it waits for them a moment.
const KEY = 'oso.lab.v1';
if (typeof window !== 'undefined' && typeof fetch === 'function') {
  let cached = null;
  try {
    cached = JSON.parse(localStorage.getItem(KEY));
  } catch {
    /* no cache */
  }
  if (cached) applyTuning(cached);
  const fresh = fetch('/api/config', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((s) => {
      if (!s) return;
      if (!cached) applyTuning(s);
      try {
        localStorage.setItem(KEY, JSON.stringify(s));
      } catch {
        /* storage unavailable */
      }
    })
    .catch(() => {});
  if (!cached) await Promise.race([fresh, new Promise((r) => setTimeout(r, 1000))]);
}
