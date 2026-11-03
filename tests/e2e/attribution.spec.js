import { test, expect } from '@playwright/test';

// Where visits come from, counted with no cookies (api/_visita.js, public/js/campaigns.js).
async function visits(page) {
  const sent = [];
  await page.route('**/api/visita', (route) => {
    sent.push(route.request().postDataJSON());
    return route.fulfill({ status: 204 });
  });
  await page.route(
    /clarity\.ms|c\.bing\.com|googletagmanager\.com|google-analytics\.com|analytics\.google\.com/,
    (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );
  return sent;
}

test('a visit through a shared link says its campaign and source, also without consent', async ({ page }) => {
  const sent = await visits(page);
  await page.goto('/?utm_source=whatsapp&utm_medium=share&utm_campaign=boca_oreja');
  await expect
    .poll(() => sent.find((b) => b.consent))
    .toEqual({ consent: 'unset', campaign: 'boca_oreja', source: 'whatsapp', fresh: true });
});

test('a visit with no link sends no campaign', async ({ page }) => {
  const sent = await visits(page);
  await page.goto('/');
  await expect.poll(() => sent.find((b) => b.consent)).toEqual({ consent: 'unset', fresh: true });
});

test('/como-jugar is counted, and the game knows the visit came from it', async ({ page }) => {
  const sent = await visits(page);
  await page.goto('/como-jugar');
  await expect.poll(() => sent).toContainEqual({ page: 'como_jugar' });
  await page.click('#guidePlay');
  await expect
    .poll(() => sent.find((b) => b.consent))
    .toEqual({ consent: 'unset', campaign: 'como_jugar', source: 'web', fresh: true });
});
