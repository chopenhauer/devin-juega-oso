// Renders scripts/og-card.html into the 1200×630 cards that WhatsApp and other apps show when
// someone shares juegaoso.com (public/og.png) or an online invite (public/og-sala.png).
// Run with `npm run og` after changing the card.
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const cards = [
  ['', 'og.png'],
  ['?sala', 'og-sala.png'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [query, file] of cards) {
  const out = fileURLToPath(new URL(`../public/${file}`, import.meta.url));
  await page.goto(new URL(`./og-card.html${query}`, import.meta.url).href);
  await page.evaluate('document.fonts.ready');
  await page.screenshot({ path: out });
  console.log(`Escrita ${out}`);
}
await browser.close();
