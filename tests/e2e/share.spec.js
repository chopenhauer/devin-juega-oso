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
  for (let i = 0; i < 4; i++) await page.click('#stepNext');
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
  // The OSO wrap counts it too.
  const wrap = await page.evaluate(() => JSON.parse(localStorage.getItem('oso.wrap.v1')));
  expect(Object.values(wrap.years)).toEqual([expect.objectContaining({ shares: { copy: 1 }, days: 0 })]);

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
  await expect
    .poll(() => page.evaluate(() => window.sharedData?.text))
    .toMatch(/OSO 🐻[\s\S]*\n\nhttps:\/\/juegaoso\.com\/\?utm_source=native/);
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

async function finish(page) {
  const overlay = page.locator('#winnerOverlay');
  for (let n = 0; n < 70 && !(await overlay.isVisible()); n++) {
    const empty = await page.locator('.cell').evaluateAll((cs) => cs.findIndex((c) => !c.textContent.trim()));
    if (empty < 0) break;
    const p = (await page.locator('.player-panel.active').getAttribute('id')) === 'side1' ? 0 : 1;
    await page.click(`.letter[data-player="${p}"][data-letter="O"]`, { force: true });
    await page.locator('.cell').nth(empty).click({ force: true });
  }
  await expect(overlay).toBeVisible();
}

test('the end screen shares the result without names', async ({ page }) => {
  await noNativeShare(page);
  await start(page);
  await expect(page.locator('#shareToggle')).toBeHidden();
  await finish(page);
  const actions = await page.locator('.winner-actions').boundingBox();
  const btn = await page.locator('#shareResult').boundingBox();
  expect(btn.y + btn.height).toBeLessThanOrEqual(actions.y + actions.height + 1);
  await page.click('#shareResult');
  // The text shows once the scoreboard picture is ready, so wait for it instead of reading it at once.
  await expect(page.locator('#shareMessage')).toHaveText(/OSO 🐻.*!\n\n(Te atreves|Juegas conmigo)\?$/);
  const wa = new URL(await page.locator('#shareWhatsapp').getAttribute('href')).searchParams.get('text');
  expect(wa).toMatch(/\?\n\nhttps:\/\/juegaoso\.com\//);
  const lines = await page
    .locator('#shareMessage')
    .evaluate((e) => e.getClientRects().length && e.offsetHeight);
  expect(lines).toBeGreaterThan(40);
  await expect(page.locator('#shareMessage')).not.toContainText('Jugador');
  await page.click('#shareEmail');
  expect(await shares(page)).toEqual([expect.objectContaining({ channel: 'email', place: 'end' })]);
});

test('«Compartir» and «Replay» replace the long labels when they do not fit on one line', async ({
  page,
}) => {
  await start(page);
  await finish(page);
  const buttons = [
    ['#shareResult', '📣 Compartir resultado', '📣 Compartir', 'Compartir resultado'],
    ['#replayOpen', '▶️ Ver la partida', '▶️ Replay', 'Ver la partida (replay)'],
  ];
  for (const [sel, , , label] of buttons) {
    await expect(page.locator(sel)).toHaveAttribute('aria-label', label);
  }
  const fit = (sel, long) =>
    page.locator(sel).evaluate((el, longText) => {
      const lines = (node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return new Set([...range.getClientRects()].map((r) => Math.round(r.bottom))).size;
      };
      // Same button, same width, with the long text: does it wrap?
      const probe = el.cloneNode();
      probe.removeAttribute('id');
      probe.textContent = longText;
      Object.assign(probe.style, {
        position: 'absolute',
        // The layout width, unrounded: offsetWidth rounds 174.43 down to 174 and the label wraps.
        width: getComputedStyle(el).width,
        visibility: 'hidden',
      });
      el.after(probe);
      const longFits = lines(probe) === 1;
      probe.remove();
      return { label: el.textContent.trim(), lines: lines(el), longFits };
    }, long);
  const seen = {};
  for (const width of [270, 360, 412, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [sel, long, short] of buttons) {
      await expect
        .poll(async () => {
          const { label, lines, longFits } = await fit(sel, long);
          return lines === 1 && label === (longFits ? long : short);
        }, `${sel} at ${width}px`)
        .toBe(true);
      seen[`${sel}@${width}`] = (await fit(sel, long)).label;
    }
  }
  expect(seen['#shareResult@360']).toBe('📣 Compartir');
  expect(seen['#replayOpen@1280']).toBe('▶️ Ver la partida');
  // With a huge system font (Android accessibility) the end screen can only shrink to half size,
  // so «Ver la partida» wraps too…
  await page.setViewportSize({ width: 360, height: 900 });
  await page.evaluate(() => (document.documentElement.style.fontSize = '400%'));
  // …and even «Compartir» does not fit: both put the emoji above and the text below, on one line.
  const heights = [];
  for (const [sel, , short] of buttons) {
    const btn = page.locator(sel);
    await expect(btn).toHaveText(short);
    await expect(btn.locator('.btn-emoji')).toHaveText(short.split(' ')[0]);
    const box = await btn.evaluate((el) => {
      const text = el.lastChild;
      const range = document.createRange();
      range.setStart(text, 1);
      range.setEnd(text, text.length);
      const rects = [...range.getClientRects()];
      return {
        emojiBottom: el.querySelector('.btn-emoji').getBoundingClientRect().bottom,
        textTop: Math.min(...rects.map((r) => r.top)),
        textLines: new Set(rects.map((r) => Math.round(r.bottom))).size,
        height: el.offsetHeight,
      };
    });
    expect(box.textLines, sel).toBe(1);
    expect(box.textTop, sel).toBeGreaterThanOrEqual(box.emojiBottom - 1);
    heights.push(box.height);
  }
  expect(heights[0]).toBe(heights[1]);
  await page.evaluate(() => (document.documentElement.style.fontSize = ''));
  await expect(page.locator('.winner-actions .btn-emoji')).toHaveCount(0);
  await expect(page.locator('#shareResult')).toHaveText('📣 Compartir');
  await expect(page.locator('#replayOpen')).toHaveText('▶️ Ver la partida');
  // Without «Ver la partida» (online) «Compartir» takes the whole row and the long text fits.
  await page.locator('#replayOpen').evaluate((el) => el.classList.add('hidden'));
  await expect(page.locator('#shareResult')).toHaveText('📣 Compartir resultado');
});

test('the end screen leaves room above «Compartir resultado» and has «Inicio» top right', async ({
  page,
}) => {
  await start(page);
  await finish(page);
  const above = await page.locator('#changePlayers').boundingBox();
  const shareBtn = await page.locator('#shareResult').boundingBox();
  const rematch = await page.locator('#rematch').boundingBox();
  const row = await page.locator('#otherBoard').boundingBox();
  const gap = (top, bottom) => bottom.y - (top.y + top.height);
  expect(gap(above, shareBtn)).toBeGreaterThanOrEqual(gap(rematch, row) + 12);

  const home = page.locator('#winnerHome');
  await expect(home).toHaveText('🏠 Inicio');
  const box = await home.boundingBox();
  const width = page.viewportSize().width;
  expect(box.y).toBeLessThan(40);
  expect(box.x + box.width).toBeGreaterThan(width - 40);
  await home.click();
  await expect(page.locator('#winnerOverlay')).toBeHidden();
  await expect(page.locator('#gameScreen')).toBeHidden();
  await expect(page.locator('.step[data-step="mode"]')).not.toHaveClass(/inactive/);
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
  expect(await og('title')).toBe('OSO · El juego de la O y la S');
  expect(await og('image')).toBe('https://juegaoso.com/og.png');
  expect(await page.locator('meta[name="description"]').getAttribute('content')).toContain('OSO');
  const img = await request.get('/og.png');
  expect(img.status()).toBe(200);
  const png = await img.body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});

test('«Revancha» tells the board size', async ({ page }) => {
  await start(page);
  await finish(page);
  const size = await page
    .locator('.cell')
    .count()
    .then((n) => Math.sqrt(n));
  await expect(page.locator('#rematch .btn-sub')).toHaveText(`mismo tablero (${size}×${size})`);
  await expect(page.locator('#rematch')).toHaveAttribute(
    'aria-label',
    `Revancha, mismo tablero de ${size} por ${size}`,
  );
});

test('the native share of the result attaches a picture of the session scoreboard', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.canShare = (data) => !!data;
    navigator.share = async (data) => {
      const file = data.files?.[0];
      const bitmap = file && (await createImageBitmap(file));
      window.sharedData = { text: data.text, name: file?.name, type: file?.type, width: bitmap?.width };
    };
  });
  await start(page);
  await finish(page);
  await page.click('#shareResult');
  await expect.poll(() => page.evaluate(() => window.sharedData?.type)).toBe('image/png');
  const shared = await page.evaluate(() => window.sharedData);
  expect(shared).toMatchObject({ name: 'oso-marcador.png', width: 1080 });
  expect(shared.text).toMatch(/OSO 🐻[\s\S]*\n\nhttps:\/\/juegaoso\.com\/\?utm_source=native/);
  expect(await shares(page)).toEqual([expect.objectContaining({ channel: 'native', place: 'end' })]);
});

test('without a native share sheet, the result dialog offers the picture to download', async ({ page }) => {
  await noNativeShare(page);
  await page.goto('/');
  await page.click('#shareToggle');
  await expect(page.locator('#shareImage')).toBeHidden();
  await page.keyboard.press('Escape');
  await page.click('#introSkip');
  for (let i = 0; i < 4; i++) await page.click('#stepNext');
  await page.click('#startGame');
  await finish(page);
  await page.click('#shareResult');
  const image = page.locator('#shareImage');
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('download', 'oso-marcador.png');
  await expect(image).toHaveAttribute('href', /^blob:/);
  const download = page.waitForEvent('download');
  await image.click();
  expect((await download).suggestedFilename()).toBe('oso-marcador.png');
  expect(await shares(page)).toEqual([expect.objectContaining({ channel: 'image', place: 'end' })]);
});
