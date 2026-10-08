import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  await page.route(/clarity\.ms|c\.bing\.com/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
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
  await page.click('#difficultyHard');
  heights.push(await panelHeight(page));
  await page.click('#stepNext');
  expect(await step(page)).toBe('players');
  await expect(page.locator('#nickname2')).toBeHidden();
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

  await page.click('#replayIntro');
  expect(await step(page)).toBe('rules');
  await expect(setupScreen(page)).toHaveAttribute('data-slide', '0');
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
  await page.click('#startGame');
  await page.click('#menuTab');
  await page.click('#newGame');
  expect(await step(page)).toBe('mode');
});
