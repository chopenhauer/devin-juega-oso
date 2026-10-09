import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const consentCalls = (page) =>
  page.evaluate(() =>
    window.dataLayer.filter((e) => e[0] === 'consent').map((e) => [e[1], e[2].analytics_storage]),
  );

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.clarity = [];
  page.on('request', (r) => /clarity\.ms/.test(r.url()) && testInfo.clarity.push(r.url()));
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

test('accepting cookies grants GA analytics and loads Clarity', async ({ page }, testInfo) => {
  await page.goto('/');
  const banner = page.locator('#consentBanner');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('Google Analytics y Microsoft Clarity');
  expect(await consentCalls(page)).toEqual([['default', 'denied']]);
  const axe = await new AxeBuilder({ page })
    .include('#consentBanner')
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact))).toEqual([]);
  expect(testInfo.clarity).toEqual([]);

  const tag = page.waitForRequest(/www\.clarity\.ms\/tag\/yuj6hlg34s/);
  await page.click('#consentAccept');
  await tag;
  await expect(banner).toBeHidden();
  expect(await consentCalls(page)).toEqual([
    ['default', 'denied'],
    ['update', 'granted'],
  ]);
  expect(await page.evaluate(() => localStorage.getItem('oso.consent.v1'))).toBe('granted');

  await page.reload();
  await expect(banner).toBeHidden();
  expect(await consentCalls(page)).toEqual([['default', 'granted']]);
  await expect.poll(() => page.evaluate(() => typeof window.clarity)).toBe('function');
});

test('rejecting keeps analytics denied and Clarity off; Cookies reopens the choice', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.click('#consentDeny');
  await expect(page.locator('#consentBanner')).toBeHidden();
  expect(await consentCalls(page)).toEqual([
    ['default', 'denied'],
    ['update', 'denied'],
  ]);

  await page.reload();
  await expect(page.locator('#consentBanner')).toBeHidden();
  await page.waitForTimeout(300);
  expect(testInfo.clarity).toEqual([]);
  expect(await page.evaluate(() => typeof window.clarity)).toBe('undefined');

  await page.click('#cookieSettings');
  await expect(page.locator('#consentBanner')).toBeVisible();
  await expect(page.locator('#consentAccept')).toBeFocused();
  await page.click('#consentAccept');
  await expect(page.locator('#cookieSettings')).toBeFocused();
  await expect.poll(() => testInfo.clarity.length).toBeGreaterThan(0);
});

test('the banner is not shown during the game', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#consentBanner')).toBeVisible();
  await page.click('#introSkip');
  await page.click('#stepNext');
  await page.click('#stepNext');
  await page.click('#stepNext');
  await page.click('#startGame');
  await expect(page.locator('#gameScreen')).toBeVisible();
  await expect(page.locator('#consentBanner')).toBeHidden();
});
