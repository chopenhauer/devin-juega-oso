// Vercel Web Analytics: page views without cookies, so it also sees the visits that reject them
// (GA4 only sees those that accept). Production only, like ga.js.
(function (w, d) {
  if (!/^(juegaoso\.com|www\.juegaoso\.com|devin-juega-oso\.vercel\.app)$/.test(w.location.hostname)) return;
  w.va =
    w.va ||
    function () {
      (w.vaq = w.vaq || []).push(arguments);
    };
  const s = d.createElement('script');
  s.defer = true;
  s.src = '/_vercel/insights/script.js';
  d.head.appendChild(s);
})(window, document);
