import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  await page.route(
    /clarity\.ms|c\.bing\.com|googletagmanager\.com|google-analytics\.com|analytics\.google\.com/,
    (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );
  testInfo.errors = [];
  page.on('pageerror', (e) => testInfo.errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && testInfo.errors.push(m.text()));
  testInfo.beacons = [];
  page.on('request', (r) => r.url().endsWith('/api/visita') && testInfo.beacons.push(r.postDataJSON()));
});

// eslint-disable-next-line no-empty-pattern
test.afterEach(async ({}, testInfo) => {
  expect(testInfo.errors, 'no JS or CSP errors').toEqual([]);
});

const steps = (page) =>
  page.evaluate(() =>
    window.dataLayer.filter((e) => e[0] === 'event' && e[1] === 'setup_step').map((e) => e[2]),
  );
const counted = (testInfo) => testInfo.beacons.filter((b) => b.step);
const FIRST = [
  'welcome',
  'rules_1',
  'rules_2',
  'rules_3',
  'rules_4',
  'mode',
  'where',
  'players',
  'view',
  'board',
  'start',
];

test('first visit: every setup screen is counted once, and sent to GA4 once accepted', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#consentBanner')).toBeVisible();
  await expect.poll(() => counted(testInfo).map((b) => b.step)).toEqual(['welcome']);
  expect(await steps(page)).toEqual([]);
  await page.click('#consentAccept');
  // The screen seen before answering the banner is sent after accepting.
  expect((await steps(page)).map((p) => p.step)).toEqual(['welcome']);

  await page.click('#introStart');
  for (let i = 0; i < 5; i++) await page.click('#stepNext');
  // Going back and forth does not count a screen twice.
  await page.click('#stepBack');
  await page.click('#stepNext');
  for (let i = 0; i < 3; i++) await page.click('#stepNext');
  await page.click('#startGame');
  await expect(page.locator('#gameScreen')).toBeVisible();

  const sent = await steps(page);
  expect(sent.map((p) => p.step)).toEqual(FIRST);
  for (const p of sent) expect(p).toMatchObject({ entry: 'first', mode: expect.any(String) });
  expect(JSON.stringify(sent)).not.toMatch(/Jugador|🐻/);
  await expect.poll(() => counted(testInfo).map((b) => b.step)).toEqual(FIRST);
  expect(counted(testInfo).every((b) => b.entry === 'first')).toBe(true);

  // Screens seen after the first game are not part of the funnel.
  await page.locator('.menu-btn:visible').first().click();
  await page.click('#newGame');
  await expect(page.locator('#setupScreen')).toHaveAttribute('data-step', 'mode');
  expect((await steps(page)).length).toBe(FIRST.length);
});

test('returning visit with analytics rejected: only our counters, starting at the mode step', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('oso.consent.v1', 'denied');
    localStorage.setItem('oso.prefs.v1', JSON.stringify({ seenIntro: true }));
  });
  await page.goto('/');
  for (let i = 0; i < 4; i++) await page.click('#stepNext');
  await page.click('#startGame');
  await expect(page.locator('#gameScreen')).toBeVisible();
  const order = ['mode', 'where', 'players', 'view', 'board', 'start'];
  await expect
    .poll(() => counted(testInfo).map((b) => `${b.entry}:${b.step}`))
    .toEqual(order.map((s) => `return:${s}`));
  expect(await steps(page)).toEqual([]);
});

test('rejecting the banner drops the screens seen before', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.click('#introStart');
  await page.click('#consentDeny');
  await page.click('#stepNext');
  expect(await steps(page)).toEqual([]);
  await expect.poll(() => counted(testInfo).map((b) => b.step)).toEqual(['welcome', 'rules_1', 'rules_2']);
});
