// /como-jugar: counts the visit with no cookies (api/_visita.js) and where it came from (campaigns.js).
import { origin } from './campaigns.js';
import { swallowed } from './report.js';

try {
  const data = { page: 'como_jugar', ...origin(location.search, document.referrer) };
  navigator.sendBeacon?.('/api/visita', JSON.stringify(data));
} catch (e) {
  swallowed('guide.count', e);
}

// The rule demos move only while on screen, like the visible card in the onboarding.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('playing', e.isIntersecting);
  });
  for (const card of document.querySelectorAll('.guide .rule-slide')) io.observe(card);
}
