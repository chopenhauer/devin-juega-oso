// Renders scripts/icon-card.html into the icons for installing OSO on the home screen
// (public/icons/, listed in public/manifest.webmanifest and index.html).
// Run with `npm run icons` after changing the card.
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const icons = [
  ['', 192, 'icon-192.png'],
  ['', 512, 'icon-512.png'],
  ['?maskable', 512, 'icon-maskable-512.png'],
  ['', 180, 'apple-touch-icon.png'],
];

const browser = await chromium.launch();
for (const [query, size, file] of icons) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const out = fileURLToPath(new URL(`../public/icons/${file}`, import.meta.url));
  await page.goto(new URL(`./icon-card.html${query}`, import.meta.url).href);
  await page.screenshot({ path: out });
  await page.close();
  console.log(`Escrita ${out}`);
}
await browser.close();
