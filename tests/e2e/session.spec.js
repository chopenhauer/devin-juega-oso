import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  await page.route(/clarity\.ms|c\.bing\.com/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );
  testInfo.errors = [];
  page.on('pageerror', (e) => testInfo.errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && testInfo.errors.push(m.text()));
});

// eslint-disable-next-line no-empty-pattern
test.afterEach(async ({}, testInfo) => {
  expect(testInfo.errors, 'no JS or CSP errors').toEqual([]);
});

const step = (page) => page.locator('.setup').first().getAttribute('data-step');
const overlay = (page) => page.locator('#winnerOverlay');

async function play(page, moves) {
  for (const [i, letter] of moves) {
    const p = (await page.locator('.player-panel.active').getAttribute('id')) === 'side1' ? 0 : 1;
    await page.click(`.letter[data-player="${p}"][data-letter="${letter}"]`, { force: true });
    await page.locator('.cell').nth(i).click({ force: true });
  }
}

// Fills every empty cell with O; no new OSO can appear, so the score is settled.
async function finishGame(page) {
  for (let n = 0; n < 70 && !(await overlay(page).isVisible()); n++) {
    const empty = await page.locator('.cell').evaluateAll((cs) => cs.findIndex((c) => !c.textContent.trim()));
    if (empty < 0) break;
    await play(page, [[empty, 'O']]);
  }
  await expect(overlay(page)).toBeVisible();
}

test('the session leaderboard adds up games between the same players', async ({ page }) => {
  await page.goto('/');
  await page.click('#introSkip');
  for (let i = 0; i < 3; i++) await page.click('#stepNext');
  await page.click('#startGame');

  await play(page, [
    [0, 'O'],
    [1, 'S'],
    [2, 'O'],
  ]);
  await finishGame(page);
  await expect(page.locator('#winnerTitle')).toHaveText('¡Gana Jugador 1!');
  await expect(page.locator('#sessionBoard')).toBeHidden();
  await expect(page.locator('#rematch')).toBeFocused();
  await expect(page.locator('#otherBoard')).toBeVisible();

  await page.click('#rematch');
  await finishGame(page);
  await expect(page.locator('#sessionBoard')).toBeVisible();
  await expect(page.locator('#sessionMeta')).toHaveText('2 partidas seguidas · 1 empate');
  const first = page.locator('#sessionRows tr').first();
  await expect(first).toHaveClass(/leader/);
  await expect(first.locator('th')).toContainText('Jugador 1');
  await expect(first.locator('td')).toHaveText(['1', '1']);

  await page.click('#otherBoard');
  expect(await step(page)).toBe('board');
  await page.selectOption('#sizeSelect', '4');
  await page.click('#startGame');
  await expect(page.locator('.cell')).toHaveCount(16);
  await finishGame(page);
  await expect(page.locator('#sessionMeta')).toHaveText('3 partidas seguidas · 2 empates');

  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('oso.session.v1')).games.length);
  expect(saved).toBe(3);

  await page.click('#stepNext');
  await page.fill('#nickname1', 'Julia');
  await page.click('#stepNext');
  await page.click('#stepNext');
  await page.click('#startGame');
  await finishGame(page);
  await expect(page.locator('#sessionBoard')).toBeHidden();

  await page.click('#changePlayers');
  expect(await step(page)).toBe('players');
});
