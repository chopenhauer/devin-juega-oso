// Anonymous visit counter (/api/visita), without cookies. GA4 only sees the visits that accept
// analytics, so these monthly counters are the denominator for the share it misses
// (docs/ANALYTICS.md). They go in the same `stats:YYYY-MM` hash as the online counters.
//   POST {consent: granted | denied | unset}  the game page loaded, with the stored choice
//   POST {choice: granted | denied}           Aceptar / Rechazar clicked in the cookie banner
//   POST {step, entry}                        a setup screen seen before the first game (funnel.js)
//   POST {push: click}                        a 🔔 reto notice was tapped (sw.js)
//   POST {share: channel, place}              someone shared the game (app.js), with or without consent
//   POST {page: como_jugar}                   the rules page /como-jugar was opened (guide.js)
// A page load may also say where it came from: `campaign` and `source` (utm_* of the link, or
// `buscador` from a search engine) and `fresh` (first time on this device). Only known values count.
import { month, STATS_TTL } from './_sala.js';
import { CAMPAIGNS, SOURCES } from '../public/js/campaigns.js';

const CHOICES = ['granted', 'denied'];
const ENTRIES = ['first', 'return', 'challenge', 'daily'];
const STEP = /^(daily|welcome|rules_[1-9]|mode|where|players|view|board|start)$/;
const SHARE_CHANNELS = ['native', 'whatsapp', 'email', 'copy', 'image'];
const SHARE_PLACES = ['start', 'end', 'menu', 'streak'];
const PAGES = ['como_jugar'];

// Where a page load came from: arrive_<campaign>, arrive_<campaign>_new the first time on the
// device, and arrive_src_<source>.
function arrival({ campaign, source, fresh }) {
  if (!CAMPAIGNS.includes(campaign)) return {};
  const stats = { [`arrive_${campaign}`]: 1 };
  if (fresh === true) stats[`arrive_${campaign}_new`] = 1;
  if (SOURCES.includes(source)) stats[`arrive_src_${source}`] = 1;
  return stats;
}

export function createVisitHandler(store, { now = Date.now } = {}) {
  return async function handle(request) {
    if (request.method !== 'POST') return new Response(null, { status: 405 });
    const input = await request.json().catch(() => null);
    let stats;
    if ([...CHOICES, 'unset'].includes(input?.consent)) {
      stats = { visits: 1, [`visit_${input.consent}`]: 1, ...arrival(input) };
      if (input.fresh === true) stats.visits_new = 1;
    } else if (CHOICES.includes(input?.choice)) stats = { [`consent_${input.choice}`]: 1 };
    else if (input?.push === 'click') stats = { push_click: 1 };
    else if (SHARE_CHANNELS.includes(input?.share) && SHARE_PLACES.includes(input?.place))
      stats = { shares: 1, [`share_${input.share}_${input.place}`]: 1 };
    else if (PAGES.includes(input?.page)) stats = { [`page_${input.page}`]: 1, ...arrival(input) };
    else if (STEP.test(input?.step) && ENTRIES.includes(input?.entry))
      stats = { [`setup_${input.entry}_${input.step}`]: 1 };
    else return new Response(null, { status: 400 });
    await store.count(month(now()), { ...stats, redis_cmds: 1 }, STATS_TTL).catch((e) => console.error(e));
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  };
}
