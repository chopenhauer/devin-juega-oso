// The online funnel and health from the server's anonymous counters (docs/ONLINE.md).
// Usage: npm run online:report [-- https://juegaoso.com]
const base = process.argv[2] ?? 'https://juegaoso.com';
const { month, counters: c } = await (await fetch(`${base}/api/sala?stats=1`)).json();
const n = (k) => c[k] ?? 0;
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : '—');
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
];
console.log(`Contadores del servidor · ${month}\n`);
for (const [label, value, extra] of rows)
  console.log(`${label.padEnd(36)} ${String(value).padStart(5)}  ${extra}`);
const ms = n('timed') ? Math.round(n('ms') / n('timed')) : 0;
console.log(
  `\nErrores 5xx: ${n('e5xx')} de ${n('requests')} peticiones (${pct(n('e5xx'), n('requests'))}) · función media ${ms} ms`,
);
