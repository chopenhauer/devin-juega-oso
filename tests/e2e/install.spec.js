import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.getItem('oso.consent.v1') ?? localStorage.setItem('oso.consent.v1', 'granted');
    // The 👍/👎 question was just asked, so it does not take the end screen.
    localStorage.getItem('oso.feedback.v1') ??
      localStorage.setItem('oso.feedback.v1', JSON.stringify({ games: 1, lastAsk: 1, answered: null }));
    // Both secrets already told: none of them takes the end screen either.
    localStorage.getItem('oso.secretos.v1') ??
      localStorage.setItem(
        'oso.secretos.v1',
        JSON.stringify({ played: 0, told: ['temas', 'tienda'], day: null }),
      );
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

// What Chrome fires when OSO can be installed; prompt() opens its own dialog.
const browserCanInstall = (page, outcome = 'accepted') =>
  page.addInitScript((outcome) => {
    window.addEventListener('load', () => {
      const e = new Event('beforeinstallprompt', { cancelable: true });
      e.prompt = () => (window.__prompted = (window.__prompted ?? 0) + 1);
      e.userChoice = Promise.resolve({ outcome });
      window.dispatchEvent(e);
    });
  }, outcome);

async function finish(page) {
  await page.goto('/?reto=4-easy-0-3');
  await page.click('#stepNext');
  await page.click('#startGame');
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

test('after a game, «Instalar» opens the browser prompt', async ({ page }) => {
  test.slow();
  await browserCanInstall(page);
  await finish(page);
  const offer = page.locator('#installAsk');
  await expect(offer).toBeVisible();
  await expect(offer).toContainText('¿Quieres OSO en tu pantalla de inicio?');
  await page.click('#installYes');
  await expect(offer).toBeHidden();
  expect(await page.evaluate(() => window.__prompted)).toBe(1);
  await expect
    .poll(() => events(page, 'install_prompt'))
    .toEqual([expect.objectContaining({ outcome: 'accepted' })]);
  const offers = await events(page, 'install_offer');
  expect(offers.map((e) => [e.action, e.platform])).toEqual([
    ['shown', 'prompt'],
    ['install', 'prompt'],
  ]);
  expect(offers[0].display_mode).toBe('browser');
});

test('if the browser says it can install after the game, the offer still shows', async ({ page }) => {
  test.slow();
  await finish(page);
  await expect(page.locator('#installAsk')).toBeHidden();
  await page.evaluate(() => {
    const e = new Event('beforeinstallprompt', { cancelable: true });
    e.prompt = () => (window.__prompted = 1);
    e.userChoice = Promise.resolve({ outcome: 'dismissed' });
    window.dispatchEvent(e);
  });
  await expect(page.locator('#installAsk')).toBeVisible();
  await page.click('#installYes');
  await expect
    .poll(() => events(page, 'install_prompt'))
    .toEqual([expect.objectContaining({ outcome: 'dismissed' })]);
});

test('«No, gracias» hides it for good on this device', async ({ page }) => {
  test.slow();
  await browserCanInstall(page);
  await finish(page);
  await page.click('#installNo');
  await expect(page.locator('#installAsk')).toBeHidden();
  await expect(page.locator('#rematch')).toBeFocused();
  expect((await events(page, 'install_offer')).map((e) => e.action)).toEqual(['shown', 'no_thanks']);
  expect(await page.evaluate(() => localStorage.getItem('oso.install.v1'))).toBe('dismissed');
  await finish(page);
  await expect(page.locator('#installAsk')).toBeHidden();
  expect(await page.evaluate(() => window.__prompted)).toBeUndefined();
});

test('it never shows on the welcome screen, nor where the browser cannot install', async ({ page }) => {
  test.slow();
  await page.goto('/');
  await expect(page.locator('#installAsk')).toBeHidden();
  await finish(page);
  await expect(page.locator('#installAsk')).toBeHidden();
  expect(await events(page, 'install_offer')).toEqual([]);
});

test('opened from the home screen, it is not offered and GA4 knows', async ({ page }) => {
  test.slow();
  await browserCanInstall(page);
  await page.addInitScript(() => {
    const real = window.matchMedia.bind(window);
    window.matchMedia = (query) =>
      query === '(display-mode: standalone)' ? { ...real(query), matches: true } : real(query);
  });
  await finish(page);
  await expect(page.locator('#installAsk')).toBeHidden();
  const [end] = await events(page, 'game_end');
  expect(end.display_mode).toBe('standalone');
});

test('on iPhone and iPad it explains the steps', async ({ page }) => {
  test.slow();
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'userAgent', {
      get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15',
    });
  });
  await finish(page);
  await page.click('#installYes');
  const dialog = page.locator('#installIosDialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Añadir a pantalla de inicio');
  const axe = await new AxeBuilder({ page }).include('#installIosDialog').analyze();
  expect(axe.violations).toEqual([]);
  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#installYes')).toBeFocused();
  expect((await events(page, 'install_offer')).map((e) => [e.action, e.platform])).toEqual([
    ['shown', 'ios'],
    ['install', 'ios'],
  ]);
});

test.describe('without connection', () => {
  test.use({ serviceWorkers: 'allow' });

  test('the game opens and can be played offline once visited', async ({ page, context }) => {
    test.slow();
    await page.goto('/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await context.setOffline(true);
    await page.goto('/?reto=4-easy-0-3&utm_source=pwa');
    await page.click('#stepNext');
    await page.click('#startGame');
    await expect(page.locator('#board .cell')).toHaveCount(16);
    await page.click('.letter[data-player="0"][data-letter="O"]', { force: true });
    await page.locator('#board .cell').first().click({ force: true });
    await expect(page.locator('#board .cell').first()).toHaveText('O');
    await context.setOffline(false);
    // Offline, the visit counter and Vercel Analytics cannot be sent: expected.
    test.info().errors = test.info().errors.filter((e) => !e.includes('ERR_INTERNET_DISCONNECTED'));
  });
});
