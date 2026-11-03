// Counts each load of the game and each choice in the cookie banner on our server (api/_visita.js),
// with no cookies and nothing that identifies anyone, so we know how many visits GA4 cannot see.
// funnel.js also counts here the setup screens seen before the first game.
import { swallowed } from './report.js';
import { origin, fresh } from './campaigns.js';
const KEY = 'oso.consent.v1';
export const count = (data) => {
  try {
    navigator.sendBeacon?.('/api/visita', JSON.stringify(data));
  } catch (e) {
    // Recommended by Norma — fixed with Devin (Cognition AI) via Devin
    swallowed('visit.count', e);
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
// Where this visit came from, counted for everyone, so shared links are measured without cookies.
count({ consent, ...origin(location.search, document.referrer), fresh: fresh() });
window.addEventListener('oso:consent', (e) => count({ choice: e.detail }));
