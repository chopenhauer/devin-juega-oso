import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    () => localStorage.getItem('oso.consent.v1') ?? localStorage.setItem('oso.consent.v1', 'denied'),
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

const setupScreen = (page) => page.locator('#setupScreen');
const step = (page) => setupScreen(page).getAttribute('data-step');
const panelHeight = async (page) => Math.round((await page.locator('.panel').boundingBox()).height);
const avatar = (page, player, emoji) =>
  page.locator(`.avatars[data-player="${player}"] .avatar-btn[data-avatar="${emoji}"]`);

test('first visit walks through the intro carousel, then remembers choices', async ({ page }) => {
  await page.goto('/');
  expect(await step(page)).toBe('welcome');
  await expect(page.locator('#stepNext')).toBeHidden();
  const heights = [await panelHeight(page)];

  await page.click('#introStart');
  expect(await step(page)).toBe('rules');
  for (let i = 0; i < 4; i++) {
    await expect(setupScreen(page)).toHaveAttribute('data-slide', String(i));
    await expect(page.locator(`.rule-slide[data-slide="${i}"]`)).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator(`.dot[data-slide="${i}"]`)).toHaveAttribute('aria-current', 'true');
    heights.push(await panelHeight(page));
    await page.click('#stepNext');
  }
  expect(await step(page)).toBe('mode');
  await page.click('#modeSolo');
  heights.push(await panelHeight(page));
  await page.click('#stepNext');
  expect(await step(page)).toBe('players');
  await expect(page.locator('#nickname2')).toBeDisabled();
  await expect(page.locator('#nickname2')).toHaveValue('Máquina');
  await page.click('#difficultyHard');
  await page.fill('#nickname1', 'Julia');
  await avatar(page, 0, '🦊').click();
  heights.push(await panelHeight(page));
  await page.click('#stepNext');
  expect(await step(page)).toBe('board');
  heights.push(await panelHeight(page));
  expect(Math.max(...heights) - Math.min(...heights), `panel heights ${heights}`).toBeLessThanOrEqual(1);

  await page.selectOption('#sizeSelect', '6');
  await expect(page.locator('#setupSummary')).toContainText('Julia contra la máquina (difícil)');
  await page.click('#startGame');
  await expect(page.locator('#name1')).toHaveText('Julia');
  await expect(page.locator('#avatar1')).toHaveText('🦊');
  await expect(page.locator('.cell')).toHaveCount(36);

  await page.reload();
  expect(await step(page)).toBe('mode');
  await expect(page.locator('#modeSolo')).toHaveClass(/selected/);
  await expect(page.locator('#difficultyHard')).toHaveClass(/selected/);
  await expect(page.locator('#nickname1')).toHaveValue('Julia');
  await expect(page.locator('#preview1')).toHaveText('🦊');
  await expect(page.locator('#sizeSelect')).toHaveValue('6');

  await expect(page.locator('#stepBack')).toHaveText('👀 Cómo se juega');
  await page.click('#stepBack');
  expect(await step(page)).toBe('rules');
  await expect(setupScreen(page)).toHaveAttribute('data-slide', '0');
});

test('the carousel moves with swipes and dots', async ({ page }) => {
  await page.goto('/');
  await page.click('#introStart');
  const box = await page.locator('#ruleCarousel').boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 5 });
  await page.mouse.up();
  await expect(setupScreen(page)).toHaveAttribute('data-slide', '1');
  await page.click('.dot[data-slide="3"]');
  await expect(setupScreen(page)).toHaveAttribute('data-slide', '3');
  await page.click('#stepNext');
  expect(await step(page)).toBe('mode');
  await page.click('#stepBack');
  await expect(setupScreen(page)).toHaveAttribute('data-slide', '0');
});

test('players cannot pick the same avatar, also after restoring a swap', async ({ page }) => {
  await page.goto('/');
  await page.click('#introSkip');
  await page.click('#stepNext');
  await expect(avatar(page, 1, '🐻')).toBeDisabled();
  await expect(avatar(page, 0, '🐼')).toBeDisabled();

  await avatar(page, 0, '🦊').click();
  await expect(avatar(page, 1, '🦊')).toBeDisabled();
  await expect(avatar(page, 1, '🐻')).toBeEnabled();
  await avatar(page, 1, '🐻').click();
  await avatar(page, 0, '🐼').click();
  await expect(page.locator('#preview1')).toHaveText('🐼');
  await expect(page.locator('#preview2')).toHaveText('🐻');

  await page.click('#stepNext');
  await page.click('#stepNext');
  await page.click('#startGame');
  await page.reload();
  await expect(page.locator('#preview1')).toHaveText('🐼');
  await expect(page.locator('#preview2')).toHaveText('🐻');
  await expect(avatar(page, 1, '🐼')).toBeDisabled();
});

test('back from the game menu returns to the mode step', async ({ page }) => {
  await page.goto('/');
  await page.click('#introSkip');
  await page.click('#stepNext');
  await page.click('#stepNext');
  await page.click('#stepNext');
  await page.click('#startGame');
  await page.click('#menu1');
  await page.click('#newGame');
  expect(await step(page)).toBe('mode');
});

const rotated = (page, selector) =>
  page.locator(selector).evaluate((e) => getComputedStyle(e).transform !== 'none');

test('two players choose the orientation; solo skips that step', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.click('#introSkip');
  const heights = [await panelHeight(page)];
  await page.click('#stepNext');
  await page.click('#stepNext');
  expect(await step(page)).toBe('view');
  heights.push(await panelHeight(page));
  expect(Math.max(...heights) - Math.min(...heights), `panel heights ${heights}`).toBeLessThanOrEqual(1);
  const defaultView = testInfo.project.name === 'desktop' ? '#viewSame' : '#viewFacing';
  await expect(page.locator(defaultView)).toHaveAttribute('aria-pressed', 'true');

  await page.click('#viewSame');
  await expect(page.locator('#viewFacing')).toHaveAttribute('aria-pressed', 'false');
  await page.click('#stepNext');
  await expect(page.locator('#setupSummary')).toContainText('(misma vista)');
  await page.click('#startGame');
  expect(await rotated(page, '#side2')).toBe(false);
  expect(await rotated(page, '#turnBarTop')).toBe(false);

  await page.reload();
  await expect(page.locator('#viewSame')).toHaveAttribute('aria-pressed', 'true');
  await page.click('#stepNext');
  await page.click('#stepNext');
  await page.click('#viewFacing');
  await page.click('#stepNext');
  await expect(page.locator('#setupSummary')).toContainText('(enfrentados)');
  await page.click('#startGame');
  expect(await rotated(page, '#side2')).toBe(true);

  await page.click('#menu1');
  await page.click('#newGame');
  await page.click('#modeSolo');
  await page.click('#stepNext');
  await page.click('#stepNext');
  expect(await step(page)).toBe('board');
  await page.click('#stepBack');
  expect(await step(page)).toBe('players');
});

test('credits show on the setup screens and hide during the game', async ({ page }) => {
  await page.goto('/');
  const credits = page.locator('.credits-text');
  await expect(credits).toHaveText('made by Vilarequi with ❤️');
  await expect(credits).toBeVisible();
  await page.click('#introSkip');
  await expect(credits).toBeVisible();
  for (let i = 0; i < 3; i++) await page.click('#stepNext');
  await page.click('#startGame');
  await expect(credits).toBeHidden();
});

test('the mode step has the OSO header, a ❓ rules button and no progress bar', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.click('#introSkip');
  const mode = page.locator('.step[data-step="mode"]');
  await expect(mode.locator('.brand span')).toHaveText(['O', 'S', 'O']);
  await expect(mode.locator('.mode-btn')).toHaveText([/1 jugador/, /2 jugadores/, /4 jugadores/]);
  if (testInfo.project.name === 'mobile') {
    await expect(page.locator('#modeFour')).toHaveAttribute('data-locked', 'true');
  } else {
    await expect(page.locator('#modeFour')).not.toHaveAttribute('data-locked');
  }
  await expect(page.locator('[role="progressbar"]')).toHaveCount(0);
  await expect(page.locator('#stepNext')).toBeVisible();
  await page.click('#helpToggle');
  await expect(page.locator('#helpModal')).toBeVisible();
  await page.click('#helpClose');
});

test('against the machine, the difficulty replaces the avatars and sets the robot mood', async ({ page }) => {
  await page.goto('/');
  await page.click('#introSkip');
  await page.click('#modeSolo');
  await page.click('#stepNext');
  const robot = page.locator('#preview2');
  await expect(robot).toHaveText('🤖');
  await expect(robot).toHaveAttribute('data-mood', 'easy');
  await expect(page.locator('.avatars[data-player="1"]')).toBeHidden();
  await expect(page.locator('#difficultyEasy')).toBeVisible();
  await page.click('#difficultyHard');
  await expect(robot).toHaveAttribute('data-mood', 'hard');
  await page.click('#stepNext');
  await page.click('#startGame');
  await expect(page.locator('#avatar2')).toHaveAttribute('data-mood', 'hard');
  await expect(page.locator('#avatar2')).toHaveClass(/robot/);
});

test('wizard nav is ← ? → in every step and the board step keeps ¡A jugar! under the board choice', async ({
  page,
}) => {
  await page.goto('/');
  await page.click('#introStart');
  await expect(page.locator('#stepBack')).toHaveText('←');
  await expect(page.locator('#stepBack')).toHaveAttribute('aria-label', 'Atrás');
  await expect(page.locator('#stepNext')).toHaveText('→');
  await expect(page.locator('#stepNext')).toHaveAttribute('aria-label', 'Siguiente');
  const nav = await page.locator('.wizard-nav').boundingBox();
  const help = await page.locator('#helpToggle').boundingBox();
  expect(Math.abs(help.x + help.width / 2 - (nav.x + nav.width / 2))).toBeLessThan(2);
  for (let i = 0; i < 4; i++) await page.click('#stepNext');
  await expect(page.locator('.mode-btn .mode-emoji')).toHaveCount(3);
  for (let i = 0; i < 3; i++) await page.click('#stepNext');
  expect(await step(page)).toBe('board');
  await expect(page.locator('.step-lead:visible')).toHaveText(
    'Cuanto más grande, más tiempo y más puntos OSO posibles.',
  );
  await expect(page.locator('#setupSummary')).toHaveClass(/visually-hidden/);
  await expect(page.locator('#stepNext')).toHaveClass(/invisible/);
  const select = await page.locator('#sizeSelect').boundingBox();
  const start = await page.locator('#startGame').boundingBox();
  expect(start.y).toBeGreaterThan(select.y + select.height);
  const help2 = await page.locator('#helpToggle').boundingBox();
  expect(Math.abs(help2.x + help2.width / 2 - (nav.x + nav.width / 2))).toBeLessThan(2);
});

test('rule cards animate the move, restart when shown and stay still with reduced motion', async ({
  page,
}) => {
  const card = (i) => page.locator(`.rule-slide[data-slide="${i}"]`);
  const running = (i) =>
    card(i).evaluate(
      (el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
    );
  await page.goto('/');
  await page.click('#introStart');
  await expect(card(0)).toHaveClass(/playing/);
  await expect(card(1)).not.toHaveClass(/playing/);
  expect(await running(0)).toBeGreaterThan(0);
  await page.click('#stepNext');
  await expect(card(1)).toHaveClass(/playing/);
  await expect(card(0)).not.toHaveClass(/playing/);
  await expect(card(1).locator('.demo-dirs')).toContainText('diagonal');
  await page.click('#stepNext');
  await page.click('#stepNext');
  await expect(card(3)).toHaveClass(/playing/);
  await expect(card(3).locator('.countdown span')).toHaveCount(8);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.click((await step(page)) === 'welcome' ? '#introStart' : '#stepBack');
  await expect(card(0)).toHaveClass(/playing/);
  expect(await running(0)).toBe(0);
  await expect(card(0).locator('.demo-landed')).toHaveCSS('opacity', '1');
  await expect(card(0).locator('.demo-ghost')).toHaveCSS('opacity', '0');
});

test('step buttons: plain and equal in the intro, yellow next in setup, round help', async ({ page }) => {
  const widths = async (...ids) =>
    Promise.all(ids.map(async (id) => Math.round((await page.locator(id).boundingBox()).width)));
  const expectRoundHelp = async () => {
    const box = await page.locator('#helpToggle').boundingBox();
    expect(Math.round(box.width)).toBe(Math.round(box.height));
    await expect(page.locator('#helpToggle')).toHaveCSS('border-radius', '50%');
  };
  await page.goto('/');
  await page.click('#introStart');
  await expect(page.locator('#stepNext')).toHaveClass(/secondary/);
  await expect(page.locator('#stepNext')).not.toHaveClass(/primary/);
  expect(new Set(await widths('#stepBack', '#stepNext')).size).toBe(1);
  await expectRoundHelp();

  for (let i = 0; i < 4; i++) await page.click('#stepNext');
  expect(await step(page)).toBe('mode');
  await expect(page.locator('#stepNext')).toHaveText('Siguiente →');
  await expect(page.locator('#stepNext')).toHaveClass(/primary/);
  const [back, next] = await widths('#stepBack', '#stepNext');
  expect(Math.abs(back - next)).toBeLessThanOrEqual(1);

  await page.click('#stepNext');
  expect(await step(page)).toBe('players');
  await expect(page.locator('#stepNext')).toHaveText('→');
  await expect(page.locator('#stepNext')).toHaveClass(/primary/);
  expect(new Set(await widths('#stepBack', '#stepNext')).size).toBe(1);
  await expectRoundHelp();
});

test('on a phone, the name being typed moves above the keyboard', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'phone only');
  // Stand-in for the visual viewport, which the keyboard shrinks without resizing the page.
  await page.addInitScript(() => {
    const vv = new EventTarget();
    Object.defineProperty(vv, 'height', { get: () => window.vvHeight ?? innerHeight });
    Object.defineProperty(vv, 'offsetTop', { get: () => 0 });
    Object.defineProperty(window, 'visualViewport', { get: () => vv });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.click('#introSkip');
  await page.click('#stepNext');
  await expect(page.locator('#setupScreen')).toHaveAttribute('data-step', 'players');
  const keyboard = () => page.evaluate(() => document.body.style.getPropertyValue('--keyboard'));
  const openKeyboard = (height) =>
    page.evaluate((h) => {
      window.vvHeight = h;
      window.visualViewport.dispatchEvent(new Event('resize'));
    }, height);

  for (const id of ['#nickname1', '#nickname2']) {
    await page.focus(id);
    await openKeyboard(400);
    await expect.poll(keyboard).toBe('444px');
    await expect
      .poll(async () => {
        const box = await page.locator(id).boundingBox();
        return box.y >= 0 && box.y + box.height <= 400;
      })
      .toBe(true);
  }

  await openKeyboard(844);
  await expect.poll(keyboard).toBe('0px');
  await page.focus('#nickname1');
  await page.locator('#nickname1').blur();
  await expect.poll(keyboard).toBe('0px');
});
