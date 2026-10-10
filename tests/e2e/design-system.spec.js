import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    () => localStorage.getItem('oso.consent.v1') ?? localStorage.setItem('oso.consent.v1', 'denied'),
  );
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

const style = (loc, prop) => loc.evaluate((e, p) => getComputedStyle(e)[p], prop);

test('changing a token restyles the game straight away', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('#introStart');
  await page.evaluate(() => document.body.style.setProperty('--color-accent-light', 'rgb(1, 2, 3)'));
  await expect.poll(() => style(button, 'backgroundImage')).toContain('rgb(1, 2, 3)');
  await page.evaluate(() => document.documentElement.style.setProperty('--fs-2xl', '31px'));
  await expect.poll(() => style(button, 'fontSize')).toBe('31px');
});

test('themes restyle the game only through tokens', async ({ page }) => {
  await page.addInitScript(
    () => localStorage.getItem('oso.theme.v1') ?? localStorage.setItem('oso.theme.v1', 'halloween'),
  );
  await page.goto('/');
  const token = (n) => page.evaluate((n) => getComputedStyle(document.body).getPropertyValue(n).trim(), n);
  expect(await token('--color-accent')).toBe('#ff9f1c');
  expect(await token('--accent')).toBe('#ff9f1c');
  await page.evaluate(() => localStorage.setItem('oso.theme.v1', 'valentine'));
  await page.reload();
  expect(await token('--color-board-1')).toBe('#4a1238');
  expect(await style(page.locator('.board-shell'), 'backgroundImage')).toContain('rgb(74, 18, 56)');
});

test('the /design guide shows the live tokens and themes', async ({ page }) => {
  await page.goto('/design');
  await expect(page.locator('h1')).toHaveText('Sistema de diseño de OSO');
  expect(await page.locator('.ds-swatch').count()).toBeGreaterThan(200);
  const accent = page.locator('.ds-swatch[data-token="--color-accent"] .ds-value');
  await expect(accent).toHaveText('#ffd23f');
  await page.selectOption('#dsTheme', 'halloween');
  await expect(accent).toHaveText('#ff9f1c');
});
