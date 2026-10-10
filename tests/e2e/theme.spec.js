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
  await page.clock.setFixedTime(new Date('2026-12-01T12:00:00'));
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
  await expect(page.locator('#setupScreen')).toHaveAttribute('data-step', 'where');
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
  await page.click('#stepNext');
  await page.click('#startGame');
  await expect(page.locator('#avatar1')).toHaveText('⛄');
  await expect(page.locator('#avatar2')).toHaveText('🎅');
  await expect(toggle).toBeHidden();
});

test('the rules modal is not covered by the 🎨 button or the credits', async ({ page }) => {
  await page.goto('/');
  await page.click('#introSkip');
  const toggle = page.locator('#themeToggle');
  await expect(toggle).toBeVisible();
  await page.click('#helpToggle');
  await expect(page.locator('#helpModal')).toBeVisible();
  await expect(toggle).toBeHidden();
  await expect(page.locator('.credits')).toBeHidden();
  await page.click('#helpClose');
  await expect(toggle).toBeVisible();
  await expect(page.locator('.credits')).toBeVisible();
});

const options = (page) => page.locator('#themeMenu .theme-option:visible');

test('the menu offers nearby dates, «Ver otros» up to 10 and the easter egg shows them all', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-08T12:00:00'));
  await page.goto('/');
  const toggle = page.locator('#themeToggle');
  await toggle.click();
  const main = await options(page).allTextContents();
  expect(main.length).toBeLessThanOrEqual(5);
  expect(main).toEqual(expect.arrayContaining(['🐻 Clásico', '🎃 Halloween', '🍂 Otoño']));
  await expect(page.locator('#themeMore')).toHaveAttribute('aria-expanded', 'false');
  await page.click('#themeMore');
  await expect(page.locator('#themeMore')).toHaveAttribute('aria-expanded', 'true');
  expect(await options(page).count()).toBeLessThanOrEqual(10);
  await expect(page.locator('#themeOthers')).toContainText('Cumpleaños');
  await expect(page.locator('#themeAll')).toHaveCount(0);
  await page.click('.theme-option[data-theme="birthday"]');
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'birthday');
  await expect(page.locator('body')).toHaveClass(/skin/);

  await page.addInitScript(() => {
    const A = window.AudioContext;
    window.AudioContext = class extends A {
      constructor(...args) {
        super(...args);
        window.__fanfare = (window.__fanfare ?? 0) + 1;
      }
    };
  });
  await page.reload();
  await toggle.click();
  const width = (await page.locator('#themeMenu').boundingBox()).width;
  for (let i = 0; i < 5; i++) {
    await toggle.click();
    await expect(page.locator('#themeMenu')).toBeVisible();
  }
  const party = page.locator('#eggParty');
  await expect(party).toContainText('¡Tienes más temas disponibles!');
  expect(await party.locator('span').count()).toBeGreaterThan(10);
  const backdrop = () => party.evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(await backdrop()).not.toBe('rgba(0, 0, 0, 0)');
  expect(await page.evaluate(() => window.__fanfare)).toBe(1);
  await expect(page.locator('#themeMenu')).not.toContainText('temas disponibles');
  await expect(page.locator('#themeMenu .theme-option')).toHaveCount(24);
  await expect(page.locator('#themeMenu .theme-option:visible')).toHaveCount(24);
  expect(await page.locator('#themeMenu .theme-group').count()).toBe(2);
  expect((await page.locator('#themeMenu').boundingBox()).width).toBe(width);
  await expect(party).toBeEmpty({ timeout: 6000 });
  expect(await backdrop()).toBe('rgba(0, 0, 0, 0)');
  await page.click('#themeOthers .theme-option >> nth=-1');
  await page.reload();
  await toggle.click();
  expect(await page.locator('#themeMenu .theme-option').count()).toBeLessThanOrEqual(10);
  await expect(page.locator('#themeMenu .theme-option[aria-pressed="true"]')).toBeVisible();
});

test('on a festival day its theme shows by itself, and the next day the chosen one comes back', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-07-06T12:00:00'));
  await page.goto('/');
  await page.click('#themeToggle');
  await page.click('.theme-option[data-theme="summer"]');
  await page.clock.setFixedTime(new Date('2026-07-07T12:00:00'));
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'sanfermin');
  await expect(page.locator('#brandIcon')).toHaveText('🐂');

  await page.clock.setFixedTime(new Date('2026-07-08T09:00:00'));
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'summer');

  await page.clock.setFixedTime(new Date('2026-07-07T18:00:00'));
  await page.reload();
  await page.click('#themeToggle');
  await page.click('.theme-option[data-theme="classic"]');
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'classic');
  await expect(page.locator('body')).not.toHaveClass(/skin/);
});
