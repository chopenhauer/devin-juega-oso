// Cookie banner for the analytics tags (Google Analytics + Microsoft Clarity).
// The choice is stored locally and broadcast as an `oso:consent` event.
const KEY = 'oso.consent.v1';
const banner = document.getElementById('consentBanner');
const settings = document.getElementById('cookieSettings');

let stored = null;
try {
  stored = localStorage.getItem(KEY);
} catch {
  /* storage unavailable: ask every visit */
}
banner.classList.toggle('hidden', stored === 'granted' || stored === 'denied');

function choose(value) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* ignore */
  }
  window.gtag?.('consent', 'update', { analytics_storage: value });
  window.dispatchEvent(new CustomEvent('oso:consent', { detail: value }));
  const hadFocus = banner.contains(document.activeElement);
  banner.classList.add('hidden');
  if (hadFocus) settings.focus();
}

document.getElementById('consentAccept').addEventListener('click', () => choose('granted'));
document.getElementById('consentDeny').addEventListener('click', () => choose('denied'));
settings.addEventListener('click', () => {
  banner.classList.remove('hidden');
  document.getElementById('consentAccept').focus();
});
