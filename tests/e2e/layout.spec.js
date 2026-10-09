import { test, expect } from '@playwright/test';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  'iPad landscape': { width: 1180, height: 820 },
  'iPad portrait': { width: 820, height: 1180 },
};
const MODES = ['solo', 'same', 'facing'];

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    () => localStorage.getItem('oso.consent.v1') ?? localStorage.setItem('oso.consent.v1', 'denied'),
  );
  test.skip(testInfo.project.name !== 'desktop', 'viewports are set per test');
  await page.route(
    /clarity\.ms|c\.bing\.com|googletagmanager\.com|google-analytics\.com|analytics\.google\.com/,
    (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );
});

async function startGame(page, mode) {
  await page.goto('/');
  await page.click('#introSkip');
  if (mode === 'solo') {
    await page.click('#modeSolo');
    await page.click('#stepNext');
    await page.click('#stepNext');
  } else {
    await page.click('#stepNext');
    await page.click('#stepNext');
    await page.click(mode === 'same' ? '#viewSame' : '#viewFacing');
    await page.click('#stepNext');
  }
  await page.click('#startGame');
  await expect(page.locator('#gameScreen')).toBeVisible();
}

const box = async (page, sel) => page.locator(sel).boundingBox();
const overlaps = (a, b) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

for (const [device, viewport] of Object.entries(VIEWPORTS)) {
  for (const mode of MODES) {
    test(`${device}, ${mode}: big board, panels beside it, nothing overflows`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await startGame(page, mode);
      const [board, p1, p2] = await Promise.all(
        ['.board-shell', '#side1', '#side2'].map((s) => box(page, s)),
      );
      for (const panel of [p1, p2]) {
        expect(overlaps(board, panel), 'panel overlaps the board').toBe(false);
        expect(panel.x).toBeGreaterThanOrEqual(0);
        expect(panel.x + panel.width).toBeLessThanOrEqual(viewport.width);
        expect(panel.y + panel.height).toBeLessThanOrEqual(viewport.height);
      }
      expect(board.width).toBeGreaterThanOrEqual(560);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(viewport.width);

      if (device === 'iPad portrait') {
        expect(p2.y + p2.height).toBeLessThanOrEqual(board.y);
        expect(p1.y).toBeGreaterThanOrEqual(board.y + board.height);
      } else if (mode === 'solo') {
        expect(p1.x).toBeGreaterThanOrEqual(board.x + board.width);
        expect(p2.y + p2.height).toBeLessThanOrEqual(p1.y);
      } else {
        expect(p1.x + p1.width).toBeLessThanOrEqual(board.x);
        expect(p2.x).toBeGreaterThanOrEqual(board.x + board.width);
      }
    });
  }
}
