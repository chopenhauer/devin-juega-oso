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

const TILE = 'rgb(255, 247, 232)';
const bg = (locator) => locator.evaluate((e) => getComputedStyle(e).backgroundColor);
const center = async (locator) => {
  const b = await locator.boundingBox();
  return [b.x + b.width / 2, b.y + b.height / 2];
};

async function startTwoPlayers(page) {
  await page.goto('/');
  await page.click('#introSkip');
  await page.click('#stepNext');
  await page.click('#stepNext');
  await page.click('#stepNext');
  await page.click('#stepNext');
  await page.click('#startGame');
  await expect(page.locator('#gameScreen')).toBeVisible();
}

test('the selected letter looks like a board tile and can be dragged onto the board', async ({ page }) => {
  await startTwoPlayers(page);
  const o = page.locator('#side1 .letter[data-letter="O"]');
  const s = page.locator('#side1 .letter[data-letter="S"]');

  await expect(o).toHaveClass(/selected/);
  await expect.poll(() => bg(o)).toBe(TILE);
  expect(await bg(s)).not.toBe(TILE);
  await expect(o.locator('.drag-hint')).toBeVisible();
  await expect(s).toHaveAccessibleName('S');

  const [sx, sy] = await center(s);
  const cell = page.locator('.cell').nth(7);
  const [cx, cy] = await center(cell);
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx, sy - 20, { steps: 3 });
  await expect(page.locator('.drag-tile')).toHaveText('S');
  await expect(s).toHaveClass(/selected/);
  await expect.poll(() => bg(s)).toBe(TILE);
  await page.mouse.move(cx, cy, { steps: 8 });
  await expect(cell).toHaveClass(/drop-target/);
  await page.mouse.up();

  await expect(cell).toHaveText('S');
  await expect(page.locator('.drag-tile')).toHaveCount(0);
  await expect(page.locator('#side2')).toHaveClass(/active/);
  await expect(page.locator('#gameScreen')).toHaveClass(/drag-known/);
  await expect(page.locator('#side2 .letter.selected .drag-hint')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('oso.dragKnown.v1'))).toBe('1');
});

test('dropping a tile outside the board or on a filled cell places nothing', async ({ page }) => {
  await startTwoPlayers(page);
  await page.locator('.cell').nth(0).click();
  const s = page.locator('#side2 .letter[data-letter="S"]');
  const [sx, sy] = await center(s);
  const [fx, fy] = await center(page.locator('.cell').nth(0));

  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(fx, fy, { steps: 8 });
  await expect(page.locator('.drop-target')).toHaveCount(0);
  await page.mouse.up();
  await expect(page.locator('.cell').nth(0)).toHaveText('O');
  await expect(page.locator('#side2')).toHaveClass(/active/);
  await expect(page.locator('.cell.filled')).toHaveCount(1);

  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(5, 5, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.cell.filled')).toHaveCount(1);
  await expect(page.locator('#side2 .letter[data-letter="S"]')).toHaveClass(/selected/);
});

test('a tile never stays hanging when the drag loses its pointer capture', async ({ page }) => {
  await startTwoPlayers(page);
  const o = page.locator('#side1 .letter[data-letter="O"]');
  const [ox, oy] = await center(o);
  const cell = page.locator('.cell').nth(12);
  const [cx, cy] = await center(cell);

  await page.mouse.move(ox, oy);
  await page.mouse.down();
  await page.mouse.move(ox + 20, oy - 40, { steps: 4 });
  await expect(page.locator('.drag-tile')).toHaveCount(1);
  await o.evaluate((b) => b.hasPointerCapture(1) && b.releasePointerCapture(1));
  await page.mouse.move(cx, cy, { steps: 6 });
  await expect(cell).toHaveClass(/drop-target/);
  await page.mouse.up();
  await expect(cell).toHaveText('O');
  await expect(page.locator('.drag-tile')).toHaveCount(0);

  const s = page.locator('#side2 .letter[data-letter="S"]');
  const [sx, sy] = await center(s);
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + 20, sy + 40, { steps: 4 });
  await expect(page.locator('.drag-tile')).toHaveCount(1);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('.drag-tile')).toHaveCount(0);
  await page.mouse.up();
  await expect(page.locator('.cell.filled')).toHaveCount(1);

  await page.locator('.cell').nth(0).click();
  await expect(page.locator('.cell').nth(0)).toHaveText('S');
  await expect(page.locator('.drag-tile')).toHaveCount(0);
});
