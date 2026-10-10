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

const cell = (page, i) => page.locator('#board .cell').nth(i);

async function createRoom(host, name = 'Ana') {
  await host.goto('/');
  await host.click('#introSkip');
  await host.click('#modeOnline');
  await host.click('#stepNext');
  await expect(host.locator('.second-player')).toBeHidden();
  await host.fill('#nickname1', name);
  await host.click('#stepNext');
  await expect(host.locator('#startGame')).toHaveText('Crear sala 🌐');
  await host.selectOption('#sizeSelect', '4');
  await host.click('#startGame');
  await expect(host.locator('#onlineDialog')).toBeVisible();
  await expect(host.locator('#onlineCode')).toHaveText(/^[A-Z2-9]{5}$/);
  return host.locator('#onlineCode').textContent();
}

test('invite a friend, play turns remotely, resume after reload and win when the rival leaves', async ({
  browser,
}) => {
  const errors = [];
  const host = await player(browser, errors);
  const guest = await player(browser, errors);
  const code = await createRoom(host);

  await guest.goto(`/?sala=${code}`);
  await expect(guest.locator('#onlineTitle')).toHaveText('Ana te invita a jugar');
  await guest.fill('#onlineName', 'Bea');
  await guest.click('#onlineJoinBtn');
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
  expect(errors).toEqual([]);
});

test('rematch starts a new game when both accept', async ({ browser }) => {
  const errors = [];
  const host = await player(browser, errors);
  const guest = await player(browser, errors);
  const code = await createRoom(host);
  await guest.goto(`/?sala=${code}`);
  await guest.click('#onlineJoinBtn');
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
  await guest.goto(`/?sala=${code}`);
  await guest.fill('#onlineName', 'Bea');
  await guest.click('#onlineJoinBtn');
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
