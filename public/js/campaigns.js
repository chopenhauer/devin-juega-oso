// Where a visit came from (docs/ANALYTICS.md, «Llegadas»): the campaign and source of the link, the
// search engine, or our rules page. Shared by the page (visit.js, guide.js) and the server
// (api/_visita.js), which only counts the values listed here. Never the whole URL.
// Our own links (share.js, online.js, push) and the ones used outside the game; unknown → `otra`.
export const CAMPAIGNS = [
  'boca_oreja',
  'reto',
  'reto_del_dia',
  'en_linea',
  'racha',
  'como_jugar',
  'buscador',
  'qr',
  'cartel',
  'play',
  'profes',
  'anuncio',
  'otra',
];
export const SOURCES = ['native', 'whatsapp', 'email', 'copy', 'image', 'push', 'qr', 'play', 'web', 'otra'];
// Campaigns of links someone shared from the game: what brings new players by word of mouth.
export const SHARED = ['boca_oreja', 'reto', 'reto_del_dia', 'en_linea', 'racha'];
const SEARCH = /^https?:\/\/([^/]+\.)?(google|bing|duckduckgo|ecosia|yahoo|qwant)\./;

export function origin(search = '', referrer = '') {
  const params = new URLSearchParams(search);
  if (params.get('desde') === 'como-jugar') return { campaign: 'como_jugar', source: 'web' };
  const campaign = params.get('utm_campaign');
  if (campaign) {
    const source = params.get('utm_source');
    return {
      campaign: CAMPAIGNS.includes(campaign) ? campaign : 'otra',
      source: SOURCES.includes(source) ? source : 'otra',
    };
  }
  return SEARCH.test(referrer) ? { campaign: 'buscador' } : {};
}

// The first visit on this device: no setup choices saved yet (onboarding.js `oso.prefs.v1`).
export function fresh(storage = globalThis.localStorage) {
  try {
    return !storage.getItem('oso.prefs.v1');
  } catch {
    return false;
  }
}
