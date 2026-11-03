import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../public/${path}`, import.meta.url), 'utf8');
const SITE = 'https://juegaoso.com/';
const fileFor = (url) => (url === SITE ? 'index.html' : `${url.slice(SITE.length)}.html`);

test('every sitemap URL is its own canonical, so the sitemap never contradicts it', () => {
  const urls = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(urls.includes(`${SITE}como-jugar`));
  for (const url of urls) {
    const canonical = read(fileFor(url)).match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.equal(canonical, url, fileFor(url));
  }
});

test('the JSON-LD blocks are valid JSON', () => {
  for (const file of ['index.html', 'como-jugar.html']) {
    const blocks = [...read(file).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length > 0, file);
    for (const [, json] of blocks) assert.equal(JSON.parse(json)['@context'], 'https://schema.org');
  }
});
