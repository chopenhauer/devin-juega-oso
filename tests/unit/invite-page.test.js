import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { INVITE_META, invitePage } from '../../scripts/invite-page.js';
import middleware, { config as middlewareConfig } from '../../middleware.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('the invite page is the game page with its own share card', () => {
  const index = read('public/index.html');
  const page = invitePage(index);
  for (const [prop, value] of Object.entries(INVITE_META)) {
    assert.match(page, new RegExp(`property="${prop}"\\s+content="${value}"`), prop);
  }
  const strip = (html) => html.replace(/(property="og:[a-z:]+"\s+content=")[^"]*"/g, '$1"');
  assert.equal(strip(page), strip(index));
  assert.ok(existsSync(new URL('../../public/og-sala.png', import.meta.url)));
});

test('the middleware serves the invite page for links with a room code', () => {
  assert.equal(middlewareConfig.matcher, '/');
  const res = middleware(new Request('https://juegaoso.com/?sala=K7QD2&utm_source=whatsapp'));
  assert.equal(
    res.headers.get('x-middleware-rewrite'),
    'https://juegaoso.com/sala?sala=K7QD2&utm_source=whatsapp',
  );
  assert.equal(middleware(new Request('https://juegaoso.com/?utm_source=whatsapp')), undefined);
});

test('Vercel builds the invite page and uploads the middleware', () => {
  const config = JSON.parse(read('vercel.json'));
  assert.equal(config.rewrites, undefined);
  assert.match(config.buildCommand, /^node scripts\/invite-page\.js && /);
  assert.match(read('.vercelignore'), /^!\/scripts\/invite-page\.js$/m);
  assert.match(read('.vercelignore'), /^!\/middleware\.js$/m);
});
