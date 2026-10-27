import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(
    /clarity\.ms|c\.bing\.com|googletagmanager\.com|google-analytics\.com|analytics\.google\.com/,
    (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );
});

// Without the game's JS the page shows what crawlers see: every text must already be marked
// with its key and match es.json, so nothing is left outside the locale file.
test('every text of the page has its key in es.json', async ({ page }) => {
  await page.route(/\/js\/.*\.js$/, (route) => route.abort());
  await page.goto('/');
  const problems = await page.evaluate(async () => {
    const es = await (await fetch('/locales/es.json')).json();
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    const letters = /[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,}/;
    const out = [];
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!letters.test(n.nodeValue) || el.closest('script, style, svg, noscript')) continue;
      const html = el.closest('[data-i18n-html]');
      if (html) {
        if (norm(html.innerHTML) !== norm(es[html.dataset.i18nHtml] ?? ''))
          out.push(`html ${html.dataset.i18nHtml}`);
      } else if (!el.dataset.i18n) out.push(`sin clave: ${norm(n.nodeValue)}`);
      else if (norm(n.nodeValue) !== es[el.dataset.i18n]) out.push(`distinto: ${el.dataset.i18n}`);
    }
    for (const el of document.querySelectorAll(
      '[aria-label], [title], [placeholder], [alt], meta[content]',
    )) {
      for (const attr of ['aria-label', 'title', 'placeholder', 'alt', 'content']) {
        const value = el.getAttribute(attr);
        if (!value || !letters.test(value)) continue;
        if (attr === 'content' && !/\s/.test(value)) continue;
        if (el.matches('meta[name="viewport"]')) continue;
        const pair = (el.dataset.i18nAttr ?? '').split(';').find((p) => p.startsWith(`${attr}:`));
        if (!pair) out.push(`sin clave: ${attr}="${value}"`);
        else if (norm(value) !== es[pair.split(':')[1]]) out.push(`distinto: ${pair}`);
      }
    }
    return out;
  });
  expect(problems).toEqual([]);
});

test.describe('in a browser in another language', () => {
  test.use({ locale: 'fr-FR' });

  test('the game stays in Spanish and analytics get the browser language', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.addInitScript(() => localStorage.setItem('oso.consent.v1', 'granted'));
    await page.goto('/');
    await expect(page.locator('#introStart')).toHaveText('Cómo se juega →');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    const sent = await page.evaluate(async () => {
      const { track } = await import('/js/telemetry.js');
      track('i18n_check');
      return window.dataLayer.filter((e) => e[0] === 'event' && e[1] === 'i18n_check').map((e) => e[2]);
    });
    expect(sent).toEqual([expect.objectContaining({ app_language: 'es', browser_language: 'fr-FR' })]);
    expect(errors).toEqual([]);
  });
});

test('locale HTML keeps only its own tags: no handlers, scripts or javascript: links', async ({ page }) => {
  await page.goto('/');
  const html = await page.evaluate(async () => {
    const { setHtml } = await import('/js/i18n.js');
    const el = document.createElement('p');
    setHtml(
      el,
      'Hola <b onclick="alert(1)">tú</b><img src="x" onerror="alert(1)"><script>alert(1)</script>' +
        '<a href="javascript:alert(1)">x</a><a href="//evil.example">w</a>' +
        '<a href="/privacidad" target="_blank" rel="noopener">y</a><span class="btn-sub" style="color:red">z</span>' +
        '<div>d<i>i</i></div>',
    );
    return el.innerHTML;
  });
  expect(html).toBe(
    'Hola <b>tú</b><a>x</a><a>w</a><a href="/privacidad" target="_blank" rel="noopener">y</a>' +
      '<span class="btn-sub">z</span>di',
  );
});
