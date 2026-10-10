// Google Analytics 4 tag (G-8ZJ4B238C4) with Consent Mode v2. Kept as an
// external file so the CSP does not need to allow inline scripts. Analytics
// stays denied (cookieless pings only) until the visitor accepts in the
// consent banner (consent.js); ads are always denied.
(function (w, d, id) {
  // Only production reports analytics; Vercel previews do not (local tests stub the network).
  if (
    !/^(juegaoso\.com|www\.juegaoso\.com|devin-juega-oso\.vercel\.app|localhost|127\.0\.0\.1)$/.test(
      w.location.hostname,
    )
  )
    return;
  let granted = false;
  try {
    granted = localStorage.getItem('oso.consent.v1') === 'granted';
  } catch {
    /* storage unavailable: keep denied */
  }
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () {
    w.dataLayer.push(arguments);
  };
  w.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
  });
  w.gtag('js', new Date());
  w.gtag('config', id);
  const s = d.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  d.head.appendChild(s);
})(window, document, 'G-8ZJ4B238C4');
