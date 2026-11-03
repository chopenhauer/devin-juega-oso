import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const json = (path) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const twa = json('android/twa-manifest.json');
const links = json('public/.well-known/assetlinks.json');
const web = json('public/manifest.webmanifest');

test('assetlinks.json trusts the Android app, so it opens without the browser bar', () => {
  const app = links.find((l) => l.target.namespace === 'android_app');
  assert.deepEqual(app.relation, ['delegate_permission/common.handle_all_urls']);
  assert.equal(app.target.package_name, twa.packageId);
  assert.ok(app.target.sha256_cert_fingerprints.length > 0);
  for (const f of app.target.sha256_cert_fingerprints) assert.match(f, /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
});

test('the Android app opens our own site, counted as the play campaign, with the web colours', () => {
  assert.equal(twa.host, 'juegaoso.com');
  const start = new URL(twa.startUrl, `https://${twa.host}`);
  assert.equal(start.pathname, web.start_url);
  assert.equal(start.searchParams.get('utm_campaign'), 'play');
  assert.equal(start.searchParams.get('utm_source'), 'play');
  assert.equal(twa.themeColor, web.theme_color);
  assert.equal(twa.backgroundColor, web.background_color);
});

test('the signing key is kept outside the repo', () => {
  assert.match(twa.signingKey.path, /^\.\.\/\.\.\//);
});
