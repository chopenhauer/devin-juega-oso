// Service worker: lets OSO open and play without connection once installed or visited.
// Network first, so with connection it always gets the latest version (no stale game after a
// release); each answer is kept to play offline. The rooms API and analytics never go through it.
const CACHE = 'oso-v1';
// What the game needs to start offline. tests/unit/pwa.test.js checks it matches public/.
const SHELL = [
  '/',
  '/privacidad',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/css/tokens.css',
  '/css/styles.css',
  '/fonts/fredoka-latin.woff2',
  '/locales/es.json',
  '/img/robot-easy.svg',
  '/img/robot-hard.svg',
  '/img/robot-extreme.svg',
  '/js/app.js',
  '/js/challenge.js',
  '/js/clarity.js',
  '/js/config.js',
  '/js/consent.js',
  '/js/engine.js',
  '/js/funnel.js',
  '/js/hold.js',
  '/js/ga.js',
  '/js/i18n.js',
  '/js/lab-sim.js',
  '/js/install-early.js',
  '/js/install.js',
  '/js/leaderboard.js',
  '/js/match.js',
  '/js/onboarding.js',
  '/js/online.js',
  '/js/replay.js',
  '/js/scorecard.js',
  '/js/secrets.js',
  '/js/share.js',
  '/js/sound.js',
  '/js/telemetry.js',
  '/js/themes.js',
  '/js/tuning.js',
  '/js/vercel-analytics.js',
  '/js/version.js',
  '/js/visit.js',
];

const own = (url) => url.origin === self.location.origin;
const skip = (url) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/_vercel/');

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || !own(url) || skip(url)) return;
  // Any link to the game (?reto=…, ?sala=…, utm…) opens the same page offline.
  const page = request.mode === 'navigate' && url.pathname === '/';
  const key = page ? '/' : request;
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Room links get sala.html (another share card): not kept as the game page.
        if (response.ok && response.type === 'basic' && !url.searchParams.has('sala')) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(key, copy)));
        }
        return response;
      })
      .catch(async () => (await caches.match(key, { ignoreSearch: page })) ?? Response.error()),
  );
});
