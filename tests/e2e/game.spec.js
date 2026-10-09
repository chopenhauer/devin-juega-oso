import { test, expect } from '@playwright/test';

const cell = (page, i) => page.locator('.cell').nth(i);
const boardText = (page) =>
  page.locator('.cell').evaluateAll((cells) => cells.map((c) => c.textContent.trim() || '.').join(''));

async function startGame(page, { solo = false } = {}) {
  if (await page.locator('#introSkip').isVisible()) await page.click('#introSkip');
  if (solo) await page.click('#modeSolo');
  await page.click('#stepNext');
  await page.click('#stepNext');
  if (!solo) await page.click('#stepNext');
  await page.click('#startGame');
}

// Never send test traffic to Microsoft Clarity.
const stubClarity = (page) =>
  page.route(/clarity\.ms|c\.bing\.com/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );

test.beforeEach(async ({ page }, testInfo) => {
  await stubClarity(page);
  testInfo.errors = [];
  page.on('pageerror', (e) => testInfo.errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && testInfo.errors.push(m.text()));
  await page.goto('/');
});

// Playwright requires a destructured fixtures argument even when unused.
// eslint-disable-next-line no-empty-pattern
test.afterEach(async ({}, testInfo) => {
  expect(testInfo.errors, 'no JS or CSP errors').toEqual([]);
});

test('names fall back to placeholders and the clock runs (B01, T4.1)', async ({ page }) => {
  await expect(page.locator('#nickname1')).toHaveValue('');
  await expect(page.locator('#nickname1')).toHaveAttribute('placeholder', 'Jugador 1');
  await startGame(page);
  await expect(page.locator('#name1')).toHaveText('Jugador 1');
  await expect(page.locator('#name2')).toHaveText('Jugador 2');
  await expect(page.locator('#timer1')).not.toHaveText('2:00', { timeout: 3000 });
  await expect(page.locator('#turnBarTop')).toContainText('Jugador 1');
});

test('help pauses the clock during a game', async ({ page }) => {
  await startGame(page);
  await page.click('#menu1');
  await page.click('#gameHelp');
  const paused = await page.locator('#timer1').textContent();
  await page.waitForTimeout(1500);
  await expect(page.locator('#timer1')).toHaveText(paused);
  await expect(page.locator('#turnBarTop')).toContainText('Pausa');
  await page.keyboard.press('Escape');
  await expect(page.locator('#helpModal')).toBeHidden();
  await expect(page.locator('#timer1')).not.toHaveText(paused, { timeout: 3000 });
});

test('B03: SOS replay forgets a sequence destroyed by a swap; labels and counters update', async ({
  page,
}) => {
  await startGame(page);
  await page.click('.letter[data-player="0"][data-letter="S"]', { force: true });
  await cell(page, 0).click({ force: true });
  await cell(page, 1).click({ force: true });
  await cell(page, 2).click({ force: true });
  await page.click('#swap2', { force: true });
  await cell(page, 0).click({ force: true });
  await expect(page.locator('#swap2 .count')).toHaveText('0');
  await page.click('#sos1', { force: true });
  await expect(page.locator('#message')).toContainText('Marcador recalculado: 0 – 0', { timeout: 6000 });
  expect((await boardText(page)).slice(0, 3)).toBe('OOS');
  await expect(page.locator('.score-label').first()).toHaveText('puntos SOS');
  await expect(page.locator('#sos1 .count')).toHaveText('0');
  await expect(page.locator('body')).toHaveClass(/sea-theme/);
});

test('B04: leaving during the SOS replay does not touch the next game', async ({ page }) => {
  await startGame(page);
  for (let i = 0; i < 6; i++) await cell(page, i).click({ force: true });
  await page.click('#sos1', { force: true });
  await page.waitForTimeout(1200);
  await page.click('#menu1');
  await page.click('#newGame');
  await expect(page.locator('body')).not.toHaveClass(/sea-theme/);
  await startGame(page);
  await page.waitForTimeout(3000);
  expect(await boardText(page)).toBe('.'.repeat(25));
  await expect(page.locator('#score1')).toHaveText('0');
  await expect(page.locator('.score-label').first()).toHaveText('puntos OSO');
});

test('B02: clicks while the machine thinks are ignored; solo panel is upright', async ({ page }) => {
  await startGame(page, { solo: true });
  await expect(page.locator('#name2')).toHaveText('Máquina');
  expect(await page.locator('#side2').evaluate((e) => getComputedStyle(e).transform)).toBe('none');
  await cell(page, 0).click({ force: true });
  await cell(page, 6).click({ force: true });
  await cell(page, 12).click({ force: true });
  expect((await boardText(page)).replaceAll('.', '')).toBe('O');
  await expect(page.locator('#turnBarTop')).toContainText('Jugador 1', { timeout: 3000 });
  expect((await boardText(page)).replaceAll('.', '')).toHaveLength(2);
});

test('a full game against the machine ends with a winner screen', async ({ page }) => {
  test.setTimeout(90_000);
  await startGame(page, { solo: true });
  const overlay = page.locator('#winnerOverlay');
  for (let turn = 0; turn < 40 && !(await overlay.isVisible()); turn++) {
    const empty = (await boardText(page)).indexOf('.');
    if (empty < 0) break;
    await cell(page, empty).click({ force: true });
    await page.waitForTimeout(800);
  }
  await expect(overlay).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#winnerTitle')).not.toBeEmpty();
});

test('loads the Microsoft Clarity tag without CSP errors', async ({ page }) => {
  const tag = page.waitForRequest(/www\.clarity\.ms\/tag\/yuj6hlg34s/);
  await page.reload();
  await tag;
  expect(await page.evaluate(() => typeof window.clarity)).toBe('function');
});
