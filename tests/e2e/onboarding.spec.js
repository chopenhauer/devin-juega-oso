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
  expect(await step(page)).toBe('welcome');
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
  await expect(setupScreen(page)).toHaveAttribute('data-slide', '3');
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
  await expect(credits).toHaveText('Hecho por Julia y JoseLuis — Vilarequi — con amor 🐻');
  await expect(credits).toBeVisible();
  await page.click('#introSkip');
  await expect(credits).toBeVisible();
  for (let i = 0; i < 3; i++) await page.click('#stepNext');
  await page.click('#startGame');
  await expect(credits).toBeHidden();
});

test('the mode step has the OSO header, a ❓ rules button and no progress bar', async ({ page }) => {
  await page.goto('/');
  await page.click('#introSkip');
  const mode = page.locator('.step[data-step="mode"]');
  await expect(mode.locator('.brand span')).toHaveText(['O', 'S', 'O']);
  await expect(mode.locator('.mode-btn')).toHaveText([/1 jugador/, /2 jugadores/, /4 jugadores/]);
  await expect(page.locator('#modeFour')).toBeDisabled();
  await expect(page.locator('#modeFour')).toContainText('Próximamente');
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
