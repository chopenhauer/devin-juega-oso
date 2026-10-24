// Builds public/sala.html and public/reto.html: the game page with its own share card for online
// invites (middleware.js serves it for /?sala=…) and for the reto del día (/reto), because WhatsApp
// and other apps only read the HTML, not our JS. Runs in the Vercel build and when scripts/serve.js
// starts; the output is not committed.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const es = JSON.parse(readFileSync(new URL('../public/locales/es.json', import.meta.url), 'utf8'));

// Texts in public/locales/es.json, like the rest of the game.
export const INVITE_META = {
  'og:title': es['invite.og_title'],
  'og:description': es['invite.og_description'],
  'og:image': 'https://juegaoso.com/og-sala.png',
  'og:image:alt': es['invite.og_image_alt'],
};

export const DAILY_META = {
  'og:url': 'https://juegaoso.com/reto',
  'og:title': es['daily.og_title'],
  'og:description': es['daily.og_description'],
  'og:image:alt': es['daily.og_image_alt'],
};

export function invitePage(html, meta = INVITE_META) {
  return Object.entries(meta).reduce((page, [prop, value]) => {
    const re = new RegExp(`(property="${prop}"\\s+content=")[^"]*"`);
    if (!re.test(page)) throw new Error(`index.html no tiene la etiqueta ${prop}`);
    return page.replace(re, `$1${value}"`);
  }, html);
}

export function writeInvitePage(dir = new URL('../public/', import.meta.url)) {
  const html = readFileSync(new URL('index.html', dir), 'utf8');
  writeFileSync(new URL('sala.html', dir), invitePage(html));
  writeFileSync(new URL('reto.html', dir), invitePage(html, DAILY_META));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) writeInvitePage();
