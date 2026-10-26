import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    () => localStorage.getItem('oso.consent.v1') ?? localStorage.setItem('oso.consent.v1', 'granted'),
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

test('a challenge link opens the game already set, with its theme and goal', async ({ page }) => {
  test.slow();
  await page.goto('/?reto=4-hard-9-4&tema=halloween&utm_source=whatsapp');
  await expect(page.locator('#setupScreen')).toHaveAttribute('data-step', 'players');
  await expect(page.locator('#challengeNote')).toHaveText(
    '🏆 Reto: gana a la máquina en difícil, 4×4, por 6 puntos o más',
  );
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'halloween');
  await expect(page.locator('#modeSolo')).toHaveClass(/selected/);
  await expect(page.locator('#difficultyHard')).toHaveClass(/selected/);
  await expect(page.locator('#sizeSelect')).toHaveValue('4');
  expect(await events(page, 'challenge_open')).toEqual([
    expect.objectContaining({ board_size: '4x4', difficulty: 'hard' }),
  ]);
  expect(await page.evaluate(() => localStorage.getItem('oso.theme.v1'))).toBeNull();

  await page.click('#difficultyEasy');
  await expect(page.locator('#challengeNote')).toBeHidden();
  await page.click('#difficultyHard');
  await page.click('#stepNext');
  await expect(page.locator('#challengeNote')).toBeVisible();
  await page.click('#startGame');
  await finish(page);
  await expect(page.locator('#challengeResult')).toBeVisible();
  const [end] = await events(page, 'challenge_end');
  expect(end).toEqual(
    expect.objectContaining({ board_size: '4x4', difficulty: 'hard', beaten: expect.any(Boolean) }),
  );
  const wrap = await page.evaluate(
    () => Object.values(JSON.parse(localStorage.getItem('oso.wrap.v1')).years)[0],
  );
  expect(wrap.challenges).toEqual(expect.objectContaining({ opened: 1, played: 1 }));
});

test('sharing a game against the machine sends a challenge link', async ({ page }) => {
  test.slow();
  await page.addInitScript(() => {
    navigator.share = async (data) => {
      window.sharedData = data;
    };
  });
  await page.goto('/?reto=4-extreme-0-3');
  await expect(page.locator('#challengeNote')).toHaveText('🏆 Reto: gana a la máquina en extremo, 4×4');
  await page.click('#stepNext');
  await page.click('#startGame');
  await finish(page);
  const [a, b] = (await page.locator('#endScore .end-points').textContent()).match(/\d+/g).map(Number);
  await page.click('#shareResult');
  await expect.poll(() => page.evaluate(() => window.sharedData?.text)).toContain('Te reto en OSO 🐻: 4×4');
  const text = await page.evaluate(() => window.sharedData.text);
  expect(text).toContain(
    `https://juegaoso.com/?reto=4-extreme-${a}-${b}&utm_source=native&utm_medium=share&utm_campaign=reto`,
  );
});

test('broken challenge links are ignored', async ({ page }) => {
  await page.goto('/?reto=9-pro-1');
  await expect(page.locator('#setupScreen')).not.toHaveAttribute('data-step', 'players');
  await expect(page.locator('#challengeNote')).toBeHidden();
});
