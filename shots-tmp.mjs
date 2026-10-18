import { chromium } from '@playwright/test';
const TIED = [[0,6,'S'],[1,10,'O'],[0,3,'O'],[1,18,'S'],[0,17,'O'],[1,7,'O'],[0,20,'O'],[1,15,'O'],[0,5,'O'],[0,13,'O'],[1,21,'O'],[0,8,'O'],[1,14,'O'],[0,23,'S'],[1,4,'O'],[0,2,'S'],[1,9,'S'],[1,19,'S'],[0,24,'O'],[0,1,'S'],[1,16,'O'],[0,22,'O'],[0,0,'O'],[1,12,'S'],[1,11,'O']];
const devices = { movil: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, ipad: { width: 820, height: 1180, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, escritorio: { width: 1440, height: 900, deviceScaleFactor: 1 } };
const browser = await chromium.launch();
for (const [dev, o] of Object.entries(devices)) {
  const ctx = await browser.newContext({ viewport: { width: o.width, height: o.height }, isMobile: o.isMobile, hasTouch: o.hasTouch, deviceScaleFactor: o.deviceScaleFactor, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    if (!localStorage.getItem('oso.consent.v1')) localStorage.setItem('oso.consent.v1', 'denied');
    if (!localStorage.getItem('oso.rango.v1')) localStorage.setItem('oso.rango.v1', JSON.stringify({ players: { julia: { rating: 995, games: 9, tier: 0 }, 'papá': { rating: 1250, games: 20, tier: 2 } } }));
  });
  await page.route(/clarity\.ms|googletagmanager|google-analytics/, (r) => r.fulfill({ status: 200, body: '' }));
  await page.goto('http://localhost:4180/');
  if (await page.locator('#introSkip').isVisible()) await page.click('#introSkip');
  await page.click('#stepNext'); await page.click('#stepNext');
  for (const [id, v] of [['#nickname1', 'Papá'], ['#nickname2', 'Julia']]) await page.fill(id, v);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `/home/ubuntu/shots/rango-${dev}-1-quien-juega.png` });
  await page.click('#stepNext'); await page.click('#stepNext'); await page.click('#startGame');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/home/ubuntu/shots/rango-${dev}-2-partida.png` });
  for (const [p, i, l] of TIED) { await page.click(`.letter[data-player="${p}"][data-letter="${l}"]`); await page.locator('.cell').nth(i).click({ force: true }); }
  await page.locator('#rankUp').waitFor();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `/home/ubuntu/shots/rango-${dev}-3-final.png` });
  await ctx.close();
}
await browser.close();
