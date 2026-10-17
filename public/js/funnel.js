// Setup funnel (docs/ideas/llegar-a-jugar.md): which setup screens a visit sees before its first
// game, each one once. Our server counts every visit without cookies (api/_visita.js); GA4 gets
// `setup_step` only with consent, and screens seen before the banner is answered are sent if it is
// then accepted.
import { track } from './telemetry.js';
import { count } from './visit.js';

const KEY = 'oso.consent.v1';
const choice = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const seen = new Set();
let entry = null;
let pending = [];

// 'first' (intro shown), 'return' (starts at the mode step) or 'challenge' (a challenge link).
export const startFunnel = (how) => (entry = how);

export function setupStep(step, mode) {
  if (!entry || seen.has('start') || seen.has(step)) return;
  seen.add(step);
  count({ step, entry });
  const params = { step, entry, mode };
  const stored = choice();
  if (stored === 'granted') track('setup_step', params);
  else if (stored !== 'denied') pending.push(params);
}

window.addEventListener('oso:consent', (e) => {
  if (e.detail === 'granted') pending.forEach((p) => track('setup_step', p));
  pending = [];
});
