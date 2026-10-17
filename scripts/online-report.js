// The online funnel and health from the server's anonymous counters (docs/ONLINE.md).
// Usage: npm run online:report [-- https://juegaoso.com]
const base = process.argv[2] ?? 'https://juegaoso.com';
const { month, counters: c } = await (await fetch(`${base}/api/sala?stats=1`)).json();
const n = (k) => c[k] ?? 0;
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : '—');
const USED = ['power_hint', 'power_last', 'power_swap', 'power_sos'];
const BOUGHT = ['buy_hint', 'buy_swap', 'buy_sos'];
const sum = (keys) => keys.reduce((a, k) => a + n(k), 0);
const rows = [
  ['Salas creadas', n('created'), ''],
  ['Enlace enviado (WhatsApp / copiar)', n('invited'), `${n('invite_whatsapp')} / ${n('invite_copy')}`],
  ['Enlace abierto', n('opened'), `${n('open_late')} tarde, ${n('open_full')} con la sala llena`],
  [
    'Invitado dentro',
    n('joined'),
    n('join_wait_s') ? `espera media ${Math.round(n('join_wait_s') / n('joined'))} s` : '',
  ],
  ['Partidas empezadas', n('started'), `${n('rematches')} revanchas`],
  ['Partidas terminadas', n('finished'), `${pct(n('finished'), n('started'))} de las empezadas`],
  ['Salas caducadas sin empezar', n('expired'), ''],
  ['Extras usados (💡 / 👁️ / 🔄 / 🛟)', sum(USED), USED.map(n).join(' / ')],
  ['Extras comprados (💡 / 🔄 / 🛟)', sum(BOUGHT), BOUGHT.map(n).join(' / ')],
];
console.log(`Contadores del servidor · ${month}\n`);
for (const [label, value, extra] of rows)
  console.log(`${label.padEnd(36)} ${String(value).padStart(5)}  ${extra}`);
const ms = n('timed') ? Math.round(n('ms') / n('timed')) : 0;
console.log(
  `\nErrores 5xx: ${n('e5xx')} de ${n('requests')} peticiones (${pct(n('e5xx'), n('requests'))}) · función media ${ms} ms`,
);

const seen = n('visits');
const hidden = n('visit_denied') + n('visit_unset');
const chosen = n('consent_granted') + n('consent_denied');
console.log(`\nVisitas al juego (sin cookies, desde la 3.13.1)\n`);
for (const [label, value, extra] of [
  ['Cargas de la página', seen, ''],
  ['Con la analítica aceptada', n('visit_granted'), pct(n('visit_granted'), seen)],
  ['Con la analítica rechazada', n('visit_denied'), pct(n('visit_denied'), seen)],
  ['Sin decidir todavía', n('visit_unset'), pct(n('visit_unset'), seen)],
  ['Ocultas para GA4', hidden, pct(hidden, seen)],
  [
    'Aviso: Aceptar / Rechazar',
    chosen,
    `${n('consent_granted')} / ${n('consent_denied')}, rechaza ${pct(n('consent_denied'), chosen)}`,
  ],
])
  console.log(`${label.padEnd(36)} ${String(value).padStart(5)}  ${extra}`);

// Setup funnel (docs/ideas/llegar-a-jugar.md): screens seen before the first game, since 3.17.0.
const STEPS = [
  'welcome',
  'rules_1',
  'rules_2',
  'rules_3',
  'rules_4',
  'mode',
  'where',
  'players',
  'view',
  'board',
  'start',
];
const ENTRIES = [
  ['first', 'Primera visita (con la bienvenida)'],
  ['return', 'Vuelve (empieza en el modo)'],
  ['challenge', 'Enlace de reto'],
];
for (const [entry, title] of ENTRIES) {
  const counts = STEPS.map((step) => [step, n(`setup_${entry}_${step}`)]).filter(([, v]) => v);
  if (!counts.length) continue;
  const top = Math.max(...counts.map(([, v]) => v));
  console.log(`\nBienvenida · ${title}\n`);
  for (const [step, value] of counts)
    console.log(`${step.padEnd(36)} ${String(value).padStart(5)}  ${pct(value, top)}`);
}
