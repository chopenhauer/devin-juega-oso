// Classic script, before the modules: i18n.js awaits the texts, so the modules can start after
// `load` and after Chrome has fired beforeinstallprompt. Both are caught here.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.osoInstallPrompt = e;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
