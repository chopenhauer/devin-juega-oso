import { test, expect } from '@playwright/test';
import { hold } from './helpers.js';

const cell = (page, i) => page.locator('.cell').nth(i);
const boardText = (page) =>
  page.locator('.cell').evaluateAll((cells) => cells.map((c) => c.textContent.trim() || '.').join(''));

async function startGame(page, { solo = false } = {}) {
  if (await page.locator('#introSkip').isVisible()) await page.click('#introSkip');
  if (solo) await page.click('#modeSolo');
  await page.click('#stepNext');
  await page.click('#stepNext');
  if (!solo) await page.click('#stepNext');
  if (!solo) await page.click('#stepNext');
  await page.click('#startGame');
}

// Never send test traffic to Microsoft Clarity or Google Analytics.
const stubClarity = (page) =>
  page.route(
    /clarity\.ms|c\.bing\.com|googletagmanager\.com|google-analytics\.com|analytics\.google\.com/,
    (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    () => localStorage.getItem('oso.consent.v1') ?? localStorage.setItem('oso.consent.v1', 'denied'),
  );
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
  await expect(page.locator('#timer1')).not.toHaveText('1:30', { timeout: 3000 });
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
  // The machine takes its time to think: only play on the human's turn, and stop when it ends.
  for (let tick = 0; tick < 300 && !(await overlay.isVisible()); tick++) {
    const empty = (await boardText(page)).indexOf('.');
    if (empty < 0) break;
    if (await page.locator('#side1').evaluate((e) => e.classList.contains('active')))
      await cell(page, empty).click({ force: true });
    await page.waitForTimeout(200);
  }
  await expect(overlay).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#winnerTitle')).not.toBeEmpty();
  // Points, longest streak and streaks of each player: what breaks a tie on points.
  // They are folded in «Ver detalles» unless the streaks decided the game.
  const rows = page.locator('#endStatsRows tr');
  await expect(page.locator('#endStats')).toBeHidden();
  await page.click('#endDetails summary');
  await expect(page.locator('#endStats')).toBeVisible();
  await expect(rows).toHaveCount(2);
  await expect(page.locator('#endStatsRows th', { hasText: 'Máquina' })).toHaveCount(1);
  await expect(rows.first()).toHaveClass(/leader/);
  for (const row of await rows.all()) await expect(row.locator('td')).toHaveText([/^\d+$/, /^\d+$/, /^\d+$/]);
});

// A 5×5 game in Juntos that ends 4 – 4: Jugador 2 wins with a streak of 2 moves against 1.
const TIED_GAME = [
  [0, 6, 'S'],
  [1, 10, 'O'],
  [0, 3, 'O'],
  [1, 18, 'S'],
  [0, 17, 'O'],
  [1, 7, 'O'],
  [0, 20, 'O'],
  [1, 15, 'O'],
  [0, 5, 'O'],
  [0, 13, 'O'],
  [1, 21, 'O'],
  [0, 8, 'O'],
  [1, 14, 'O'],
  [0, 23, 'S'],
  [1, 4, 'O'],
  [0, 2, 'S'],
  [1, 9, 'S'],
  [1, 19, 'S'],
  [0, 24, 'O'],
  [0, 1, 'S'],
  [1, 16, 'O'],
  [0, 22, 'O'],
  [0, 0, 'O'],
  [1, 12, 'S'],
  [1, 11, 'O'],
];

test('a tie on points is broken by the longest streak', async ({ page }) => {
  await startGame(page);
  for (const [p, i, letter] of TIED_GAME) {
    await page.click(`.letter[data-player="${p}"][data-letter="${letter}"]`);
    await cell(page, i).click({ force: true });
  }
  await expect(page.locator('#winnerOverlay')).toBeVisible();
  await expect(page.locator('#winnerTitle')).toHaveText('¡Gana Jugador 2!');
  await expect(page.locator('#winnerSub')).toHaveText('Desempate: racha más larga');
  await expect(page.locator('#endScore .end-points')).toHaveText('4 – 4');
  await expect(page.locator('#endScore .end-side.winner')).toHaveText('🐼Jugador 2');
  // The streaks decided it, so «Ver detalles» opens by itself.
  await expect(page.locator('#endDetails')).toHaveAttribute('open', '');
  const rows = page.locator('#endStatsRows tr');
  // Whoever wins goes first.
  await expect(page.locator('#endStats thead th')).toHaveText([
    'Jugador',
    'Total puntos',
    'Racha larga',
    'Num rachas',
  ]);
  await expect(rows.nth(0).locator('th')).toContainText('Jugador 2');
  await expect(rows.nth(0)).toHaveClass(/leader/);
  await expect(rows.nth(0).locator('td')).toHaveText(['4', '2', '2']);
  await expect(rows.nth(1).locator('td')).toHaveText(['4', '1', '3']);
  await expect(rows.nth(0).locator('td').first()).toHaveCSS('text-align', 'center');
});

test('loads the Microsoft Clarity tag without CSP errors', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('oso.consent.v1', 'granted'));
  const tag = page.waitForRequest(/www\.clarity\.ms\/tag\/yuj6hlg34s/);
  await page.reload();
  await tag;
  expect(await page.evaluate(() => typeof window.clarity)).toBe('function');
});

test('loads the Google Analytics tag without CSP errors', async ({ page }) => {
  const tag = page.waitForRequest(/www\.googletagmanager\.com\/gtag\/js\?id=G-8ZJ4B238C4/);
  await page.reload();
  await tag;
  expect(await page.evaluate(() => typeof window.gtag)).toBe('function');
  expect(await page.evaluate(() => window.dataLayer.some((e) => e[0] === 'config'))).toBe(true);
});

const clockSeconds = async (page, id) => {
  const [, mm, ss] = (await page.locator(id).textContent()).match(/(\d+):(\d\d)/);
  return +mm * 60 + +ss;
};

test('B05: tienda secreta: mantener pulsado un 💡 gastado lo venden por segundos y luego se usa', async ({
  page,
}) => {
  await startGame(page);
  await page.click('#hint1');
  await expect(page.locator('#hint1 .count')).toHaveText('0');
  await page.locator('#hint1').click({ clickCount: 3 });
  await expect(page.locator('#shopDialog'), 'quick taps do not open it').toBeHidden();
  await hold(page, page.locator('#hint1'), page.locator('#shopDialog'));
  await expect(page.locator('#shopText')).toContainText('otra 💡 pista por 10 segundos');
  const before = await clockSeconds(page, '#timer1');
  await page.click('#shopBuy');
  await expect(page.locator('#shopDialog')).toBeHidden();
  await expect(page.locator('#hint1 .count')).toHaveText('1');
  await expect(page.locator('#message')).toContainText('Comprado');
  expect(before - (await clockSeconds(page, '#timer1'))).toBeGreaterThanOrEqual(10);
  await page.click('#hint1');
  await expect(page.locator('#hint1 .count')).toHaveText('0');
  await expect(page.locator('#message')).toContainText('💡 Prueba');
});

test('B06: tienda secreta: un 🛟 comprado devuelve la partida a OSO para todo el mundo', async ({ page }) => {
  await startGame(page);
  await page.click('#sos1');
  await expect(page.locator('#message')).toContainText('Ahora se puntúa SOS', { timeout: 6000 });
  await hold(page, page.locator('#sos1'), page.locator('#shopDialog'));
  await expect(page.locator('#shopText')).toContainText('otro 🛟 SOS por 30 segundos');
  await expect(page.locator('#shopNote')).toContainText('puntuar OSO');
  await page.click('#shopBuy');
  await expect(page.locator('#sos1 .count')).toHaveText('1');
  await expect(page.locator('#sos2 .count')).toHaveText('0');
  await page.click('#sos1');
  const flash = page.locator('#modeFlash');
  await expect(flash).toBeVisible();
  await expect(flash).toHaveClass(/\boso\b/);
  await expect(flash.locator('.sos-hero')).toBeHidden();
  await expect(flash.locator('.mode-flash-brand .brand')).toHaveText('OSO');
  await expect(flash.locator('.mode-flash-title')).toHaveText('¡Ahora es OSO!');
  const [flashBg, pageBg] = await page.evaluate(() =>
    [document.getElementById('modeFlash'), document.body].map((e) => getComputedStyle(e).backgroundImage),
  );
  expect(flashBg).toBe(pageBg);
  await expect(page.locator('#message')).toContainText('Ahora se puntúa OSO', { timeout: 6000 });
  await expect(page.locator('.score-label').first()).toHaveText('puntos OSO');
  await expect(page.locator('body')).not.toHaveClass(/sea-theme/);
  await expect(page.locator('#sos1 .count')).toHaveText('0');
});

test('B07: tienda secreta: «Ahora no» no compra nada y el extra sigue gastado', async ({ page }) => {
  await startGame(page);
  await page.click('#hint1');
  await hold(page, page.locator('#hint1'), page.locator('#shopDialog'));
  await page.click('#shopDialog button.secondary');
  await expect(page.locator('#shopDialog')).toBeHidden();
  await expect(page.locator('#hint1 .count')).toHaveText('0');
  await expect(page.locator('#hint1')).toHaveClass(/used/);
});

test('B08: tienda secreta: un 🔄 comprado espera a que lo pulses y luego elijas la letra', async ({
  page,
}) => {
  await startGame(page);
  await cell(page, 0).click();
  await cell(page, 1).click();
  await page.click('#swap1');
  await cell(page, 0).click();
  await expect(page.locator('#swap1 .count')).toHaveText('0');
  await cell(page, 2).click();
  await hold(page, page.locator('#swap1'), page.locator('#shopDialog'));
  await expect(page.locator('#shopText')).toContainText('otro 🔄 cambio de letra por 10 segundos');
  const before = await boardText(page);
  await page.click('#shopBuy');
  await expect(page.locator('#swap1 .count')).toHaveText('1');
  await expect(page.locator('#swap1')).not.toHaveClass(/mode/);
  expect(await boardText(page)).toBe(before);
  await page.click('#swap1');
  await expect(page.locator('#swap1')).toHaveClass(/mode/);
  await cell(page, 1).click();
  await expect(page.locator('#swap1 .count')).toHaveText('0');
  expect(await boardText(page)).not.toBe(before);
});

test('with little time on turn the background turns red and beats (T4.3)', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await startGame(page);
  const tension = page.locator('.tension');
  await expect(tension).not.toHaveClass(/\bon\b/);
  await page.clock.runFor(75_000);
  await expect(page.locator('#timer1')).toHaveText('0:15');
  await expect(tension).toHaveClass(/\bon\b/);
  const level = await tension.evaluate((e) => Number(e.style.getPropertyValue('--tension')));
  expect(level).toBeCloseTo(0.25, 1);
  expect(await tension.evaluate((e) => getComputedStyle(e).animationName)).toBe('heartbeat');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await tension.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  expect(Number(await tension.evaluate((e) => getComputedStyle(e).opacity))).toBeGreaterThan(0);
});

const watchFlash = (page) =>
  page.evaluate(() => {
    const f = document.getElementById('modeFlash');
    window.flashLog = [];
    new MutationObserver(() =>
      window.flashLog.push([f.classList.contains('hidden'), performance.now()]),
    ).observe(f, { attributes: true, attributeFilter: ['class'] });
  });

test('SOS: a full-screen «S🛟S» intro stops the game for 2-3 s, with no button', async ({ page }) => {
  await startGame(page);
  await watchFlash(page);
  await page.click('#sos1', { force: true });
  const flash = page.locator('#modeFlash');
  await expect(flash).toBeVisible();
  await expect(page.locator('.sos-hero')).toHaveText('S🛟S');
  await expect(flash).not.toHaveClass(/\boso\b/);
  await expect(flash).toHaveAttribute('role', 'alert');
  await expect(flash.locator('button')).toHaveCount(0);
  const box = await flash.boundingBox();
  const view = page.viewportSize();
  expect(box.x).toBeLessThanOrEqual(1);
  expect(box.y).toBeLessThanOrEqual(1);
  expect(box.width).toBeGreaterThanOrEqual(view.width - 20);
  expect(box.height).toBeGreaterThanOrEqual(view.height - 1);
  const covered = await page.evaluate(() => {
    const r = document.getElementById('board').getBoundingClientRect();
    return document
      .getElementById('modeFlash')
      .contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
  });
  expect(covered).toBe(true);
  await expect(flash).toBeHidden({ timeout: 4000 });
  const [[, shown], [, hidden]] = await page.evaluate(() => window.flashLog);
  expect(hidden - shown).toBeGreaterThanOrEqual(2000);
  expect(hidden - shown).toBeLessThanOrEqual(3000);
  await expect(page.locator('#message')).toContainText('Ahora se puntúa SOS', { timeout: 4000 });
});

test('SOS intro with «reduce motion»: same screen, nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await startGame(page);
  await page.click('#sos1', { force: true });
  await expect(page.locator('#modeFlash')).toBeVisible();
  const moving = await page.evaluate(() => {
    const f = document.getElementById('modeFlash');
    return document.getAnimations().filter((a) => f.contains(a.effect.target)).length;
  });
  expect(moving).toBe(0);
});
