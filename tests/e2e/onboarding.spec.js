import { test, expect } from '@playwright/test';

const step = (page) => page.locator('#setupScreen').getAttribute('data-step');

test('first visit walks through the intro, then remembers choices', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  expect(await step(page)).toBe('welcome');
  await expect(page.locator('#stepNext')).toBeHidden();

  await page.click('#introStart');
  for (const name of ['rules-1', 'rules-2', 'rules-3', 'rules-4']) {
    expect(await step(page)).toBe(name);
    await expect(page.locator(`.step[data-step="${name}"] .step-title`)).toBeVisible();
    await page.click('#stepNext');
  }
  expect(await step(page)).toBe('mode');

  await page.click('#modeSolo');
  await page.click('#difficultyHard');
  await page.click('#stepNext');
  expect(await step(page)).toBe('players');
  await expect(page.locator('#nickname2')).toBeHidden();
  await page.fill('#nickname1', 'Julia');
  await page.click('.avatars[data-player="0"] .avatar-btn[data-avatar="🦊"]');
  await page.click('#stepNext');
  expect(await step(page)).toBe('board');
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
  expect(await step(page)).toBe('rules-1');
  await page.click('#stepBack');
  expect(await step(page)).toBe('welcome');
  expect(errors).toEqual([]);
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
