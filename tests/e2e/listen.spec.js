import { test, expect } from '@playwright/test';

const consent = (page, value) =>
  page.addInitScript(
    (v) => localStorage.getItem('oso.consent.v1') ?? localStorage.setItem('oso.consent.v1', v),
    value,
  );

test.beforeEach(async ({ page }, testInfo) => {
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
const events = (page) =>
  page.evaluate(() => window.dataLayer.filter((e) => e[0] === 'event').map((e) => [e[1], e[2]]));

async function start(page) {
  await page.goto('/');
  await page.click('#introSkip');
  for (let i = 0; i < 3; i++) await page.click('#stepNext');
  await page.click('#startGame');
}

async function finishGame(page) {
  for (let n = 0; n < 70 && !(await overlay(page).isVisible()); n++) {
    const empty = await page.locator('.cell').evaluateAll((cs) => cs.findIndex((c) => !c.textContent.trim()));
    if (empty < 0) break;
    const p = (await page.locator('.player-panel.active').getAttribute('id')) === 'side1' ? 0 : 1;
    await page.click(`.letter[data-player="${p}"][data-letter="O"]`, { force: true });
    await page.locator('.cell').nth(empty).click({ force: true });
  }
  await expect(overlay(page)).toBeVisible();
}

test('the privacy policy is linked from the footer and the cookie banner', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#consentBanner')).toBeVisible();
  await expect(page.locator('#consentText a')).toHaveAttribute('href', '/privacidad');
  await page.click('#consentText a');
  await expect(page).toHaveURL(/\/privacidad$/);
  await page.goBack();
  await page.click('#consentDeny');
  await page.click('#privacyLink');
  await expect(page).toHaveURL(/\/privacidad$/);
  await expect(page.locator('h1')).toHaveText('Política de privacidad');
  await expect(page.locator('main')).toContainText('el equipo de juegaoso.com');
  await expect(page.locator('a[href="mailto:hola@juegaoso.com"]').first()).toBeVisible();
  await page.click('.legal-back');
  await expect(page.locator('#introStart')).toBeVisible();
});

test('with analytics accepted, games send anonymous start, end and abandon events', async ({ page }) => {
  await consent(page, 'granted');
  await start(page);
  await finishGame(page);
  const sent = await events(page);
  expect(sent.map(([name]) => name)).toEqual(['game_start', 'game_end']);
  const end = sent[1][1];
  expect(end).toMatchObject({
    board_size: '5x5',
    players: 2,
    mode: 'two',
    vs_machine: false,
    end_reason: 'board_full',
    time_available: 120,
    cells_filled: 25,
    cells_total: 25,
  });
  expect(end.app_version).toMatch(/^\d+\.\d+\.\d+$/);
  expect(JSON.stringify(sent)).not.toMatch(/Jugador|🐻|🐼/);

  await page.click('#rematch');
  await page.locator('.cell').first().click({ force: true });
  await page.locator('.menu-btn:visible').first().click();
  await page.click('#newGame');
  const names = (await events(page)).map(([name]) => name);
  expect(names.slice(2)).toEqual(['game_start', 'game_abandon']);
});

test('with analytics rejected, no game events are sent', async ({ page }) => {
  await consent(page, 'denied');
  await start(page);
  await finishGame(page);
  expect(await events(page)).toEqual([]);
});

test('the 👍/👎 question shows after the first game, below the actions, and thanks in a modal', async ({
  page,
}) => {
  await consent(page, 'granted');
  await start(page);
  await finishGame(page);
  const ask = page.locator('#feedbackAsk');
  await expect(ask).toBeVisible();
  await expect(page.locator('#rematch')).toBeFocused();
  const [askTop, actionsBottom] = await page.evaluate(() => [
    document.querySelector('#feedbackAsk').getBoundingClientRect().top,
    document.querySelector('.winner-actions').getBoundingClientRect().bottom,
  ]);
  expect(askTop).toBeGreaterThanOrEqual(actionsBottom);

  await page.click('#feedbackUp');
  const dialog = page.locator('#thanksDialog');
  await expect(dialog).toBeVisible();
  await expect(ask).toBeHidden();
  await expect(page.locator('#thanksTitle')).toHaveText('¡Gracias!');
  await expect(page.locator('#feedbackMore')).toHaveAttribute(
    'href',
    'mailto:hola@juegaoso.com?subject=Opini%C3%B3n%20sobre%20OSO',
  );
  const feedback = (await events(page)).filter(([name]) => name === 'feedback');
  expect(feedback).toHaveLength(1);
  expect(feedback[0][1]).toMatchObject({ rating: 'up', moment: 'first_game', board_size: '5x5' });
  await page.click('#thanksClose');
  await expect(dialog).toBeHidden();
  await expect(page.locator('#rematch')).toBeFocused();

  for (let game = 2; game <= 4; game++) {
    await page.click('#rematch');
    await finishGame(page);
    await expect(ask, 'answered: not again in this version').toBeHidden();
  }
});

test('the thanks modal closes with Esc', async ({ page }) => {
  await consent(page, 'denied');
  await start(page);
  await finishGame(page);
  await page.click('#feedbackDown');
  await expect(page.locator('#thanksDialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#thanksDialog')).toBeHidden();
  await expect(page.locator('#rematch')).toBeFocused();
  expect(await events(page)).toEqual([]);
});

test('«💡 Ideas» in the ☰ menu opens an email with the subject ready', async ({ page }) => {
  await consent(page, 'denied');
  await start(page);
  await page.locator('.menu-btn:visible').first().click();
  const ideas = page.locator('#ideasMenu');
  await expect(ideas).toBeVisible();
  await expect(ideas).toHaveText('💡 Ideas y opiniones');
  await expect(ideas).toHaveAttribute('href', 'mailto:hola@juegaoso.com?subject=Ideas%20para%20OSO');
  const [menuWidth, linkWidth] = await page.evaluate(() => [
    document.querySelector('#soundMenu').getBoundingClientRect().width,
    document.querySelector('#ideasMenu').getBoundingClientRect().width,
  ]);
  expect(linkWidth).toBeCloseTo(menuWidth, 0);
  await page.locator('#soundMenu').focus();
  await page.keyboard.press('Tab');
  await expect(ideas).toBeFocused();
});
