import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import * as espree from 'espree';
import { t, pickLang, LANGS, BASE } from '../../public/js/i18n.js';
import { THEMES } from '../../public/js/themes.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const es = JSON.parse(read('public/locales/es.json'));
const html = read('public/index.html');
// config.js only documents the parameters (CONFIG.md), design.js is the /design guide, lab.js is
// Julia's internal lab (/lab), i18n.js loads the texts.
const NOT_GAME_TEXT = new Set(['config.js', 'design.js', 'i18n.js', 'lab.js']);
const modules = readdirSync(new URL('../../public/js/', import.meta.url)).filter(
  (f) => f.endsWith('.js') && !NOT_GAME_TEXT.has(f),
);

function walk(node, visit, parent = null) {
  if (!node || typeof node.type !== 'string') return;
  visit(node, parent);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((n) => walk(n, visit, node));
    else if (value && typeof value === 'object' && value.type) walk(value, visit, node);
  }
}
const ast = (file) =>
  espree.parse(read(`public/js/${file}`), { ecmaVersion: 'latest', sourceType: 'module' });

const keysInHtml = () => {
  const keys = [...html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)].map((m) => m[1]);
  for (const [, pairs] of html.matchAll(/data-i18n-attr="([^"]+)"/g))
    keys.push(...pairs.split(';').map((p) => p.split(':')[1]));
  return keys;
};
// t('a') or t(cond ? 'a' : 'b'): the keys are the literal results, not the condition.
const keyLiterals = (n) =>
  n?.type === 'Literal'
    ? [n.value]
    : n?.type === 'ConditionalExpression'
      ? [...keyLiterals(n.consequent), ...keyLiterals(n.alternate)]
      : [];
const keysInJs = () => {
  const keys = [];
  for (const file of modules)
    walk(ast(file), (n) => {
      if (n.type === 'CallExpression' && n.callee.name === 't') keys.push(...keyLiterals(n.arguments[0]));
    });
  return keys;
};
const themeKeys = [
  ...Object.keys(THEMES).map((id) => `theme.${id}`),
  // The share card of online invites, built by scripts/invite-page.js.
  ...[...read('scripts/invite-page.js').matchAll(/es\['([^']+)'\]/g)].map((m) => m[1]),
];

test('every key used by the page and the code exists in es.json', () => {
  for (const key of [...keysInHtml(), ...keysInJs(), ...themeKeys]) assert.ok(key in es, key);
});

test('es.json has no texts that nobody uses', () => {
  // The 🔔 notice texts are filled in by the server (api/_push.js).
  const server = [...read('api/_push.js').matchAll(/fill\('([^']+)'/g)].map((m) => m[1]);
  const used = new Set([...keysInHtml(), ...keysInJs(), ...themeKeys, ...server]);
  assert.deepEqual(
    Object.keys(es).filter((k) => !used.has(k)),
    [],
  );
});

test('the code has no texts for players outside the locale files', () => {
  const words = /[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,}\s+[A-Za-zÁÉÍÓÚáéíóúñÑ¿¡]{2,}|[áéíóúñ¿¡]/;
  const found = [];
  for (const file of modules)
    walk(ast(file), (n, parent) => {
      const text = n.type === 'Literal' ? n.value : n.type === 'TemplateElement' ? n.value.cooked : null;
      if (typeof text !== 'string' || !words.test(text)) return;
      if (parent?.type === 'ImportDeclaration' || (parent?.type === 'Property' && parent.key === n)) return;
      if (parent?.type === 'CallExpression' && parent.callee.name === 't') return;
      found.push(`${file}:${n.loc?.start.line ?? ''} ${text}`);
    });
  assert.deepEqual(found, []);
});

test('t() fills variables and picks the plural form', () => {
  assert.equal(t('end.winner', { name: 'Julia' }), '¡Gana Julia!');
  assert.equal(t('session.games', { count: 1 }), '1 partida');
  assert.equal(t('session.games', { count: 3 }), '3 partidas seguidas');
  assert.equal(t('end.winner'), '¡Gana {name}!');
});

test('the language follows the browser and falls back to Spanish', () => {
  assert.equal(BASE, 'es');
  assert.equal(pickLang(['es-ES']), 'es');
  assert.equal(pickLang(['fr-FR', 'es-MX']), 'es');
  assert.equal(pickLang(['en-US']), 'es');
  assert.equal(pickLang(['en-US'], ['es', 'en']), 'en');
  assert.equal(pickLang([]), 'es');
});

test('future languages only translate keys that exist in Spanish', () => {
  const files = readdirSync(new URL('../../public/locales/', import.meta.url));
  assert.deepEqual(files.map((f) => f.replace('.json', '')).sort(), [...LANGS].sort());
  for (const f of files) {
    const extra = Object.keys(JSON.parse(read(`public/locales/${f}`))).filter((k) => !(k in es));
    assert.deepEqual(extra, [], f);
  }
});
