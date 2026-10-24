import { test, expect } from '@playwright/test';

// Monday 26-10-2026 in Madrid: reto n.º 299, 5×5 against the machine in Fácil.
const MONDAY = new Date('2026-10-26T10:00:00+01:00');

// A fake browser push service: permission and subscription live in the page, /api/push in `server`.
async function fakePush(page, answer = 'granted') {
  await page.addInitScript((answer) => {
    localStorage.getItem('oso.consent.v1') ?? localStorage.setItem('oso.consent.v1', 'granted');
    // Kept across page loads, like a real browser.
    let permission = localStorage.getItem('fake.permission') ?? 'default';
    const keys = { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) };
    const endpoint = 'https://fcm.googleapis.com/fcm/send/test';
    const make = () => ({
      endpoint,
      toJSON: () => ({ endpoint, keys }),
      unsubscribe: async () => (localStorage.removeItem('fake.sub'), (sub = null), true),
    });
    let sub = localStorage.getItem('fake.sub') ? make() : null;
    window.Notification = {
      get permission() {
        return permission;
      },
    };
    window.Notification.requestPermission = async () => {
      localStorage.setItem('fake.permission', answer);
      return (permission = answer);
    };
    window.PushManager = function PushManager() {};
    const manager = {
      getSubscription: async () => sub,
      subscribe: async () => (localStorage.setItem('fake.sub', '1'), (sub = make())),
    };
    const reg = { pushManager: manager };
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: async () => reg, getRegistration: async () => reg, ready: Promise.resolve(reg) },
    });
  }, answer);
  const server = [];
  await page.route('**/api/push', async (route) => {
    const req = route.request();
    if (req.method() === 'GET')
      return route.fulfill({
        json: {
          key: 'BJh_QwbW-nQ9nX8JTRwSXQj3hvRiUEWRKVW3GOKjx7tmrZJPOyloe6du9f4OUVcMlFxwTpMHMH3lPcDbYUp7hR0',
        },
      });
    server.push(req.postDataJSON());
    return route.fulfill({ json: { ok: true } });
  });
  return server;
}

test.beforeEach(async ({ page }, testInfo) => {
  await page.clock.setFixedTime(MONDAY);
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

const events = (page) =>
  page.evaluate(() =>
    window.dataLayer.filter((e) => e[0] === 'event' && e[1] === 'push_optin').map((e) => e[2]),
  );

async function startReto(page) {
  await page.goto('/reto');
  await page.click('#dailyPlay');
  for (let i = 0; i < 6 && !(await page.locator('#startGame').isVisible()); i++)
    await page.click('#stepNext');
  await page.click('#startGame');
}

async function finish(page) {
  const overlay = page.locator('#winnerOverlay');
  for (let n = 0; n < 400 && !(await overlay.isVisible()); n++) {
    if (!(await page.locator('#side1.active').count())) {
      await page.waitForTimeout(100);
      continue;
    }
    const empty = await page.locator('.cell').evaluateAll((cs) => cs.findIndex((c) => !c.textContent.trim()));
    if (empty < 0) break;
    await page.click('.letter[data-player="0"][data-letter="O"]', { force: true });
    await page.locator('.cell').nth(empty).click({ force: true });
  }
  await expect(overlay).toBeVisible();
}

async function playReto(page) {
  await startReto(page);
  await finish(page);
}

test('the 🔔 notice is offered once, after the first reto, and can be turned off from the menu', async ({
  page,
}) => {
  const server = await fakePush(page);
  await page.goto('/');
  await expect(page.locator('#pushAsk')).toBeHidden();
  await playReto(page);
  const ask = page.locator('#pushAsk');
  await expect(ask).toBeVisible();
  await expect(page.locator('#pushText')).toContainText('18:00');
  await expect(page.locator('#feedbackAsk')).toBeHidden();
  await expect(page.locator('#installAsk')).toBeHidden();
  await page.click('#pushYes');
  await expect(page.locator('#pushText')).toHaveText(
    '🔔 ¡Hecho! Te aviso a las 18:00 cuando haya reto nuevo.',
  );
  expect(server[0]).toEqual({
    subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: expect.any(Object) },
    played: '2026-10-26',
    update: false,
  });
  expect((await events(page)).map((e) => e.action)).toEqual(['shown', 'granted']);

  // In a repeat of the reto it can be turned off from the menu, and it is not asked again.
  await startReto(page);
  await page.locator('[aria-controls="sidebar"]:visible').first().click();
  await expect(page.locator('#pushMenu')).toHaveText('🔔 Avisos del reto: sí');
  await page.click('#pushMenu');
  await expect(page.locator('#pushMenu')).toHaveText('🔔 Avisos del reto: no');
  expect(server.at(-1)).toEqual({ unsubscribe: 'https://fcm.googleapis.com/fcm/send/test' });
  await page.click('#closeMenu');
  await finish(page);
  await expect(ask).toBeHidden();
});

test('“No, gracias” hides it and it is not asked again', async ({ page }) => {
  await fakePush(page, 'denied');
  await playReto(page);
  await page.click('#pushNo');
  await expect(page.locator('#pushAsk')).toBeHidden();
  expect((await events(page)).map((e) => e.action)).toEqual(['shown', 'no']);
  expect(await page.evaluate(() => localStorage.getItem('oso.push.v1'))).toBe('{"asked":true}');
});

test('without push support (iPhone not installed) there is no question and no menu entry', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('oso.consent.v1', 'granted');
    delete window.PushManager;
  });
  await playReto(page);
  await expect(page.locator('#pushAsk')).toBeHidden();
  await expect(page.locator('#pushMenu')).toBeHidden();
});
