import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
    const empty = await page
      .locator('#board .cell')
      .evaluateAll((cs) => cs.findIndex((c) => !c.textContent.trim()));
    if (empty < 0) break;
    await page.click('.letter[data-player="0"][data-letter="O"]', { force: true });
    await page.locator('#board .cell').nth(empty).click({ force: true });
  }
  await expect(overlay).toBeVisible();
}

test('the last game can be watched again, move by move', async ({ page }) => {
  test.slow();
  await page.goto('/?reto=4-easy-0-3');
  await page.click('#stepNext');
  await page.click('#startGame');
  await finish(page);
  const finalScore = await page.locator('#winnerSub').textContent();
  const filled = await page.locator('#board .cell.filled').count();

  await page.click('#replayOpen');
  const dialog = page.locator('#replayDialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#replayPlay')).toHaveAttribute('aria-label', 'Pausar');
  await expect(page.locator('#replayCaption')).toContainText(`Jugada 1 de ${filled}`);

  await page.click('#replayFirst');
  await expect(page.locator('#replayPlay')).toHaveAttribute('aria-label', 'Reproducir');
  await expect(page.locator('#replayCaption')).toHaveText(
    `Tablero vacío. La partida tuvo ${filled} jugadas.`,
  );
  await expect(page.locator('#replayBoard .cell')).toHaveCount(16);
  await expect(page.locator('#replayBoard .cell.filled')).toHaveCount(0);
  await expect(page.locator('#replayFirst')).toBeDisabled();

  await page.click('#replayNext');
  await expect(page.locator('#replayCaption')).toContainText(`Jugada 1 de ${filled}:`);
  await expect(page.locator('#replayBoard .cell.filled')).toHaveCount(1);
  await page.click('#replayNext');
  await page.click('#replayPrev');
  await expect(page.locator('#replayBoard .cell.filled')).toHaveCount(1);

  await page.click('#replayLast');
  await expect(page.locator('#replayBoard .cell.filled')).toHaveCount(filled);
  await expect(page.locator('#replayNext')).toBeDisabled();
  const [mine, theirs] = finalScore.match(/\d+/g).slice(-2);
  await expect(page.locator('#replayScore')).toContainText(`${mine} –`);
  await expect(page.locator('#replayScore')).toContainText(`– 🤖 ${theirs}`);

  const axe = await new AxeBuilder({ page }).include('#replayDialog').analyze();
  expect(axe.violations).toEqual([]);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('#replayOpen')).toBeFocused();
  await expect
    .poll(() => events(page, 'replay_view'))
    .toEqual([expect.objectContaining({ board_size: '4x4', replay_seen: filled, replay_moves: filled })]);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => /replay/i.test(k)))).toEqual([]);
});

test('playing again from the end starts over and stops at the last move', async ({ page }) => {
  test.slow();
  await page.clock.install();
  await page.goto('/?reto=4-easy-0-3');
  await page.click('#stepNext');
  await page.click('#startGame');
  await page.clock.resume();
  await finish(page);
  const filled = await page.locator('#board .cell.filled').count();
  await page.click('#replayOpen');
  await page.click('#replayLast');
  await page.click('#replayPlay');
  await expect(page.locator('#replayBoard .cell.filled')).toHaveCount(0);
  await page.clock.runFor(900 * (filled + 2));
  await expect(page.locator('#replayBoard .cell.filled')).toHaveCount(filled);
  await expect(page.locator('#replayPlay')).toHaveAttribute('aria-label', 'Reproducir');
});
