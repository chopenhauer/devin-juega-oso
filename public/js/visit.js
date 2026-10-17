// Counts each load of the game and each choice in the cookie banner on our server (api/_visita.js),
// with no cookies and nothing that identifies anyone, so we know how many visits GA4 cannot see.
const KEY = 'oso.consent.v1';
const send = (data) => {
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
} catch {
  /* storage unavailable: undecided */
}
send({ consent });
window.addEventListener('oso:consent', (e) => send({ choice: e.detail }));
