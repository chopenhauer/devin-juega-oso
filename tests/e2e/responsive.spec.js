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

// Setup screens scroll beneath two solid bars (the round buttons on top, the credits below): at
// either end of the scroll the card is clear of both, and a tap on a bar stays on the bar.
async function expectClearOfBars(page) {
  const bars = await page.evaluate(() => {
    const top = getComputedStyle(document.querySelector('.credits'), '::before');
    const credits = getComputedStyle(document.querySelector('.credits'));
    const buttons = [...document.querySelectorAll('.online-toggle, .daily-toggle, .theme-toggle')]
      .filter((el) => el.offsetParent)
      .map((el) => el.getBoundingClientRect().bottom);
    return {
      top: parseFloat(top.height),
      buttons: Math.max(...buttons),
      colours: [top.backgroundColor, credits.backgroundColor],
    };
  });
  for (const c of bars.colours) expect(c, 'solid bar').toMatch(/^rgb\(/);
  expect(bars.buttons).toBeLessThanOrEqual(bars.top);
  const scroll = (y) => page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y);
  await scroll(0);
  expect((await page.locator('.panel').boundingBox()).y).toBeGreaterThanOrEqual(bars.top - 1);
  await scroll(1e5);
  const card = await page.locator('.panel').boundingBox();
  const credits = await page.locator('.credits').boundingBox();
  expect(card.y + card.height).toBeLessThanOrEqual(credits.y + 1);
  const hit = await page.evaluate(
    ([x, y]) => Boolean(document.elementFromPoint(x, y)?.closest('.credits')),
    [credits.x + 4, credits.y + credits.height / 2],
  );
  expect(hit, 'a tap on the credits bar stays on it').toBe(true);
  await scroll(0);
}

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

    test('setup: footer and mode labels on one line, the card clear of the bars', async ({ page }) => {
      await page.goto('/');
      await page.click('#introSkip');
      expect((await fits(page)).x).toBe(true);
      await expectClearOfBars(page);
      const credits = await page.locator('.credits').boundingBox();
      const line = await page.locator('.credits').evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return {
          height: range.getBoundingClientRect().height,
          max: parseFloat(getComputedStyle(el).fontSize) * 2,
        };
      });
      expect(line.height).toBeLessThan(line.max);
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
      expect((await fits(page)).x).toBe(true);
      await expectClearOfBars(page);
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

// Taller phones, a tablet and a desktop: the home and the reto del día, whose card is the tallest.
const SCREENS = [
  { width: 360, height: 640 },
  { width: 393, height: 740 },
  { width: 412, height: 800 },
  { width: 820, height: 1180 },
  { width: 1440, height: 900 },
];
for (const vp of SCREENS) {
  test(`${vp.width}×${vp.height}: the setup card never sits under the top buttons or the credits`, async ({
    page,
  }) => {
    await page.setViewportSize(vp);
    await page.addInitScript(() => localStorage.setItem('oso.prefs.v1', JSON.stringify({ seenIntro: true })));
    for (const path of ['/', '/reto']) {
      await page.goto(path);
      await expect(page.locator('#setupScreen')).toBeVisible();
      expect((await fits(page)).x, path).toBe(true);
      await expectClearOfBars(page);
    }
    await page.goto('/');
    await page.click('#helpToggle');
    await expect(page.locator('#helpModal')).toBeVisible();
    await expect(page.locator('.credits')).toBeHidden();
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
