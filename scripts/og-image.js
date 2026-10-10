// Renders scripts/og-card.html into public/og.png, the 1200×630 card that WhatsApp and other
// apps show when someone shares juegaoso.com. Run with `npm run og` after changing the card.
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const card = new URL('./og-card.html', import.meta.url);
const out = fileURLToPath(new URL('../public/og.png', import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(card.href);
await page.evaluate('document.fonts.ready');
await page.screenshot({ path: out });
await browser.close();
console.log(`Escrita ${out}`);
