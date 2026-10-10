// Microsoft Clarity analytics tag (project yuj6hlg34s). Kept as an external
// file so the CSP does not need to allow inline scripts. Only loaded once the
// visitor accepts analytics cookies in the consent banner (consent.js).
(function (w, d, id) {
  // Only production reports analytics; Vercel previews do not (local tests stub the network).
  if (
    !/^(juegaoso\.com|www\.juegaoso\.com|devin-juega-oso\.vercel\.app|localhost|127\.0\.0\.1)$/.test(
      w.location.hostname,
    )
  )
    return;
  let loaded = false;
  function load() {
    if (loaded) return;
    loaded = true;
    w.clarity =
      w.clarity ||
      function () {
        (w.clarity.q = w.clarity.q || []).push(arguments);
      };
    const t = d.createElement('script');
    t.async = true;
    t.src = 'https://www.clarity.ms/tag/' + id;
    d.head.appendChild(t);
    w.clarity('consent');
  }
  try {
    if (localStorage.getItem('oso.consent.v1') === 'granted') load();
  } catch {
    /* storage unavailable: wait for an explicit choice */
  }
  w.addEventListener('oso:consent', (e) => {
    if (e.detail === 'granted') load();
    else if (loaded) w.clarity('consent', false);
  });
})(window, document, 'yuj6hlg34s');
