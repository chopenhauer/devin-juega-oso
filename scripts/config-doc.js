// Writes docs/CONFIG.md, the game director's table of every parameter in public/js/config.js.
// Run with `npm run config` after changing config.js; a unit test checks it is up to date.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GAME, HELP, SECTIONS } from '../public/js/config.js';

export const out = fileURLToPath(new URL('../docs/CONFIG.md', import.meta.url));

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const show = (path, v) =>
  path === 'board.seconds'
    ? Object.entries(v)
        .map(([n, s]) => `${n}×${n} ${clock(s)}`)
        .join(' · ')
    : String(v);

export function buildConfigDoc() {
  const lines = [
    '# Parámetros del juego',
    '',
    '<!-- Generado por `npm run config` a partir de public/js/config.js: no lo edites a mano. -->',
    '',
    'Todo lo que se puede ajustar como director del juego está en',
    '[`public/js/config.js`](../public/js/config.js). Cambiar un valor ahí lo cambia en el juego, en el',
    'servidor de salas en línea y en los textos que lo mencionan (reglas, avisos, el secreto del 🎨 y el',
    'selector de tableros).',
    '',
    'Cómo cambiar uno:',
    '',
    '1. Edita el valor en `public/js/config.js` (si añades uno nuevo, explícalo también en `HELP`).',
    '2. `npm run config` para regenerar esta tabla y `npm test` para comprobar que los valores tienen',
    '   sentido.',
    '3. Rama, preview y «publica», como siempre. Anótalo en el CHANGELOG (suele ser un PATCH).',
  ];
  for (const [section, title] of Object.entries(SECTIONS)) {
    lines.push('', `## ${title}`, '', '| Parámetro | Valor | Qué hace |', '| --- | --- | --- |');
    for (const [key, value] of Object.entries(GAME[section])) {
      const path = `${section}.${key}`;
      lines.push(`| \`${path}\` | ${show(path, value)} | ${HELP[path]} |`);
    }
  }
  return lines.join('\n') + '\n';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) writeFileSync(out, buildConfigDoc());
