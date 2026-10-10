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

const shares = (page) =>
  page.evaluate(() => window.dataLayer.filter((e) => e[0] === 'event' && e[1] === 'share').map((e) => e[2]));
const noNativeShare = (page) => page.addInitScript(() => delete Navigator.prototype.share);
const dialog = (page) => page.locator('#shareDialog');

async function start(page) {
  await page.goto('/');
  await page.click('#introSkip');
  for (let i = 0; i < 3; i++) await page.click('#stepNext');
  await page.click('#startGame');
}

test('without a native share sheet, 📣 offers WhatsApp, email and copy', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await noNativeShare(page);
  await page.goto('/');
  await page.click('#shareToggle');
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator('#shareMessage')).toHaveText(/^Juega conmigo a OSO 🐻/);
  const wa = new URL(await page.locator('#shareWhatsapp').getAttribute('href'));
  expect(wa.origin).toBe('https://wa.me');
  expect(wa.searchParams.get('text')).toContain('https://juegaoso.com/?utm_source=whatsapp');
  await expect(page.locator('#shareWhatsapp')).toHaveAttribute('target', '_blank');
  const mail = new URL(await page.locator('#shareEmail').getAttribute('href'));
  expect(mail.searchParams.get('body')).toContain('utm_source=email');

  await page.click('#shareCopy');
  await expect(page.locator('#shareStatus')).toHaveText('✅ ¡Enlace copiado!');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'https://juegaoso.com/?utm_source=copy&utm_medium=share&utm_campaign=boca_oreja',
  );
  expect(await shares(page)).toEqual([expect.objectContaining({ channel: 'copy', place: 'start' })]);

  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(page.locator('#shareToggle')).toBeFocused();
});

test('with a native share sheet, 📣 uses it and skips the dialog', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.share = async (data) => {
      window.sharedData = data;
    };
  });
  await page.goto('/');
  await page.click('#shareToggle');
  await expect.poll(() => page.evaluate(() => window.sharedData?.url)).toContain('utm_source=native');
  await expect(dialog(page)).toBeHidden();
  expect(await shares(page)).toEqual([expect.objectContaining({ channel: 'native', place: 'start' })]);
});

test('closing the native share sheet does nothing else', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.share = async () => {
      throw new DOMException('cancelled', 'AbortError');
    };
  });
  await page.goto('/');
  await page.click('#shareToggle');
  await expect(dialog(page)).toBeHidden();
  expect(await shares(page)).toEqual([]);
});

test('the end screen shares the result without names', async ({ page }) => {
  await noNativeShare(page);
  await start(page);
  await expect(page.locator('#shareToggle')).toBeHidden();
  const overlay = page.locator('#winnerOverlay');
  for (let n = 0; n < 70 && !(await overlay.isVisible()); n++) {
    const empty = await page.locator('.cell').evaluateAll((cs) => cs.findIndex((c) => !c.textContent.trim()));
    if (empty < 0) break;
    const p = (await page.locator('.player-panel.active').getAttribute('id')) === 'side1' ? 0 : 1;
    await page.click(`.letter[data-player="${p}"][data-letter="O"]`, { force: true });
    await page.locator('.cell').nth(empty).click({ force: true });
  }
  await expect(overlay).toBeVisible();
  const actions = await page.locator('.winner-actions').boundingBox();
  const btn = await page.locator('#shareResult').boundingBox();
  expect(btn.y + btn.height).toBeLessThanOrEqual(actions.y + actions.height + 1);
  await page.click('#shareResult');
  await expect(page.locator('#shareMessage')).toHaveText(/OSO 🐻.*¿(Te atreves|Juegas conmigo)\?/);
  await expect(page.locator('#shareMessage')).not.toContainText('Jugador');
  await page.click('#shareEmail');
  expect(await shares(page)).toEqual([expect.objectContaining({ channel: 'email', place: 'end' })]);
});

test('the game menu invites someone to play', async ({ page }) => {
  await noNativeShare(page);
  await start(page);
  await page.locator('.menu-btn').first().click();
  await page.click('#shareMenu');
  await expect(page.locator('#sidebar')).not.toHaveClass(/open/);
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator('#shareMessage')).toHaveText(/^Juega conmigo a OSO/);
  await dialog(page).locator('.share-close').click();
  await expect(dialog(page)).toBeHidden();
});

test('the link shows a card with the bear', async ({ page, request }) => {
  await page.goto('/');
  const og = (p) => page.locator(`meta[property="og:${p}"]`).getAttribute('content');
  expect(await og('title')).toBe('OSO · el juego de Julia');
  expect(await og('image')).toBe('https://juegaoso.com/og.png');
  expect(await page.locator('meta[name="description"]').getAttribute('content')).toContain('OSO');
  const img = await request.get('/og.png');
  expect(img.status()).toBe(200);
  const png = await img.body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});
