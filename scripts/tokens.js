// Exports public/css/tokens.css as docs/tokens.json in the W3C Design Tokens format
// (https://tr.designtokens.org/format/), e.g. to import them as Figma variables.
// Run with `npm run tokens` after changing tokens.css; a unit test checks it is up to date.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../public/css/tokens.css', import.meta.url));
export const out = fileURLToPath(new URL('../docs/tokens.json', import.meta.url));

const blocks = (css) =>
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}@]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({
    sel: sel.trim().replace(/\s+/g, ' '),
    decls: [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [
      k,
      v.trim().replace(/\s+/g, ' '),
    ]),
  }));

const typeOf = (k, v) => {
  if (/^(#|rgba?\()/.test(v)) return 'color';
  if (/^-?[\d.]+px$/.test(v)) return 'dimension';
  if (/^[\d.]+m?s$/.test(v)) return 'duration';
  if (v.startsWith('cubic-bezier')) return 'cubicBezier';
  if (k.startsWith('font-family')) return 'fontFamily';
  if (k.startsWith('fw-')) return 'fontWeight';
  if (k.startsWith('z-')) return 'number';
  return undefined;
};

function token(k, v, where) {
  const ref = v.match(/^var\(--([\w-]+)\)$/);
  if (ref) return { $value: `{${where(ref[1])}.${ref[1]}}` };
  const $type = typeOf(k, v);
  let $value = v;
  if ($type === 'cubicBezier') $value = v.match(/[\d.]+/g).map(Number);
  if ($type === 'number' || $type === 'fontWeight') $value = Number(v);
  if ($type === 'fontFamily') $value = v.split(',').map((f) => f.trim().replace(/'/g, ''));
  return $type ? { $type, $value } : { $value };
}

export function buildTokens(css) {
  const bs = blocks(css);
  const groups = { primitive: {}, semantic: {}, component: {}, alias: {} };
  const layer = {};
  const [prim, sem, comp, alias] = bs.filter((b) => b.sel === ':root' || b.sel === ':root, body');
  [
    ['primitive', prim],
    ['semantic', sem],
    ['component', comp],
    ['alias', alias],
  ].forEach(([g, b]) => b.decls.forEach(([k]) => (layer[k] = g)));
  const where = (k) => layer[k] ?? 'primitive';
  [
    ['primitive', prim],
    ['semantic', sem],
    ['component', comp],
    ['alias', alias],
  ].forEach(([g, b]) => b.decls.forEach(([k, v]) => (groups[g][k] = token(k, v, where))));
  const themes = {};
  for (const b of bs) {
    const t = b.sel.match(/^body\[data-theme='(\w+)'\]$/);
    if (t) themes[t[1]] = Object.fromEntries(b.decls.map(([k, v]) => [k, token(k, v, where)]));
  }
  return {
    $description: 'OSO design tokens, generated from public/css/tokens.css',
    ...groups,
    theme: themes,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(out, JSON.stringify(buildTokens(readFileSync(src, 'utf8')), null, 2) + '\n');
  console.log(`Wrote ${out}`);
}
