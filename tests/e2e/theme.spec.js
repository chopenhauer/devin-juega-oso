import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

const selected = (page, p) => page.locator(`.avatars[data-player="${p}"] .avatar-btn.selected`);

test('the 🎨 button switches theme avatars, icon and background, and remembers it', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('#themeToggle');
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'classic');
  await expect(toggle).toHaveClass(/hint/);
  const box = await toggle.boundingBox();
  const card = await page.locator('.panel').boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(card.y);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).not.toHaveClass(/hint/);
  await expect(page.locator('.theme-option[data-theme="classic"]')).toBeFocused();
  await page.click('.theme-option[data-theme="halloween"]');
  await expect(page.locator('#themeMenu')).toBeHidden();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'halloween');
  await expect(page.locator('#brandIcon')).toHaveText('🎃');
  await expect(page.locator('#themeDecor span')).toHaveCount(16);

  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'halloween');
  await expect(toggle).not.toHaveClass(/hint/);
  await page.click('#introStart');
  await expect(page.locator('#setupScreen')).toHaveAttribute('data-step', 'rules');
  await expect(toggle).toBeVisible();
  await page.reload();
  await page.click('#introSkip');
  await expect(page.locator('#setupScreen')).toHaveAttribute('data-step', 'mode');
  await expect(toggle).toBeVisible();
  await page.click('#stepNext');
  await expect(page.locator('#setupScreen')).toHaveAttribute('data-step', 'players');
  await expect(toggle).toBeHidden();
  await page.click('#stepBack');
  await expect(toggle).toBeVisible();
  await page.click('#stepNext');
  await expect(toggle).toBeHidden();
  await expect(selected(page, 0)).toHaveText('🎃');
  await expect(selected(page, 1)).toHaveText('🧛');
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .disableRules(['color-contrast'])
    .analyze();
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);

  await page.reload();
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#themeMenu')).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.click('.theme-option[data-theme="christmas"]');
  await page.click('#introSkip');
  await page.click('#stepNext');
  await expect(selected(page, 0)).toHaveText('⛄');
  await expect(selected(page, 1)).toHaveText('🎅');
  await page.click('#stepNext');
  await page.click('#stepNext');
  await page.click('#startGame');
  await expect(page.locator('#avatar1')).toHaveText('⛄');
  await expect(page.locator('#avatar2')).toHaveText('🎅');
  await expect(toggle).toBeHidden();
});
