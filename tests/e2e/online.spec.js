import { test, expect } from '@playwright/test';
import { hold } from './helpers.js';

// Two independent browsers play through scripts/serve.js, which serves /api/sala from memory.
async function player(browser, errors) {
  // Each player has its own address for the room rate limit (20 per 10 min), so the suite and its
  // retries never run out of rooms.
  const context = await browser.newContext({
    extraHTTPHeaders: { 'x-real-ip': `online-${Math.random().toString(36).slice(2)}` },
  });
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
  expect(text).toBe(`Jugamos a OSO? 🐻 Entra en mi sala:\n\n${link}`);
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
  await expect(guest.locator('.pconfig.remote .online-seat-avatar')).toHaveText('🐻');
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
  await expect(host.locator('#pauseGame')).toHaveClass(/hidden/);
  await expect(guest.locator('#pauseGame')).toHaveClass(/hidden/);

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
  // The seat key lives only in an HttpOnly cookie: the page's JavaScript never sees it.
  const [saved, pageCookies] = await guest.evaluate(() => [
    JSON.parse(localStorage.getItem('oso.online.v1')),
    document.cookie,
  ]);
  expect(saved).toEqual({ code, seat: 1 });
  expect(pageCookies).not.toContain('oso_sala_');
  const seatCookies = (await guest.context().cookies()).filter((c) => c.name.startsWith('oso_sala_'));
  expect(seatCookies).toMatchObject([
    { name: `oso_sala_${code}_1`, path: '/api/sala', httpOnly: true, sameSite: 'Strict' },
  ]);

  // Leaving on purpose gives the win to the rival.
  await guest.locator('.menu-btn:visible').first().click();
  await guest.click('#newGame');
  await expect(host.locator('#winnerOverlay')).toBeVisible();
  await expect(host.locator('#winnerTitle')).toHaveText('¡Gana Ana!');
  await expect(host.locator('#winnerSub')).toContainText('Bea ha salido');
  await expect(host.locator('#rematch')).toBeDisabled();
  await expect(host.locator('#changePlayers')).toHaveText('Salir');
  const [rematch, leave, replay, share] = await Promise.all(
    ['#rematch', '#changePlayers', '#replayOpen', '#shareResult'].map((id) => host.locator(id).boundingBox()),
  );
  expect(leave.x).toBeCloseTo(rematch.x, 0);
  expect(leave.width).toBeCloseTo(rematch.width, 0);
  // «Ver la partida» and «Compartir resultado» share the last row.
  expect(replay.x).toBeCloseTo(rematch.x, 0);
  expect(share.x + share.width).toBeCloseTo(rematch.x + rematch.width, 0);
  expect(share.y).toBeCloseTo(replay.y, 0);
  expect(errors).toEqual([]);
});

test('rematch starts a new game when both accept', async ({ browser }) => {
  test.slow(); // two browsers play a whole game through polling
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

test('the guest sees whose card is whose; the host hears them arrive and goes on to the board', async ({
  browser,
}) => {
  const errors = [];
  const [host, guest] = [await player(browser, errors), await player(browser, errors)];
  const code = await createRoom(host);
  await expect(host.locator('.pconfig').first().locator('.small-label')).toHaveText('Tú');
  await expect(host.locator('.second-player .small-label')).toHaveText('Tu rival');
  await host.evaluate(() => {
    window.sounds = [];
    document.addEventListener('oso:sound', (e) => window.sounds.push(e.detail));
  });
  await guest.goto(`/?sala=${code}`);
  await expect(guest.locator('.second-player .small-label')).toHaveText('Tú');
  await expect(guest.locator('.pconfig').first().locator('.small-label')).toHaveText('Te invita');
  await expect(guest.locator('.pconfig.remote .avatars')).toBeHidden();
  await guest.fill('#nickname2', 'Leo');
  await guest.click('#stepNext');
  await expect(host.locator('#sizeSelect')).toBeVisible();
  await expect(host).toHaveTitle('✅ Leo ya está aquí · OSO');
  expect(await host.evaluate(() => window.sounds)).toContain('join');
  await host.click('#startGame');
  await expect(host.locator('#gameScreen')).toBeVisible();
  await expect(host).toHaveTitle('OSO · El juego de la O y la S');
  expect(errors).toEqual([]);
});

test('the rival is told about the extras used and bought in the secret shop', async ({ browser }) => {
  const errors = [];
  const [host, guest] = [await player(browser, errors), await player(browser, errors)];
  const code = await createRoom(host);
  await joinRoom(host, guest, code, 'Bea');
  const news = guest.locator('#message');
  await host.click('#hint1');
  await expect(news).toContainText('💡 🐻 Ana ha usado una pista.');
  await hold(host, host.locator('#hint1'), host.locator('#shopDialog'));
  await host.click('#shopBuy');
  await expect(news).toContainText('🛒 🐻 Ana ha comprado una 💡 pista en la tienda secreta (−10 s).');
  await cell(host, 0).click();
  await expect(cell(guest, 0)).toHaveText('O');
  await cell(guest, 5).click();
  await expect(cell(host, 5)).toHaveText('O');
  await host.click('#swap1');
  await cell(host, 0).click();
  await expect(cell(guest, 0)).toHaveText('S');
  await expect(news).toContainText('🔄 🐻 Ana ha cambiado una letra.');
  await expect(host.locator('#message')).not.toContainText('Ana ha cambiado');
  expect(errors).toEqual([]);
});

test("the guest wears the host's theme, each sees their own panel at the bottom and SOS stops both screens", async ({
  browser,
}) => {
  const errors = [];
  const [host, guest] = [await player(browser, errors), await player(browser, errors)];
  await host.clock.setFixedTime(new Date('2026-12-01T12:00:00'));
  await host.addInitScript(() => localStorage.setItem('oso.theme.v1', 'halloween'));
  await guest.goto('/');
  const own = await guest.locator('body').getAttribute('data-theme');
  const code = await createRoom(host);
  await expect(host.locator('body')).toHaveAttribute('data-theme', 'halloween');
  await host.click('#stepNext');
  await guest.goto(`/?sala=${code}`);
  await expect(guest.locator('body')).toHaveAttribute('data-theme', 'halloween');
  await expect(guest.locator('.pconfig.remote .online-seat-avatar')).toHaveText('🎃');
  await expect(guest.locator('.avatars[data-player="1"] .avatar-btn').first()).toHaveText('🎃');
  await guest.fill('#nickname2', 'Leo');
  await guest.click('#stepNext');
  await expect(host.locator('#onlineToast')).toContainText('Leo ya está aquí');
  await host.click('#startGame');
  // The guest learns about the start by polling: wait for its board before the countdown check.
  for (const page of [host, guest]) {
    await expect(page.locator('#gameScreen')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#countdown')).toBeHidden({ timeout: 8000 });
  }

  // Own panel below the rival's (on wide screens, left of it).
  const ownFirst = async (page, mine, theirs) => {
    const [a, b] = await Promise.all([mine, theirs].map((s) => page.locator(s).boundingBox()));
    return a.y > b.y + b.height / 2 || a.x + a.width / 2 < b.x;
  };
  expect(await ownFirst(host, '#side1', '#side2')).toBe(true);
  expect(await ownFirst(guest, '#side2', '#side1')).toBe(true);

  await host.click('#sos1');
  for (const page of [host, guest]) {
    await expect(page.locator('#modeFlash')).toBeVisible();
    await expect(page.locator('.sos-hero')).toHaveText('S🛟S');
  }
  for (const page of [host, guest]) await expect(page.locator('#modeFlash')).toBeHidden({ timeout: 4000 });
  await expect(guest.locator('.score-label').first()).toHaveText('puntos SOS');

  // Leaving the room gives the guest their own theme back; their saved choice is untouched.
  await guest.locator('.menu-btn:visible').first().click();
  await guest.click('#newGame');
  await expect(guest.locator('body')).toHaveAttribute('data-theme', own);
  expect(await guest.evaluate(() => localStorage.getItem('oso.theme.v1'))).toBeNull();
  expect(errors).toEqual([]);
});

test('alone in the room for a minute, the host plays the machine and goes with the rival when they arrive', async ({
  browser,
}) => {
  const errors = [];
  const [host, guest] = [await player(browser, errors), await player(browser, errors)];
  await host.clock.install();
  const code = await createRoom(host);
  await expect(host.locator('#waitMachine')).toBeHidden();
  await host.clock.fastForward(61_000);
  // The offer wraps inside the rival's card, which stays on screen.
  const [button, card] = await Promise.all(
    ['#waitMachine', '.second-player'].map((s) => host.locator(s).boundingBox()),
  );
  expect(button.x + button.width).toBeLessThanOrEqual(card.x + card.width);
  expect(card.x + card.width).toBeLessThanOrEqual(host.viewportSize().width);
  await host.click('#waitMachine');
  await expect(host.locator('#gameScreen')).toBeVisible();
  await expect(host.locator('#machineBadge')).toBeVisible();
  await expect(host.locator('#rivalBanner')).toBeHidden();

  await guest.goto(`/?sala=${code}`);
  await guest.fill('#nickname2', 'Leo');
  await guest.click('#stepNext');
  await expect(guest.locator('#onlineToast')).toContainText('está eligiendo el tablero');
  await expect(host.locator('#rivalBanner')).toContainText('✅ Ha llegado Leo');
  await host.click('#rivalGo');
  await expect(host.locator('#rivalBanner')).toBeHidden();
  await expect(host.locator('#onlineToast')).toContainText('Leo ya está aquí');
  await host.click('#startGame');
  await expect(guest.locator('#gameScreen')).toBeVisible();
  await expect(host.locator('#gameScreen')).toBeVisible();
  await expect(host.locator('#machineBadge')).toBeHidden();
  expect(errors).toEqual([]);
});

test('a host already on the board step is offered the machine too, and comes back to the board', async ({
  browser,
}) => {
  const errors = [];
  const [host, guest] = [await player(browser, errors), await player(browser, errors)];
  await host.clock.install();
  const code = await createRoom(host);
  await host.click('#stepNext');
  await expect(host.locator('#startGame')).toBeDisabled();
  await expect(host.locator('#boardWaitMachine')).toBeHidden();
  await host.clock.fastForward(61_000);
  await expect(host.locator('#boardWaitMachine')).toBeVisible();
  await expect(host.locator('#onlineToast')).toContainText('Esperando a tu rival');
  await host.click('#boardWaitMachine');
  await expect(host.locator('#gameScreen')).toBeVisible();
  await expect(host.locator('#machineBadge')).toBeVisible();

  await guest.goto(`/?sala=${code}`);
  await guest.fill('#nickname2', 'Leo');
  await guest.click('#stepNext');
  await expect(host.locator('#rivalBanner')).toContainText('✅ Ha llegado Leo');
  await host.click('#rivalGo');
  await expect(host.locator('#onlineToast')).toContainText('Leo ya está aquí');
  await expect(host.locator('#boardWaitMachine')).toBeHidden();
  await host.click('#startGame');
  await expect(guest.locator('#gameScreen')).toBeVisible();
  await expect(host.locator('#machineBadge')).toBeHidden();
  expect(errors).toEqual([]);
});

test('if the room closes while the host plays the machine, the game goes on and says so', async ({
  browser,
}) => {
  const errors = [];
  const host = await player(browser, errors);
  await host.clock.install();
  await createRoom(host);
  await host.clock.fastForward(61_000);
  await host.click('#waitMachine');
  await expireRoom(host);
  await expect(host.locator('#rivalBanner')).toHaveText('⌛ Sala cerrada: tu rival no llegó en 30 min.');
  await expect(host.locator('#rivalGo')).toBeHidden();
  await expect(host.locator('#gameScreen')).toBeVisible();
  expect(errors).toEqual([]);
});

test('without connection, the online notice offers a game against the machine', async ({ browser }) => {
  const errors = [];
  const page = await player(browser, errors);
  await page.route('**/api/sala**', (route) => route.abort('internetdisconnected'));
  await page.goto('/');
  await page.click('#introSkip');
  await page.click('#modeTwo');
  await page.click('#stepNext');
  await page.click('#whereOnline');
  await page.click('#stepNext');
  await page.click('#openRoom');
  await expect(page.locator('#onlineStatus')).toHaveText(
    'No hay conexión. Revisa internet y vuelve a probar.',
  );
  await page.click('#onlineMachine');
  await expect(page.locator('#onlineDialog')).toBeHidden();
  await expect(page.locator('#modeSolo')).toHaveClass(/selected/);
  await expect(page.locator('#nickname2')).toHaveValue('Máquina');
  await page.click('#stepNext');
  await page.click('#startGame');
  await expect(page.locator('#gameScreen')).toBeVisible();

  // With connection (a room that does not exist), only «Vale».
  const other = await player(browser, errors);
  await other.goto('/?sala=ZZZZZ');
  await expect(other.locator('#onlineDialog')).toBeVisible();
  await expect(other.locator('#onlineMachine')).toBeHidden();
  expect(errors.filter((e) => !/ERR_INTERNET_DISCONNECTED/.test(e))).toEqual([]);
});
