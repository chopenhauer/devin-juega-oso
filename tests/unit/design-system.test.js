import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { buildTokens } from '../../scripts/tokens.js';
import { THEMES, themeTokens } from '../../public/js/themes.js';

const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const list = (dir, ext) =>
  readdirSync(new URL(dir, root))
    .filter((f) => f.endsWith(ext))
    .map((f) => dir + f);
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, 'url()');

const tokensCss = read('public/css/tokens.css');
const cssFiles = list('public/css/', '.css').filter((f) => !f.endsWith('tokens.css'));
const jsFiles = list('public/js/', '.js');
const COLOUR = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i;

const defined = new Set(
  [tokensCss, ...cssFiles.map(read)].flatMap((c) => [...c.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1])),
);
for (const f of jsFiles) for (const m of read(f).matchAll(/'(--[\w-]+)'/g)) defined.add(m[1]);

test('styles only use tokens: no raw colours, font sizes, weights, layers or easings', () => {
  for (const f of cssFiles) {
    const lines = strip(read(f)).split('\n');
    lines.forEach((l, i) => {
      const where = `${f}:${i + 1}: ${l.trim()}`;
      assert.doesNotMatch(l, COLOUR, where);
      assert.doesNotMatch(l, /font-size:\s*[\d.]/, where);
      assert.doesNotMatch(l, /font-weight:\s*\d+;/, where);
      assert.doesNotMatch(l, /z-index:\s*\d{2,}/, where);
      assert.doesNotMatch(l, /cubic-bezier\(/, where);
    });
  }
});

test('colours in JS live only in theme data', () => {
  for (const f of jsFiles.filter((f) => !f.endsWith('themes.js'))) {
    assert.doesNotMatch(read(f), COLOUR, f);
  }
});

test('every token that is used is defined', () => {
  const used = [...cssFiles, 'public/css/tokens.css', ...jsFiles].flatMap((f) =>
    [...read(f).matchAll(/var\((--[\w-]+)\)/g)].map((m) => [f, m[1]]),
  );
  const missing = used.filter(([, t]) => !defined.has(t)).map((u) => u.join(' '));
  assert.deepEqual(missing, []);
});

test('semantic tokens are built only from primitives', () => {
  const blocks = [...strip(tokensCss).matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const prim = new Set([...blocks[0][2].matchAll(/(--[\w-]+):/g)].map((m) => m[1]));
  for (const [, k, v] of blocks[1][2].matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    const ref = v.match(/^var\((--[\w-]+)\)$/);
    assert.ok(ref && prim.has(ref[1]), `${k}: ${v}`);
  }
});

test('themes only set existing tokens', () => {
  for (const [id, t] of Object.entries(THEMES)) {
    for (const k of Object.keys(themeTokens(t))) assert.ok(defined.has(k), `${id} sets unknown ${k}`);
  }
  assert.equal(themeTokens(THEMES.newyear)['--color-board-1'], '#241a55');
  assert.deepEqual(themeTokens({ tokens: { '--color-accent': 'red' } }), { '--color-accent': 'red' });
});

test('docs/tokens.json is up to date (run `npm run tokens`)', () => {
  assert.deepEqual(JSON.parse(read('docs/tokens.json')), buildTokens(tokensCss));
});
