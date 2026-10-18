// «📲 Instalar»: offers to add OSO to the home screen, only on the end screen after a game and
// never on its own. Chrome/Android/desktop use the browser's own prompt; iPhone and iPad have none,
// so they get the steps. «No, gracias» hides it for good on this device. Also registers sw.js,
// which lets the game open without connection. The ❤️ story also offers it, when asked for.
import { track, displayMode } from './telemetry.js';

const KEY = 'oso.install.v1';
const q = (id) => document.getElementById(id);

export const isIos = ({ userAgent, platform, maxTouchPoints } = navigator) =>
  /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);

let prompt = null;
// The end screen could offer it, but the browser had not said yet that it can install.
let waiting = false;
let kind = null;

function dismissed() {
  try {
    return localStorage.getItem(KEY) === 'dismissed';
  } catch {
    return false;
  }
}

// How OSO can be installed here: 'prompt', 'ios', or null (installed, declined or not possible).
export function installKind({ installed, declined, canPrompt, ios }) {
  if (installed || declined) return null;
  if (canPrompt) return 'prompt';
  return ios ? 'ios' : null;
}

function hide() {
  q('installAsk')?.classList.add('hidden');
}

// Called at the end of each game. `quiet`: something else is already asking (👍/👎, a secret).
export function showInstall(quiet = false) {
  kind = quiet
    ? null
    : installKind({
        installed: displayMode() === 'standalone',
        declined: dismissed(),
        canPrompt: !!prompt,
        ios: isIos(),
      });
  waiting = !quiet && !kind;
  q('installAsk').classList.toggle('hidden', !kind);
  if (kind) track('install_offer', { action: 'shown', platform: kind });
}

// Only in the page: tests/unit/pwa.test.js imports the pure helpers above.
if (typeof document !== 'undefined') {
  prompt = window.osoInstallPrompt ?? null;
  window.addEventListener('beforeinstallprompt', (e) => {
    // No mini-infobar from the browser: we only offer it after a game.
    e.preventDefault();
    prompt = e;
    if (waiting && !q('winnerOverlay').classList.contains('hidden')) showInstall();
  });
  window.addEventListener('appinstalled', () => {
    prompt = null;
    hide();
    track('app_installed');
  });

  q('installYes')?.addEventListener('click', async () => {
    track('install_offer', { action: 'install', platform: kind });
    if (kind === 'ios') {
      q('installIosDialog').showModal();
      return;
    }
    const event = prompt;
    prompt = null;
    hide();
    if (!event) return;
    event.prompt();
    const { outcome } = await event.userChoice;
    track('install_prompt', { outcome });
  });
  q('installNo')?.addEventListener('click', () => {
    try {
      localStorage.setItem(KEY, 'dismissed');
    } catch {
      /* storage unavailable: it will ask again next game */
    }
    track('install_offer', { action: 'no_thanks', platform: kind });
    hide();
    q('rematch')?.focus({ preventScroll: true });
  });
  // The story offers it even after «No, gracias»: there the person is the one asking.
  let opener = null;
  const storyKind = () =>
    installKind({
      installed: displayMode() === 'standalone',
      declined: false,
      canPrompt: !!prompt,
      ios: isIos(),
    });
  q('storyOpen')?.addEventListener('click', () => q('storyInstall').classList.toggle('hidden', !storyKind()));
  q('storyDialog')?.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-install]')) return;
    const how = storyKind();
    track('story', { action: 'install' });
    if (how === 'ios') {
      opener = q('storyOpen');
      q('storyDialog').close();
      q('installIosDialog').showModal();
      return;
    }
    const event = prompt;
    prompt = null;
    q('storyInstall').classList.add('hidden');
    if (!event) return;
    event.prompt();
    const { outcome } = await event.userChoice;
    track('install_prompt', { outcome });
  });
  q('installIosDialog')?.addEventListener('close', () => {
    (opener ?? q('installYes')).focus({ preventScroll: true });
    opener = null;
  });
}
