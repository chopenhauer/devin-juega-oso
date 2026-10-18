import { expect } from '@playwright/test';

// Keeps a button pressed (public/js/hold.js) until `done` shows up, then lets go. Waiting for the
// result instead of a fixed time keeps it steady on a slow CI runner.
export async function hold(page, locator, done) {
  await expect(locator).toBeVisible();
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(done).toBeVisible();
  await page.mouse.up();
}
