import { test, expect } from '@playwright/test';

import { hold } from './helpers.js';

const holdTheme = (page) => hold(page, page.locator('#themeToggle'), page.locator('#eggParty p'));

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

const seed = (page, values) =>
  page.addInitScript((v) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    for (const [k, value] of Object.entries(v))
      localStorage.setItem(k, typeof value === 'string' ? value : JSON.stringify(value));
  }, values);
const overlay = (page) => page.locator('#winnerOverlay');
const events = (page) =>
  page.evaluate(() => window.dataLayer.filter((e) => e[0] === 'event').map((e) => [e[1], e[2]]));
const told = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('oso.secretos.v1')));

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

test('after the 2nd game the end screen has a 🎁 that tells a secret, once a day', async ({ page }) => {
  test.slow(); // plays four whole games
  await seed(page, { 'oso.consent.v1': 'denied' });
  await page.goto('/');
  await expect(page.locator('#secretToast')).toBeHidden();
  await page.click('#introSkip');
  for (let i = 0; i < 4; i++) await page.click('#stepNext');
  await page.click('#startGame');
  await finishGame(page);
  await expect(page.locator('#secretToast')).toBeHidden();

  await page.click('#rematch');
  await finishGame(page);
  const gift = page.locator('#secretToast');
  await expect(gift).toContainText('🎁 ¡Tienes un premio!');
  await expect(page.locator('#feedbackAsk'), 'the secret goes first').toBeHidden();
  await gift.getByRole('button', { name: 'Ábrelo' }).click();
  const dialog = page.locator('#secretDialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#secretTitle')).toHaveText('Déjame que te cuente un secreto…');
  await expect(page.locator('#secretHow')).toContainText('mantén pulsado el 🎨 durante 3 segundos');
  await expect(page.locator('#secretKnown')).toBeHidden();
  await page.getByRole('button', { name: 'Llévame al 🎨' }).click();
  await expect(dialog).toBeHidden();
  await expect(gift).toBeHidden();
  // Takes you to where it is used: the first screens, with the 🎨 shining.
  await expect(overlay(page)).toBeHidden();
  await expect(page.locator('#setupScreen')).toHaveAttribute('data-step', 'mode');
  await expect(page.locator('#themeToggle')).toBeFocused();
  await expect(page.locator('#themeToggle')).toHaveClass(/\bspotlight\b/);
  expect(await told(page)).toMatchObject({ played: 2, told: ['temas'] });

  for (let i = 0; i < 4; i++) await page.click('#stepNext');
  await page.click('#startGame');
  for (let game = 3; game <= 4; game++) {
    if (game > 3) await page.click('#rematch');
    await finishGame(page);
    await expect(gift, 'one a day at most').toBeHidden();
  }
});

test('coming back with games already played, the 🎁 waits on the first screen', async ({ page }) => {
  await seed(page, { 'oso.consent.v1': 'granted', 'oso.feedback.v1': { games: 5, lastAsk: 1 } });
  await page.goto('/');
  const gift = page.locator('#secretToast');
  await expect(gift, 'counts the games played before secrets existed').toBeVisible();
  // Same place as the online news: halfway between the top of the screen and the card.
  await expect
    .poll(async () => {
      const [toast, panel] = await Promise.all([gift.boundingBox(), page.locator('.panel').boundingBox()]);
      return Math.abs(toast.y + toast.height / 2 - panel.y / 2);
    })
    .toBeLessThan(2);
  await gift.getByRole('button', { name: 'Ábrelo' }).click();
  await expect(page.locator('#secretDialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#themeToggle')).toBeFocused();
  await expect(gift).toBeHidden();
  expect(await told(page)).toMatchObject({ played: 5, told: ['temas'] });

  await holdTheme(page);
  await expect(page.locator('#eggParty')).toContainText('¡Tienes más temas disponibles!');
  const sent = (await events(page)).filter(([name]) => name.startsWith('secret_'));
  expect(sent).toEqual([
    ['secret_shown', expect.objectContaining({ secret: 'temas', place: 'start' })],
    ['secret_found', expect.objectContaining({ secret: 'temas', told: true })],
  ]);

  await page.reload();
  await expect(page.locator('#brandIcon').or(page.locator('.mode-brand')).first()).toBeVisible();
  await expect(gift, 'already told').toBeHidden();
});

test('the 🎨 secret re-arms the egg, so it shows again without reloading', async ({ page }) => {
  await seed(page, { 'oso.consent.v1': 'denied', 'oso.secretos.v1': { played: 1, told: [], day: null } });
  await page.goto('/');
  await holdTheme(page);
  await expect(page.locator('#eggParty')).toContainText('¡Tienes más temas disponibles!');
  await expect(page.locator('#eggParty')).toBeEmpty({ timeout: 6000 });
  await page.keyboard.press('Escape');
  await page.click('#introSkip');
  for (let i = 0; i < 4; i++) await page.click('#stepNext');
  await page.click('#startGame');
  await finishGame(page);
  await page.locator('#secretToast').getByRole('button', { name: 'Ábrelo' }).click();
  await page.getByRole('button', { name: 'Llévame al 🎨' }).click();
  await expect(page.locator('#themeMenu')).toBeHidden();
  await holdTheme(page);
  await expect(page.locator('#eggParty')).toContainText('¡Tienes más temas disponibles!');
});

test('the shop secret takes you to play, with «¡A jugar!» and then the extras shining', async ({ page }) => {
  await seed(page, {
    'oso.consent.v1': 'denied',
    'oso.secretos.v1': { played: 4, told: ['temas'], day: '2000-01-01' },
  });
  await page.goto('/');
  await page.locator('#secretToast').getByRole('button', { name: 'Ábrelo' }).click();
  await expect(page.locator('#secretHow')).toContainText('un extra que ya hayas gastado');
  await page.getByRole('button', { name: '¡A jugar!' }).click();
  await expect(page.locator('#setupScreen')).toHaveAttribute('data-step', 'board');
  const start = page.locator('#startGame');
  await expect(start).toBeFocused();
  await expect(start).toHaveClass(/\bspotlight\b/);
  await start.click();
  await expect(page.locator('#hint1')).toHaveClass(/\bspotlight\b/);
  await expect(page.locator('#swap1')).toHaveClass(/\bspotlight\b/);
  await expect(page.locator('#hint1'), 'only for a few seconds').not.toHaveClass(/\bspotlight\b/, {
    timeout: 5000,
  });
});

test('Esc closes a secret without moving you', async ({ page }) => {
  await seed(page, {
    'oso.consent.v1': 'denied',
    'oso.secretos.v1': { played: 4, told: ['temas'], day: '2000-01-01' },
  });
  await page.goto('/');
  const step = await page.locator('#setupScreen').getAttribute('data-step');
  await page.locator('#secretToast').getByRole('button', { name: 'Ábrelo' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#secretDialog')).toBeHidden();
  await expect(page.locator('#setupScreen')).toHaveAttribute('data-step', step);
  await expect(page.locator('#startGame')).not.toHaveClass(/\bspotlight\b/);
});
