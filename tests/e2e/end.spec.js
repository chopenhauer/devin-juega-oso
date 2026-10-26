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

const overlay = (page) => page.locator('#winnerOverlay');

async function play(page, moves) {
  for (const [i, letter] of moves) {
    const p = (await page.locator('.player-panel.active').getAttribute('id')) === 'side1' ? 0 : 1;
    await page.click(`.letter[data-player="${p}"][data-letter="${letter}"]`, { force: true });
    await page.locator('.cell').nth(i).click({ force: true });
  }
}

// One OSO for whoever moves first, then every empty cell gets an O: the game ends 1 – 0.
async function playOneZero(page) {
  await play(page, [
    [0, 'O'],
    [1, 'S'],
    [2, 'O'],
  ]);
  for (let n = 0; n < 70 && !(await overlay(page).isVisible()); n++) {
    const empty = await page.locator('.cell').evaluateAll((cs) => cs.findIndex((c) => !c.textContent.trim()));
    if (empty < 0) break;
    await play(page, [[empty, 'O']]);
  }
  await expect(overlay(page)).toBeVisible();
}

async function startTwo(page) {
  await page.goto('/');
  await page.click('#introSkip');
  for (let i = 0; i < 4; i++) await page.click('#stepNext');
  await page.click('#startGame');
}

test('the end screen tells the result, how the session goes and invites to a rematch', async ({ page }) => {
  test.slow(); // plays two whole games
  await startTwo(page);
  await playOneZero(page);
  // One game: the big score tells it all, no session board yet.
  await expect(page.locator('#sessionBoard')).toBeHidden();
  // Result: each avatar and name next to their own points, in player order, the winner highlighted.
  await expect(page.locator('#winnerTitle')).toHaveText('¡Gana Jugador 1!');
  await expect(page.locator('#endScore .end-side')).toHaveText(['🐻Jugador 1', '🐼Jugador 2']);
  await expect(page.locator('#endScore .end-points')).toHaveText('1 – 0');
  await expect(page.locator('#endScore .end-side.winner')).toHaveText('🐻Jugador 1');
  await expect(page.locator('#endScore .end-points b.winner')).toHaveText('1');
  await expect(page.locator('#winnerSub')).toBeHidden();
  await expect(page.locator('#endPhrase')).toHaveText('😱 ¡Por los pelos!');
  // The year's totals for the OSO wrap: both players are on this device, counted by name.
  const wrap = await page.evaluate(() => JSON.parse(localStorage.getItem('oso.wrap.v1')));
  expect(Object.values(wrap.years)).toEqual([
    expect.objectContaining({
      games: 1,
      days: 1,
      modes: { two: 1 },
      points: 1,
      names: { 'Jugador 1': { games: 1, won: 1 }, 'Jugador 2': { games: 1, won: 0 } },
    }),
  ]);
  // The streaks are folded: they did not decide this game.
  const details = page.locator('#endDetails');
  await expect(details).toBeVisible();
  await expect(details).not.toHaveAttribute('open', '');
  await expect(page.locator('#endStats')).toBeHidden();
  await page.click('#endDetails summary');
  await expect(page.locator('#endStatsRows tr')).toHaveCount(2);
  // «Revancha» is the main button; replay and share are discreet links below.
  const rematch = await page.locator('#rematch').boundingBox();
  const replay = await page.locator('#replayOpen').boundingBox();
  expect(replay.height).toBeLessThan(rematch.height);

  await page.click('#rematch');
  await playOneZero(page);
  const title = await page.locator('#winnerTitle').textContent();
  if (title === '¡Gana Jugador 1!') {
    await expect(page.locator('#endPhrase')).toHaveText('😱 ¡Por los pelos!');
  } else {
    await expect(page.locator('#endPhrase')).toHaveText('🎉 ¡Primera victoria de Jugador 2!');
  }
  // One comment at a time: with a phrase, the session board has no nudge.
  await expect(page.locator('#sessionNudge')).toBeHidden();
  await expect(page.locator('#sessionTitle')).toHaveText('🏆 Marcador de la sesión');
});

test('on a small phone, even with big text, the whole end screen fits one screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await startTwo(page);
  await playOneZero(page);
  await page.click('#rematch');
  await playOneZero(page);
  await expect(page.locator('#sessionBoard')).toBeVisible();
  for (const font of ['', '130%', '150%']) {
    await page.evaluate((f) => (document.documentElement.style.fontSize = f), font);
    await expect
      .poll(
        () =>
          overlay(page).evaluate((el) => {
            const card = el.querySelector('#winnerCard').getBoundingClientRect();
            return el.scrollHeight <= el.clientHeight + 1 && card.left >= 0 && card.right <= innerWidth + 1;
          }),
        `font ${font || '100%'}`,
      )
      .toBe(true);
    const box = await page.locator('#rematch').boundingBox();
    expect(box.y + box.height, `font ${font || '100%'}`).toBeLessThanOrEqual(640);
  }
  // On a big screen nothing is scaled.
  await page.evaluate(() => (document.documentElement.style.fontSize = ''));
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect.poll(() => page.locator('#winnerCard').evaluate((el) => el.style.zoom)).toBe('');
});

test('the background is solid and the celebration stops, or does not move with reduced motion', async ({
  page,
}) => {
  await startTwo(page);
  await playOneZero(page);
  const bg = await overlay(page).evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toContain('gradient');
  expect(bg).not.toContain('rgba');
  const avatar = page.locator('#winnerAvatar');
  await expect(avatar).toHaveCSS('animation-iteration-count', '4');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(avatar).toHaveCSS('animation-name', 'none');
});
