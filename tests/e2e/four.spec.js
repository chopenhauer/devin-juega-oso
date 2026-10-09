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

const cell = (page, i) => page.locator('#board .cell').nth(i);
const emptyCell = (page) =>
  page.evaluate(() => [...document.querySelectorAll('#board .cell')].findIndex((c) => !c.textContent.trim()));

test('four players take turns 1 → 2 → 3 → 4 and finish with four scores', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', '4 players need a tablet or a computer');
  await page.goto('/');
  await page.click('#introSkip');
  await page.click('#modeFour');
  await page.click('#stepNext');
  for (const [i, name] of ['Ana', 'Bea', 'Carla', 'Dani'].entries())
    await page.fill(`#nickname${i + 1}`, name);
  await page.click('#stepNext');
  await page.click('#viewSame');
  await page.click('#stepNext');
  await expect(page.locator('#sizeSelect option[value="4"]')).toBeDisabled();
  await expect(page.locator('#sizeSelect option[value="5"]')).toBeDisabled();
  await page.selectOption('#sizeSelect', '6');
  await page.click('#startGame');

  const sides = [1, 2, 3, 4].map((n) => page.locator(`#side${n}`));
  for (const [i, name] of ['Ana', 'Bea', 'Carla', 'Dani'].entries()) {
    await expect(sides[i]).toBeVisible();
    await expect(page.locator(`#name${i + 1}`)).toHaveText(name);
    await expect(page.locator(`#timer${i + 1}`)).toHaveText('2:30');
  }
  for (const [turn, index] of [0, 7, 14, 21].entries()) {
    await expect(sides[turn]).toHaveClass(/active/);
    await cell(page, index).click();
  }
  await expect(sides[0]).toHaveClass(/active/);

  await page.click('#last1');
  await expect(page.locator('#message')).toContainText('Última jugada rival');
  await expect(page.locator('#last1')).toHaveClass(/used/);
  await expect(page.locator('#last2')).not.toHaveClass(/used/);

  const overlay = page.locator('#winnerOverlay');
  for (let i = 0; i < 40 && (await overlay.isHidden()); i++) {
    const index = await emptyCell(page);
    if (index < 0) break;
    await cell(page, index).click();
  }
  await expect(overlay).toBeVisible();
  await expect(page.locator('#winnerSub')).toHaveText(/\d+ – \d+ – \d+ – \d+/);
});

test('on a phone the 4 players option stays disabled', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'phone only');
  await page.goto('/');
  await page.click('#introSkip');
  await expect(page.locator('#modeFour')).toBeDisabled();
  await expect(page.locator('#modeFour')).toContainText('En tablet u ordenador');
});

test('with four players, whoever runs out of time is out and the others carry on', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', '4 players need a tablet or a computer');
  await page.clock.install();
  await page.goto('/');
  await page.click('#introSkip');
  await page.click('#modeFour');
  await page.click('#stepNext');
  await page.click('#stepNext');
  await page.click('#stepNext');
  await page.selectOption('#sizeSelect', '6');
  await page.click('#startGame');

  const side = (n) => page.locator(`#side${n}`);
  await page.clock.runFor(151_000);
  await expect(side(1)).toHaveClass(/\bout\b/);
  await expect(side(2)).toHaveClass(/active/);
  await expect(page.locator('#message')).toContainText('se queda sin tiempo');
  await expect(page.locator('#winnerOverlay')).toBeHidden();

  await cell(page, 0).click();
  await expect(side(3)).toHaveClass(/active/);
  await cell(page, 1).click();
  await expect(side(4)).toHaveClass(/active/);
  await cell(page, 2).click();
  await expect(side(2)).toHaveClass(/active/);

  await page.clock.runFor(151_000);
  await expect(side(3)).toHaveClass(/active/);
  await page.clock.runFor(151_000);
  await expect(page.locator('#winnerOverlay')).toBeVisible();
  await expect(page.locator('#winnerSub')).toHaveText(/\d+ – \d+ – \d+ – \d+/);
});
