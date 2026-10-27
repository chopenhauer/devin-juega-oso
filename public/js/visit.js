// Counts each load of the game and each choice in the cookie banner on our server (api/_visita.js),
// with no cookies and nothing that identifies anyone, so we know how many visits GA4 cannot see.
// funnel.js also counts here the setup screens seen before the first game.
import { swallowed } from './report.js';
const KEY = 'oso.consent.v1';
export const count = (data) => {
  try {
    navigator.sendBeacon?.('/api/visita', JSON.stringify(data));
  } catch {
    /* counting is best effort */
  }
};

let consent = 'unset';
try {
  const stored = localStorage.getItem(KEY);
  if (stored === 'granted' || stored === 'denied') consent = stored;
} catch (e) {
  // Recommended by Norma — fixed with Devin (Cognition AI) via Devin
  swallowed('visit.readConsent', e);
  /* storage unavailable: undecided */
}
count({ consent });
window.addEventListener('oso:consent', (e) => count({ choice: e.detail }));
