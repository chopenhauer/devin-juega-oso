import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.getItem('oso.consent.v1') ?? localStorage.setItem('oso.consent.v1', 'denied');
    window.__sounds = [];
    document.addEventListener('oso:sound', (e) => window.__sounds.push(e.detail));
  });
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

const sounds = (page) => page.evaluate(() => window.__sounds);
const overlay = (page) => page.locator('#winnerOverlay');

async function play(page, moves) {
  for (const [i, letter] of moves) {
    const p = (await page.locator('.player-panel.active').getAttribute('id')) === 'side1' ? 0 : 1;
    await page.click(`.letter[data-player="${p}"][data-letter="${letter}"]`, { force: true });
    await page.locator('.cell').nth(i).click({ force: true });
  }
}

async function finishGame(page) {
  for (let n = 0; n < 70 && !(await overlay(page).isVisible()); n++) {
    const empty = await page.locator('.cell').evaluateAll((cs) => cs.findIndex((c) => !c.textContent.trim()));
    if (empty < 0) break;
    await play(page, [[empty, 'O']]);
  }
  await expect(overlay(page)).toBeVisible();
}

async function startTwoPlayers(page) {
  await page.goto('/');
  await page.click('#introSkip');
  for (let i = 0; i < 3; i++) await page.click('#stepNext');
  await page.click('#startGame');
}

test('moves, OSO and the end of the game have their own sound', async ({ page }) => {
  await startTwoPlayers(page);
  await play(page, [
    [0, 'O'],
    [1, 'S'],
    [2, 'O'],
  ]);
  expect(await sounds(page)).toEqual(['place', 'place', 'score']);
  await finishGame(page);
  expect((await sounds(page)).at(-1)).toBe('win');

  await page.click('#rematch');
  await finishGame(page);
  await expect(page.locator('#winnerTitle')).toHaveText('¡Empate!');
  expect((await sounds(page)).at(-1)).toBe('draw');
});

test('the mute button on the intro and in the ☰ menu silences every sound and is remembered', async ({
  page,
}) => {
  await page.goto('/');
  const toggle = page.locator('#soundToggle');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveText('🔇');

  for (let i = 0; i < 6; i++) await page.click('#themeToggle');
  await expect(page.locator('#eggParty')).toContainText('¡Tienes más temas disponibles!');
  expect(await sounds(page)).toEqual([]);

  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');

  await page.click('#introSkip');
  for (let i = 0; i < 3; i++) await page.click('#stepNext');
  await expect(toggle).toBeHidden();
  await page.click('#startGame');
  await play(page, [[0, 'O']]);
  expect(await sounds(page)).toEqual([]);

  await page.locator('.player-panel.active .menu-btn').click();
  const item = page.locator('#soundMenu');
  await expect(item).toHaveText('🔇 Sonido: silenciado');
  await item.click();
  await expect(item).toHaveText('🔊 Sonido: activado');
  await page.click('#closeMenu');
  await expect(page.locator('#menuScrim')).toBeHidden();
  await play(page, [[1, 'S']]);
  expect(await sounds(page)).toEqual(['place']);
  expect(await page.evaluate(() => localStorage.getItem('oso.sound.v1'))).toBe('on');
});

test('each extra has its own sound and SOS sounds a longer alarm', async ({ page }) => {
  await startTwoPlayers(page);
  await play(page, [[0, 'O']]);
  await page.click('#last2', { force: true });
  await page.click('#hint2', { force: true });
  await play(page, [[1, 'S']]);
  await page.click('#swap1', { force: true });
  await page.locator('.cell').nth(0).click({ force: true });
  await page.click('#sos2', { force: true });
  expect(await sounds(page)).toEqual(['place', 'last', 'hint', 'place', 'swap', 'place', 'sos']);
});
