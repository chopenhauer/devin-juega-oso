import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  await page.route(
    /clarity\.ms|c\.bing\.com|googletagmanager\.com|google-analytics\.com|analytics\.google\.com/,
    (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );
  testInfo.errors = [];
  page.on('pageerror', (e) => testInfo.errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && testInfo.errors.push(m.text()));
});

// eslint-disable-next-line no-empty-pattern
test.afterEach(async ({}, testInfo) => {
  expect(testInfo.errors, 'no JS or CSP errors').toEqual([]);
});

const menuRotation = (page) =>
  page.locator('#sidebar').evaluate((e) => e.style.getPropertyValue('--menu-rot'));

const panelRotation = (page, sel) =>
  page.locator(sel).evaluate((e) => {
    const t = getComputedStyle(e).transform;
    if (t === 'none') return '0deg';
    const m = new DOMMatrixReadOnly(t);
    return `${Math.round(Math.atan2(m.b, m.a) / (Math.PI / 2)) * 90}deg`;
  });

async function startGame(page, { solo = false, view = 'facing' } = {}) {
  await page.goto('/');
  await page.click('#introSkip');
  if (solo) await page.click('#modeSolo');
  await page.click('#stepNext');
  await page.click('#stepNext');
  if (!solo) {
    await page.click(view === 'same' ? '#viewSame' : '#viewFacing');
    await page.click('#stepNext');
  }
  await page.click('#startGame');
}

test('each player opens the menu from their own panel, turned toward them', async ({ page }) => {
  await startGame(page);
  const sidebar = page.locator('#sidebar');
  await expect(sidebar).toBeHidden();

  await page.click('#menu2');
  await expect(sidebar).toBeVisible();
  const p2 = await panelRotation(page, '#side2');
  expect(p2).not.toBe('0deg');
  expect(await menuRotation(page)).toBe(p2);
  await expect(page.locator('#menu2')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#gameHelp')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#closeMenu')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sidebar).toBeHidden();
  await expect(page.locator('#menu2')).toBeFocused();

  await page.click('#menu1');
  await expect(sidebar).toBeVisible();
  expect(await menuRotation(page)).toBe(await panelRotation(page, '#side1'));
  const covered = await page
    .locator('#side1 .letter')
    .first()
    .evaluate((e) => {
      const r = e.getBoundingClientRect();
      return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.id;
    });
  expect(covered).toBe('menuScrim');
  await page.locator('#menuScrim').click({ position: { x: 40, y: 40 } });
  await expect(sidebar).toBeHidden();
});

test('same view keeps the menu upright; solo shows only the human menu button', async ({ page }) => {
  await startGame(page, { view: 'same' });
  await page.click('#menu2');
  expect(await menuRotation(page)).toBe('0deg');
  await page.click('#closeMenu');
  await expect(page.locator('#sidebar')).toBeHidden();

  await page.click('#menu1');
  await page.click('#newGame');
  await page.click('#modeSolo');
  await page.click('#stepNext');
  await page.click('#stepNext');
  await page.click('#startGame');
  await expect(page.locator('#menu1')).toBeVisible();
  await expect(page.locator('#menu2')).toBeHidden();
});
