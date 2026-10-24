// Anonymous visit counter (/api/visita), without cookies. GA4 only sees the visits that accept
// analytics, so these monthly counters are the denominator for the share it misses
// (docs/ANALYTICS.md). They go in the same `stats:YYYY-MM` hash as the online counters.
//   POST {consent: granted | denied | unset}  the game page loaded, with the stored choice
//   POST {choice: granted | denied}           Aceptar / Rechazar clicked in the cookie banner
//   POST {step, entry}                        a setup screen seen before the first game (funnel.js)
import { month, STATS_TTL } from './_sala.js';

const CHOICES = ['granted', 'denied'];
const ENTRIES = ['first', 'return', 'challenge', 'daily'];
const STEP = /^(welcome|rules_[1-9]|mode|where|players|view|board|start)$/;

export function createVisitHandler(store, { now = Date.now } = {}) {
  return async function handle(request) {
    if (request.method !== 'POST') return new Response(null, { status: 405 });
    const input = await request.json().catch(() => null);
    let stats;
    if ([...CHOICES, 'unset'].includes(input?.consent)) stats = { visits: 1, [`visit_${input.consent}`]: 1 };
    else if (CHOICES.includes(input?.choice)) stats = { [`consent_${input.choice}`]: 1 };
    else if (STEP.test(input?.step) && ENTRIES.includes(input?.entry))
      stats = { [`setup_${input.entry}_${input.step}`]: 1 };
    else return new Response(null, { status: 400 });
    await store.count(month(now()), { ...stats, redis_cmds: 1 }, STATS_TTL).catch((e) => console.error(e));
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  };
}
