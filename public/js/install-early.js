// Classic script, before the modules: i18n.js awaits the texts, so install.js can start after
// Chrome has already fired beforeinstallprompt. Keep the event for install.js.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.osoInstallPrompt = e;
});
