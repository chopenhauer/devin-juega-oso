import { test, expect } from '@playwright/test';

// Narrow phones, or phones with a big «display size» (an Oppo showed the web at about 270 px):
// the whole UI scales with the root font size, so nothing wraps, overflows or scrolls.
const PHONES = [
  { width: 270, height: 490 },
  { width: 320, height: 568 },
  { width: 360, height: 560 },
];

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'viewports are set per test');
  await page.addInitScript(() => localStorage.setItem('oso.consent.v1', 'denied'));
  await page.route(
    /clarity\.ms|c\.bing\.com|googletagmanager\.com|google-analytics\.com|analytics\.google\.com/,
    (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );
});

const fits = (page) =>
  page.evaluate(() => ({
    x: document.documentElement.scrollWidth <= innerWidth,
    y: document.documentElement.scrollHeight <= innerHeight,
  }));

// The rendered text of an element sits inside it and on one line.
const oneLineInside = (page, sel) =>
  page.locator(sel).evaluateAll((els) =>
    els
      .filter((el) => el.offsetParent)
      .map((el) => {
        const box = el.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(el);
        const text = range.getBoundingClientRect();
        const lines = new Set([...range.getClientRects()].map((r) => Math.round(r.bottom))).size;
        const inside =
          text.left >= box.left - 1 &&
          text.right <= box.right + 1 &&
          text.top >= box.top - 1 &&
          text.bottom <= box.bottom + 1;
        return { text: el.textContent.trim(), inside, lines };
      }),
  );

for (const vp of PHONES) {
  test.describe(`${vp.width}×${vp.height}`, () => {
    // Its own address for the room rate limit, so these rooms don't count against online.spec.js.
    test.use({
      viewport: vp,
      isMobile: true,
      hasTouch: true,
      extraHTTPHeaders: { 'x-real-ip': `responsive-${vp.width}` },
    });

    test('setup: footer and mode labels on one line, nothing overflows', async ({ page }) => {
      await page.goto('/');
      await page.click('#introSkip');
      expect(await fits(page)).toEqual({ x: true, y: true });
      const credits = await page.locator('.credits').boundingBox();
      const lineHeight = await page
        .locator('.credits')
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize) * 2);
      expect(credits.height).toBeLessThan(lineHeight);
      expect(credits.x + credits.width).toBeLessThanOrEqual(vp.width);
      const labels = await page.locator('.mode-btn > span:last-child').evaluateAll((els) =>
        els.map((el) => {
          const btn = el.parentElement.getBoundingClientRect();
          const r = el.getBoundingClientRect();
          return {
            text: el.textContent,
            lines: el.getClientRects().length,
            inside: r.left >= btn.left && r.right <= btn.right,
          };
        }),
      );
      for (const l of labels) expect(l, l.text).toEqual({ ...l, lines: 1, inside: true });
      const buttons = await page
        .locator('.mode-btn')
        .evaluateAll((els) => els.map((el) => el.scrollWidth <= el.clientWidth));
      expect(buttons).not.toContain(false);
    });

    test('online room: avatars inside their circles, share buttons inside the card', async ({ page }) => {
      await page.goto('/');
      await page.click('#introSkip');
      await page.click('#stepNext');
      await page.click('#whereOnline');
      await page.click('#stepNext');
      await page.click('#openRoom');
      await expect(page.locator('#onlineCode')).toHaveText(/^[A-Z2-9]{5}$/);
      expect(await fits(page)).toEqual({ x: true, y: true });
      for (const a of await oneLineInside(page, '.avatars[data-player="0"] .avatar-btn')) {
        expect(a.inside, a.text).toBe(true);
      }
      const card = await page.locator('.second-player').boundingBox();
      for (const sel of ['#onlineInvite .primary:visible', '#onlineInvite .secondary:visible']) {
        const b = await page.locator(sel).first().boundingBox();
        expect(b.x, sel).toBeGreaterThanOrEqual(card.x);
        expect(b.x + b.width, sel).toBeLessThanOrEqual(card.x + card.width);
      }
      for (const t of await oneLineInside(page, '#onlineInvite :is(.primary, .secondary):visible')) {
        expect(t, t.text).toEqual({ ...t, inside: true, lines: 1 });
      }
    });

    test('game: board and both panels fit without scrolling', async ({ page }) => {
      await page.goto('/');
      await page.click('#introSkip');
      await page.click('#stepNext');
      await page.click('#stepNext');
      await page.click('#stepNext');
      await page.click('#viewFacing');
      await page.click('#stepNext');
      await page.click('#startGame');
      await expect(page.locator('#gameScreen')).toBeVisible();
      expect(await fits(page)).toEqual({ x: true, y: true });
      for (const sel of ['#side1', '#side2', '.board-shell']) {
        const b = await page.locator(sel).boundingBox();
        expect(b.y, sel).toBeGreaterThanOrEqual(0);
        expect(b.y + b.height, sel).toBeLessThanOrEqual(vp.height);
      }
    });
  });
}

test('the UI scales with the screen below 360 px and stays as it was above', async ({ page }) => {
  const root = () => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  await page.setViewportSize({ width: 270, height: 700 });
  await page.goto('/');
  expect(await root()).toBeCloseTo(12, 0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await root()).toBe(16);
});
