// Builds public/sala.html: the game page with its own share card for online invites. vercel.json
// serves it for /?sala=… because WhatsApp and other apps only read the HTML, not our JS. Runs in
// the Vercel build and when scripts/serve.js starts; the output is not committed.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const INVITE_META = {
  'og:title': 'Te reto a una partida de OSO 🐻',
  'og:description': 'Toca el enlace, pon tu nombre y jugamos en línea, cada uno desde su móvil.',
  'og:image': 'https://juegaoso.com/og-sala.png',
  'og:image:alt': 'El oso de OSO con el reto «¡Te reto a una partida!» para jugar en línea',
};

export function invitePage(html) {
  return Object.entries(INVITE_META).reduce((page, [prop, value]) => {
    const re = new RegExp(`(property="${prop}"\\s+content=")[^"]*"`);
    if (!re.test(page)) throw new Error(`index.html no tiene la etiqueta ${prop}`);
    return page.replace(re, `$1${value}"`);
  }, html);
}

export function writeInvitePage(dir = new URL('../public/', import.meta.url)) {
  const html = readFileSync(new URL('index.html', dir), 'utf8');
  writeFileSync(new URL('sala.html', dir), invitePage(html));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) writeInvitePage();
