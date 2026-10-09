import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    () => localStorage.getItem('oso.consent.v1') ?? localStorage.setItem('oso.consent.v1', 'denied'),
  );
  await page.route(
    /clarity\.ms|c\.bing\.com|googletagmanager\.com|google-analytics\.com|analytics\.google\.com/,
    (route) => route.fulfill({ status: 200, body: '' }),
  );
});

async function expectNoSeriousViolations(page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(serious).toEqual([]);
}

test('setup screens have no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expectNoSeriousViolations(page);
  await page.click('#introSkip');
  await expectNoSeriousViolations(page);
  for (let i = 0; i < 3; i++) await page.click('#stepNext');
  await expectNoSeriousViolations(page);
});

test('game board and winner dialog are accessible', async ({ page }) => {
  await page.goto('/');
  await page.click('#introSkip');
  for (let i = 0; i < 3; i++) await page.click('#stepNext');
  await page.click('#startGame');
  const cell = page.locator('.cell').first();
  await expect(cell).toHaveAttribute('aria-label', 'Fila 1, columna 1: vacía');
  await cell.click();
  await expect(cell).toHaveAttribute('aria-label', /Fila 1, columna 1: [OS]/);
  await expect(page.locator('#hint1')).toHaveAttribute('aria-label', /^Pista/);
  await expectNoSeriousViolations(page);
});
