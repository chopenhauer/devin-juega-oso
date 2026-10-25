import { test, expect } from '@playwright/test';

// Monday 26-10-2026 in Madrid: reto n.º 299 (day of the year), 5×5 against the machine in Fácil (public/js/daily.js).
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

async function play(page) {
  await page.goto('/reto');
  await page.click('#dailyPlay');
  await expect(page.locator('#gameScreen')).toBeVisible();
}

const letters = (page) =>
  page.locator('.cell').evaluateAll((cs) => cs.map((c) => c.textContent.trim()).join(','));

test('the usual landing links to /reto discreetly, and /reto is the reto’s own landing', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#dailyWelcome')).toHaveText('🗓️ Reto del día n.º 299 →');
  await expect(page.locator('#dailyToggle')).toBeVisible();
  const [skip, line] = await Promise.all(
    ['#introSkip', '#dailyWelcome'].map((s) => page.locator(s).boundingBox()),
  );
  expect(line.y).toBeGreaterThan(skip.y + skip.height);
  await page.click('#dailyWelcome');
  await expect(page).toHaveURL(/\/reto$/);
  await expect(page.locator('#setupScreen')).toHaveAttribute('data-step', 'daily');
  await expect(page.locator('#dailyToggle')).toHaveText('🏠');
  await expect(page.locator('#dailyToggle')).toHaveAttribute('href', '/');
  await expect(page.locator('#dailyToggle')).toHaveAttribute('aria-label', 'Ir a OSO');
  await expect(page.locator('#helpToggle')).toBeHidden();
  await expect(page.locator('#challengeNote')).toBeHidden();
  await expect(page.locator('#dailyTitle')).toHaveText('🗓️ Reto del día n.º 299');
  await expect(page.locator('#dailyDate')).toHaveText('lunes, 26 de octubre');
  await expect(page.locator('#dailyLead')).toContainText(
    '5×5 contra la máquina en fácil, con 4 letras ya puestas',
  );
  await expect(page.locator('#dailyBoard span')).toHaveCount(25);
  const preview = await page
    .locator('#dailyBoard span')
    .evaluateAll((cs) => cs.map((c) => c.textContent).join(','));
  await expect(page.locator('#dailyPlay')).toHaveText('Jugar el reto →');
  // Without a saved name it is asked right there; the game starts with one tap.
  await expect(page.locator('#dailyWho')).toBeHidden();
  await page.fill('#dailyName', 'Julia');
  await page.click('#dailyPlay');
  await expect(page.locator('#gameScreen')).toBeVisible();
  await expect(page.locator('#name1')).toHaveText('Julia');
  await expect(page.locator('#name2')).toHaveText('Máquina');
  const board = await letters(page);
  expect(board).toBe(preview);
  expect(board.split(',').filter(Boolean)).toHaveLength(4);
  expect(await events(page, 'daily_start')).toEqual([
    expect.objectContaining({ daily_number: 299, daily_first: true, board_size: '5x5', difficulty: 'easy' }),
  ]);

  // Another phone on the same day gets the same letters.
  const other = await page.context().browser().newPage();
  await other.clock.setFixedTime(MONDAY);
  await other.addInitScript(() => localStorage.setItem('oso.consent.v1', 'denied'));
  await play(other);
  expect(await letters(other)).toBe(board);
  await other.close();
});

test('the 🗓️ button next to 🌐 opens /reto from the mode screen', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('oso.prefs.v1', JSON.stringify({ seenIntro: true })));
  await page.goto('/');
  await expect(page.locator('#setupScreen')).toHaveAttribute('data-step', 'mode');
  await expect(page.locator('#dailyMode')).toBeVisible();
  const [online, daily] = await Promise.all(
    ['#onlineToggle', '#dailyToggle'].map((s) => page.locator(s).boundingBox()),
  );
  expect(Math.abs(online.y - daily.y)).toBeLessThan(1);
  expect(daily.x).toBeGreaterThan(online.x + online.width);
  await page.click('#dailyToggle');
  await expect(page).toHaveURL(/\/reto$/);
  await expect(page.locator('#setupScreen')).toHaveAttribute('data-step', 'daily');
});

test('only the first game counts: the result stays on the landing and the share link is /reto', async ({
  page,
}) => {
  test.slow();
  await play(page);
  await finish(page);
  await expect(page.locator('#challengeResult')).toContainText(/Reto (del día )?n\.º 299/);
  // The streak card instead of the session board, and only «Revancha» as a big button.
  await expect(page.locator('#dailyStreakTitle')).toHaveText('🔥 1 día de racha');
  await expect(page.locator('#dailyStreakDays .played')).toHaveCount(1);
  await expect(page.locator('#dailyStreakDays li.today')).toHaveClass(/played/);
  await expect(page.locator('#dailyStreakNext')).toHaveText('Reto n.º 300 en 16 h 0 min');
  await expect(page.locator('#sessionBoard')).toBeHidden();
  await expect(page.locator('#otherBoard')).toBeHidden();
  await expect(page.locator('#changePlayers')).toBeHidden();
  const [end] = await events(page, 'daily_end');
  expect(end).toEqual(expect.objectContaining({ daily_number: 299, daily_first: true, daily_streak: 1 }));
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('oso.daily.v1')));
  expect(saved.last).toBe('2026-10-26');
  const { mine, theirs } = saved.results['2026-10-26'];

  await page.click('#shareResult');
  await expect(page.locator('#shareDialog')).toBeVisible();
  await expect(page.locator('#shareMessage')).toContainText('Reto del día n.º 299 (26 de octubre) de OSO');
  expect(await page.locator('#shareWhatsapp').getAttribute('href')).toContain(
    encodeURIComponent(
      'https://juegaoso.com/reto?utm_source=whatsapp&utm_medium=share&utm_campaign=reto_del_dia',
    ),
  );

  await page.goto('/reto');
  await expect(page.locator('#dailyStatus')).toContainText(`${mine} a ${theirs}`);
  await expect(page.locator('#dailyStatus')).toContainText('el siguiente, en 16 h 0 min');
  await expect(page.locator('#dailyPlay')).toHaveText('Repetir el reto');
  await page.click('#dailyPlay');
  await expect(page.locator('#gameScreen')).toBeVisible();
  await finish(page);
  await expect(page.locator('#challengeResult')).toContainText('Repetición del reto n.º 299');
  expect((await events(page, 'daily_end'))[0]).toEqual(expect.objectContaining({ daily_first: false }));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('oso.daily.v1')).results)).toEqual(
    saved.results,
  );

  await page.goto('/');
  await expect(page.locator('#dailyWelcome')).toHaveText(
    `🗓️ Reto n.º 299: ${mine} a ${theirs} · otro en 16 h 0 min`,
  );
});

test('the end shows the streak and the week from the saved retos, missed days too', async ({ page }) => {
  // Played Thursday 22 and Friday 23, missed Saturday 24, played Sunday 25: today makes 2 in a row.
  await page.addInitScript(() => {
    if (localStorage.getItem('oso.daily.v1')) return;
    const r = { mine: 5, theirs: 3, won: true };
    const results = { '2026-10-22': r, '2026-10-23': r, '2026-10-25': r };
    localStorage.setItem('oso.daily.v1', JSON.stringify({ last: '2026-10-25', streak: 1, results }));
  });
  await play(page);
  await finish(page);
  await expect(page.locator('#dailyStreakTitle')).toHaveText('🔥 2 días seguidos');
  const days = page.locator('#dailyStreakDays li');
  await expect(days.locator('.streak-day')).toHaveText(['M', 'X', 'J', 'V', 'S', 'D', 'L']);
  expect(await days.evaluateAll((li) => li.map((e) => e.classList.contains('played')))).toEqual([
    false,
    false,
    true,
    true,
    false,
    true,
    true,
  ]);
  await expect(days.nth(4)).toContainText('sábado: sin jugar');
  await expect(page.locator('.daily-streak-cta')).toHaveText('¡Vuelve mañana para mantener tu racha!');
});

test('with a saved name /reto says who plays and lets change it', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'oso.prefs.v1',
      JSON.stringify({ seenIntro: true, names: ['Papá'], avatars: ['🦊'] }),
    ),
  );
  await page.goto('/reto');
  await expect(page.locator('#dailyWho')).toHaveText(/🦊\s+Juegas como Papá\s+cambiar/);
  await expect(page.locator('#dailyName')).toBeHidden();
  await page.click('#dailyChange');
  await expect(page.locator('#dailyName')).toBeFocused();
  await expect(page.locator('#dailyName')).toHaveValue('Papá');
  await page.fill('#dailyName', 'Julia');
  await page.press('#dailyName', 'Enter');
  await expect(page.locator('#gameScreen')).toBeVisible();
  await expect(page.locator('#name1')).toHaveText('Julia');
  expect((await letters(page)).split(',').filter(Boolean)).toHaveLength(4);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('oso.prefs.v1')).names)).toEqual([
    'Julia',
  ]);
});
