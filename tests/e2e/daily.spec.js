import { test, expect } from '@playwright/test';

// Monday 26-10-2026 in Madrid: reto n.º 3, 5×5 against the machine in Fácil (public/js/daily.js).
const MONDAY = new Date('2026-10-26T10:00:00+01:00');

test.beforeEach(async ({ page }, testInfo) => {
  await page.clock.setFixedTime(MONDAY);
  await page.addInitScript(() => {
    localStorage.getItem('oso.consent.v1') ?? localStorage.setItem('oso.consent.v1', 'granted');
    Object.defineProperty(navigator, 'share', { value: undefined });
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

const events = (page, name) =>
  page.evaluate((n) => window.dataLayer.filter((e) => e[0] === 'event' && e[1] === n).map((e) => e[2]), name);

async function finish(page) {
  const overlay = page.locator('#winnerOverlay');
  for (let n = 0; n < 400 && !(await overlay.isVisible()); n++) {
    if (!(await page.locator('#side1.active').count())) {
      await page.waitForTimeout(100);
      continue;
    }
    const empty = await page.locator('.cell').evaluateAll((cs) => cs.findIndex((c) => !c.textContent.trim()));
    if (empty < 0) break;
    await page.click('.letter[data-player="0"][data-letter="O"]', { force: true });
    await page.locator('.cell').nth(empty).click({ force: true });
  }
  await expect(overlay).toBeVisible();
}

async function start(page) {
  await expect(page.locator('#setupScreen')).toHaveAttribute('data-step', 'players');
  for (let i = 0; i < 6 && !(await page.locator('#startGame').isVisible()); i++)
    await page.click('#stepNext');
  await page.click('#startGame');
}

const letters = (page) =>
  page.locator('.cell').evaluateAll((cs) => cs.map((c) => c.textContent.trim()).join(','));

test('the welcome card opens /reto with today’s game set, the same board for everybody', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('#dailyWelcome');
  await expect(card).toContainText('Reto del día n.º 3');
  await expect(card).toContainText('5×5 contra la máquina en fácil');
  await card.click();
  await expect(page).toHaveURL(/\/reto$/);
  await expect(page.locator('#challengeNote')).toHaveText(
    '🗓️ Reto del día n.º 3 · 5×5 contra la máquina en fácil, con 4 letras ya puestas',
  );
  await expect(page.locator('#modeSolo')).toHaveClass(/selected/);
  await expect(page.locator('#difficultyEasy')).toHaveClass(/selected/);
  await expect(page.locator('#sizeSelect')).toHaveValue('5');
  await start(page);
  const board = await letters(page);
  expect(board.split(',').filter(Boolean)).toHaveLength(4);
  expect(await events(page, 'daily_start')).toEqual([
    expect.objectContaining({ daily_number: 3, daily_first: true, board_size: '5x5', difficulty: 'easy' }),
  ]);

  // Another phone on the same day gets the same letters.
  const other = await page.context().browser().newPage();
  await other.clock.setFixedTime(MONDAY);
  await other.addInitScript(() => localStorage.setItem('oso.consent.v1', 'denied'));
  await other.goto('/reto');
  await start(other);
  expect(await letters(other)).toBe(board);
  await other.close();
});

test('only the first game counts: the result stays on the card and the share link is /reto', async ({
  page,
}) => {
  test.slow();
  await page.goto('/reto');
  await start(page);
  await finish(page);
  await expect(page.locator('#challengeResult')).toContainText(/Reto (del día )?n\.º 3/);
  const [end] = await events(page, 'daily_end');
  expect(end).toEqual(expect.objectContaining({ daily_number: 3, daily_first: true, daily_streak: 1 }));
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('oso.daily.v1')));
  expect(saved.last).toBe('2026-10-26');
  const { mine, theirs } = saved.results['2026-10-26'];

  await page.click('#shareResult');
  await expect(page.locator('#shareDialog')).toBeVisible();
  await expect(page.locator('#shareMessage')).toContainText('Reto del día n.º 3 de OSO');
  expect(await page.locator('#shareWhatsapp').getAttribute('href')).toContain(
    encodeURIComponent(
      'https://juegaoso.com/reto?utm_source=whatsapp&utm_medium=share&utm_campaign=reto_del_dia',
    ),
  );

  await page.goto('/reto');
  await expect(page.locator('#challengeNote')).toContainText(
    `Ya has jugado el reto n.º 3 (${mine} a ${theirs})`,
  );
  await start(page);
  await finish(page);
  await expect(page.locator('#challengeResult')).toContainText('Repetición del reto n.º 3');
  expect((await events(page, 'daily_end'))[0]).toEqual(expect.objectContaining({ daily_first: false }));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('oso.daily.v1')).results)).toEqual(
    saved.results,
  );

  await page.goto('/');
  await expect(page.locator('.daily-card').first()).toHaveClass(/done/);
  await expect(page.locator('.daily-card').first()).toContainText(`${mine} a ${theirs}`);
  await expect(page.locator('.daily-card').first()).toContainText('el siguiente, en 14 h 0 min');
});

test('changing the board or the level leaves the challenge: an ordinary game', async ({ page }) => {
  await page.goto('/reto');
  await page.click('#difficultyHard');
  await expect(page.locator('#challengeNote')).toBeHidden();
  await start(page);
  expect((await letters(page)).split(',').filter(Boolean)).toHaveLength(0);
  expect(await events(page, 'daily_start')).toEqual([]);
});
