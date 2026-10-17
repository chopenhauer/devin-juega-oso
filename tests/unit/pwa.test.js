import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { installKind, isIos } from '../../public/js/install.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const files = (dir) =>
  readdirSync(new URL(`../../public/${dir}`, import.meta.url), { recursive: true, withFileTypes: true })
    .filter((f) => f.isFile())
    .map((f) => `${f.parentPath.split('/public')[1]}/${f.name}`);

test('sw.js keeps everything the game needs to start offline, and nothing else', () => {
  const shell = JSON.parse(
    read('public/sw.js')
      .match(/const SHELL = (\[[^\]]*\])/)[1]
      .replace(/'/g, '"')
      .replace(/,\s*\]/, ']'),
  );
  const preview = ['/js/design.js', '/css/design.css'];
  const needed = [
    '/',
    '/privacidad',
    '/manifest.webmanifest',
    '/favicon.svg',
    ...['js', 'css', 'locales', 'img', 'icons'].flatMap(files),
    '/fonts/fredoka-latin.woff2',
  ].filter((f) => !preview.includes(f));
  assert.deepEqual([...shell].sort(), needed.sort());
});

test('the manifest makes OSO installable with icons that exist', () => {
  const manifest = JSON.parse(read('public/manifest.webmanifest'));
  assert.equal(manifest.short_name, 'OSO');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  for (const size of ['192x192', '512x512'])
    assert.ok(
      manifest.icons.some((i) => i.sizes === size && i.purpose === 'any'),
      size,
    );
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'));
  for (const { src } of manifest.icons)
    assert.ok(existsSync(new URL(`../../public${src}`, import.meta.url)), src);
  const html = read('public/index.html');
  assert.match(html, /rel="manifest" href="\/manifest.webmanifest"/);
  assert.match(html, /rel="apple-touch-icon" href="\/icons\/apple-touch-icon.png"/);
});

test('the CSP lets the manifest and the service worker load, and sw.js is never cached', () => {
  const { headers } = JSON.parse(read('vercel.json'));
  const csp = headers[0].headers.find((h) => h.key === 'Content-Security-Policy').value;
  assert.match(csp, /manifest-src 'self'/);
  assert.match(csp, /worker-src 'self'/);
  const sw = headers.find((h) => h.source === '/sw.js');
  assert.deepEqual(sw.headers, [{ key: 'Cache-Control', value: 'no-cache' }]);
});

test('the install offer only shows where it can be installed and nobody said no', () => {
  const base = { installed: false, declined: false, canPrompt: false, ios: false };
  assert.equal(installKind(base), null);
  assert.equal(installKind({ ...base, canPrompt: true }), 'prompt');
  assert.equal(installKind({ ...base, ios: true }), 'ios');
  assert.equal(installKind({ ...base, canPrompt: true, installed: true }), null);
  assert.equal(installKind({ ...base, ios: true, declined: true }), null);
});

test('iPhone and iPad are told the steps, other devices are not', () => {
  const iphone = {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
    platform: 'iPhone',
    maxTouchPoints: 5,
  };
  const ipad = {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    platform: 'MacIntel',
    maxTouchPoints: 5,
  };
  const mac = { ...ipad, maxTouchPoints: 0 };
  const android = {
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9)',
    platform: 'Linux armv8l',
    maxTouchPoints: 5,
  };
  assert.equal(isIos(iphone), true);
  assert.equal(isIos(ipad), true);
  assert.equal(isIos(mac), false);
  assert.equal(isIos(android), false);
});
