import { test, expect } from '@playwright/test';

// Two independent browsers play through scripts/serve.js, which serves /api/sala from memory.
async function player(browser, errors) {
  const context = await browser.newContext();
  await context.addInitScript(
    () => localStorage.getItem('oso.consent.v1') ?? localStorage.setItem('oso.consent.v1', 'denied'),
  );
  await context.route(
    /clarity\.ms|c\.bing\.com|googletagmanager\.com|google-analytics\.com|analytics\.google\.com/,
    (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/status of 404/.test(m.text()) && errors.push(m.text()));
  return page;
}

test('the WhatsApp invite has one link with the room and UTM, and its own share card', async ({
  browser,
}) => {
  const errors = [];
  const [host, guest] = [await player(browser, errors), await player(browser, errors)];
  const code = await createRoom(host);
  const text = new URL(await host.locator('#onlineWhatsapp').getAttribute('href')).searchParams.get('text');
  const link = `http://localhost:4173/?sala=${code}&utm_source=whatsapp&utm_medium=share&utm_campaign=en_linea`;
  expect(text).toBe(`¿Jugamos a OSO? 🐻 Entra en mi sala: ${link}`);
  // The notice sits halfway between the top of the screen and the card, as tall as ← →.
  const boxes = () =>
    Promise.all(['#onlineToast', '.panel', '#stepNext'].map((s) => host.locator(s).boundingBox()));
  await expect
    .poll(async () => {
      const [notice, panel] = await boxes();
      return Math.abs(notice.y + notice.height / 2 - panel.y / 2) < 2;
    })
    .toBe(true);
  const [notice, , next] = await boxes();
  expect(notice.height).toBeCloseTo(next.height, 1);
  const html = await (await guest.request.get(`/?sala=${code}`)).text();
  expect(html).toContain('content="https://juegaoso.com/og-sala.png"');
  expect(await (await guest.request.get('/')).text()).toContain('content="https://juegaoso.com/og.png"');
  await guest.goto(link.replace('http://localhost:4173', ''));
  await expect(guest.locator('#onlineToast')).toContainText('Ana te invita');
  await expect(guest).toHaveURL(/\/\?utm_source=whatsapp&utm_medium=share&utm_campaign=en_linea$/);
  expect(errors).toEqual([]);
});

const cell = (page, i) => page.locator('#board .cell').nth(i);

async function createRoom(host, name = 'Ana') {
  await host.goto('/');
  await host.click('#introSkip');
  await host.click('#modeTwo');
  await host.click('#stepNext');
  await host.click('#whereOnline');
  await host.click('#stepNext');
  await expect(host.locator('#onlineInvite')).toBeVisible();
  await host.fill('#nickname1', name);
  await host.click('#openRoom');
  await expect(host.locator('#onlineCode')).toHaveText(/^[A-Z2-9]{5}$/);
  await expect(host.locator('#onlineToast')).toContainText('Esperando a tu rival');
  return host.locator('#onlineCode').textContent();
}

// The guest fills their card and goes to the board step; the host picks the board and starts.
async function joinRoom(host, guest, code, name, hostName = 'Ana') {
  await host.click('#stepNext');
  await expect(host.locator('#startGame')).toBeDisabled();
  await guest.goto(`/?sala=${code}`);
  await expect(guest.locator('#onlineToast')).toContainText(`${hostName} te invita`);
  await expect(guest.locator('.pconfig.remote .online-seat-name')).toHaveText(hostName);
  await expect(guest.locator('.pconfig.remote .avatar-btn.selected')).toHaveText('🐻');
  await guest.fill('#nickname2', name);
  await guest.click('#stepNext');
  await expect(guest.locator('#onlineToast')).toContainText(`${hostName} está eligiendo el tablero`);
  await expect(guest.locator('#startGame')).toBeHidden();
  await expect(host.locator('#onlineToast')).toContainText(`${name} ya está aquí`);
  await expect(host.locator('.second-player .online-seat-name')).toHaveText(name);
  await host.selectOption('#sizeSelect', '4');
  await host.click('#startGame');
  await expect(guest.locator('#countdown')).toBeVisible();
  await expect(host.locator('#countdown')).toBeHidden({ timeout: 8000 });
  await expect(guest.locator('#countdown')).toBeHidden({ timeout: 8000 });
}

test('invite a friend, play turns remotely, resume after reload and win when the rival leaves', async ({
  browser,
}) => {
  const errors = [];
  const host = await player(browser, errors);
  const guest = await player(browser, errors);
  const code = await createRoom(host);
  await joinRoom(host, guest, code, 'Bea');
  await expect(guest.locator('#gameScreen')).toBeVisible();
  await expect(guest).toHaveURL(/\/$/);
  await expect(host.locator('#onlineDialog')).toBeHidden();
  await expect(host.locator('#gameScreen')).toBeVisible();
  await expect(host.locator('#board .cell')).toHaveCount(16);

  // Ana starts; Bea can't play out of turn.
  await expect(guest.locator('#turnBarTop')).toContainText('Esperando a Ana');
  await cell(guest, 3).click();
  await expect(cell(guest, 3)).toHaveText('');
  await cell(host, 0).click();
  await expect(cell(host, 0)).toHaveText('O');
  await expect(cell(guest, 0)).toHaveText('O');
  await expect(host.locator('#turnBarTop')).toContainText('Esperando a Bea');

  await cell(guest, 5).click();
  await expect(cell(host, 5)).toHaveText('O');

  // A reload keeps the seat.
  await guest.reload();
  await expect(guest.locator('#gameScreen')).toBeVisible();
  await expect(cell(guest, 0)).toHaveText('O');
  await expect(cell(guest, 5)).toHaveText('O');

  // Leaving on purpose gives the win to the rival.
  await guest.locator('.menu-btn:visible').first().click();
  await guest.click('#newGame');
  await expect(host.locator('#winnerOverlay')).toBeVisible();
  await expect(host.locator('#winnerTitle')).toHaveText('¡Gana Ana!');
  await expect(host.locator('#winnerSub')).toContainText('Bea ha salido');
  await expect(host.locator('#rematch')).toBeDisabled();
  await expect(host.locator('#changePlayers')).toHaveText('Salir');
  const boxes = await Promise.all(
    ['#rematch', '#changePlayers', '#shareResult'].map((id) => host.locator(id).boundingBox()),
  );
  for (const box of boxes) {
    expect(box.x).toBeCloseTo(boxes[0].x, 0);
    expect(box.width).toBeCloseTo(boxes[0].width, 0);
  }
  expect(errors).toEqual([]);
});

test('rematch starts a new game when both accept', async ({ browser }) => {
  const errors = [];
  const host = await player(browser, errors);
  const guest = await player(browser, errors);
  const code = await createRoom(host);
  await joinRoom(host, guest, code, 'Bea');
  await expect(host.locator('#gameScreen')).toBeVisible();

  // Fill the 4×4 board alternately until it ends.
  for (let i = 0; i < 16; i++) {
    if (await host.locator('#winnerOverlay').isVisible()) break;
    const turnHost = !(await host.locator('#turnBarTop').textContent()).includes('Esperando');
    const page = turnHost ? host : guest;
    const free = await page.evaluate(() =>
      [...document.querySelectorAll('#board .cell')].findIndex((c) => !c.textContent.trim()),
    );
    await cell(page, free).click();
    await expect(cell(turnHost ? guest : host, free)).not.toHaveText('');
  }
  await expect(host.locator('#winnerOverlay')).toBeVisible();
  await expect(guest.locator('#winnerOverlay')).toBeVisible();
  await host.click('#rematch');
  await expect(host.locator('#winnerSub')).toContainText('Esperando a que');
  await expect(guest.locator('#winnerSub')).toContainText('quiere la revancha');
  await guest.click('#rematch');
  await expect(guest.locator('#winnerOverlay')).toBeHidden();
  await expect(host.locator('#winnerOverlay')).toBeHidden();
  await expect(host.locator('#board .cell.filled')).toHaveCount(0);
  expect(errors).toEqual([]);
});

// The server closes the room after 30 min without a game; the next poll answers «closed».
const expireRoom = (page) =>
  page.route(/\/api\/sala\?code=/, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({
      response,
      json: { ...body, same: undefined, rev: body.rev + 1, status: 'closed', closed: 'expired' },
    });
  });

test('a room with no game after 30 min closes; the host opens another, the guest is told', async ({
  browser,
}) => {
  const errors = [];
  const [host, guest] = [await player(browser, errors), await player(browser, errors)];
  const code = await createRoom(host);
  await guest.goto(`/?sala=${code}`);
  await guest.fill('#nickname2', 'Leo');
  await guest.click('#stepNext');
  await expect(guest.locator('#onlineToast')).toContainText('está eligiendo el tablero');

  await expireRoom(guest);
  await expect(guest.locator('#onlineToast')).toHaveText(
    '⌛ Sala cerrada: no empezó en 30 min. Pide otro enlace.',
  );
  await expect(guest.locator('#modeTwo')).toBeVisible();
  await expect(guest.locator('#shareToggle')).toBeHidden();
  await expireRoom(host);
  await expect(host.locator('#onlineToast')).toHaveText('⌛ Sala cerrada: no empezó en 30 min. Abre otra.');
  await expect(host.locator('#openRoom')).toBeVisible();
  await expect(host.locator('#roomShare')).toBeHidden();
  await host.unroute(/\/api\/sala\?code=/);

  await host.click('#openRoom');
  await expect(host.locator('#onlineCode')).toHaveText(/^[A-Z2-9]{5}$/);
  await expect(host.locator('#onlineCode')).not.toHaveText(code);
  await expect(host.locator('#onlineToast')).toContainText('Esperando a tu rival');
  expect(errors).toEqual([]);
});

test('an unknown room shows a clear message', async ({ browser }) => {
  const errors = [];
  const guest = await player(browser, errors);
  await guest.goto('/?sala=ZZZZZ');
  await expect(guest.locator('#onlineStatus')).toContainText('ya no existe');
  await guest.click('#onlineCancel');
  await expect(guest.locator('#onlineDialog')).toBeHidden();
  expect(errors).toEqual([]);
});

test('after 20 s without a move the player on turn is asked «¿Sigues ahí?» and the rival is cheered', async ({
  browser,
}) => {
  const errors = [];
  const host = await player(browser, errors);
  const guest = await player(browser, errors);
  await host.clock.install();
  await guest.clock.install();
  const code = await createRoom(host);
  await joinRoom(host, guest, code, 'Bea');
  await expect(host.locator('#gameScreen')).toBeVisible();
  await expect(guest.locator('#turnBarTop')).toContainText('Esperando a Ana');

  await host.clock.fastForward(21_000);
  await guest.clock.fastForward(21_000);
  await expect(host.locator('#nudgeDialog')).toBeVisible();
  await expect(guest.locator('#nudgeDialog')).toBeHidden();
  await expect(guest.locator('#message')).toContainText('Todo por decidir');

  await host.click('#nudgeHere');
  await expect(host.locator('#nudgeDialog')).toBeHidden();
  await expect(guest.locator('#message')).toContainText('Ana sigue ahí, está pensando');
  await cell(host, 0).click();
  await expect(cell(guest, 0)).toHaveText('O');
  expect(errors).toEqual([]);
});
