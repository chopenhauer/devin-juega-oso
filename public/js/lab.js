// Julia's lab (/lab): log in, try values with the simulator and save them for everyone
// with a note (api/_lab.js). An internal tool like /design, so its texts live here.
import { HELP } from './config.js';
import { simulate } from './lab-sim.js';

const $ = (id) => document.getElementById(id);
const NAMES = {
  'machine.easyAim': 'Máquina en Fácil: cuántos OSO a mano aprovecha',
  'machine.hardAim': 'Máquina en Difícil: cuántos OSO a mano aprovecha',
  'machine.pool': 'Máquina: entre cuántas jugadas tranquilas elige',
};
const nameOf = (path) =>
  NAMES[path] ?? `Reloj del ${path.split('.').pop()}×${path.split('.').pop()} (segundos)`;
const helpOf = (path) => HELP[path.startsWith('board.seconds') ? 'board.seconds' : path] ?? '';
const show = (path, v) => (path.includes('Aim') ? `${Math.round(v * 100)} %` : String(v));
let lab = null;
const trying = {};

async function api(body, url = '/api/lab') {
  const r = await fetch(
    url,
    body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {},
  );
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

function renderParams() {
  $('labParams').replaceChildren(
    ...Object.entries(lab.tunable).map(([path, r]) => {
      const box = document.createElement('div');
      box.className = 'lab-param';
      const label = document.createElement('label');
      label.htmlFor = `p-${path}`;
      label.textContent = nameOf(path);
      const input = Object.assign(document.createElement('input'), {
        type: 'range',
        id: `p-${path}`,
        min: r.min,
        max: r.max,
        step: r.step,
        value: trying[path] ?? lab.values[path],
      });
      const out = document.createElement('output');
      const small = document.createElement('small');
      const paint = () => {
        const v = Number(input.value);
        out.textContent = `${show(path, v)}${v !== lab.values[path] ? ` (ahora ${show(path, lab.values[path])})` : ''} · de fábrica ${show(path, lab.defaults[path])}`;
      };
      input.addEventListener('input', () => {
        trying[path] = Number(input.value);
        paint();
      });
      paint();
      small.textContent = helpOf(path);
      box.append(label, input, out, small);
      return box;
    }),
  );
}

const pick = (values) => ({
  easyAim: values['machine.easyAim'],
  hardAim: values['machine.hardAim'],
  pool: values['machine.pool'],
});
function renderChart() {
  const now = simulate({ machine: pick(lab.values), games: 150 });
  const next = simulate({ machine: pick({ ...lab.values, ...trying }), games: 150 });
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 300 170');
  svg.setAttribute('role', 'img');
  const add = (tag, attrs, text) => {
    const e = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    if (text) e.textContent = text;
    svg.append(e);
  };
  const said = [];
  now.forEach((r, i) => {
    const x = 20 + i * 95;
    for (const [j, share, cls] of [
      [0, r.playerShare, 'now'],
      [1, next[i].playerShare, 'try'],
    ]) {
      const h = Math.round(share * 120);
      add('rect', { x: x + j * 32, y: 135 - h, width: 28, height: h, class: cls });
      add('text', { x: x + j * 32 + 2, y: 130 - h }, `${Math.round(share * 100)} %`);
    }
    add('text', { x, y: 155 }, `Ve el ${Math.round(r.skill * 100)} %`);
    said.push(
      `viendo el ${Math.round(r.skill * 100)} %, gana el ${Math.round(r.playerShare * 100)} % ahora y el ${Math.round(next[i].playerShare * 100)} % con lo que pruebas`,
    );
  });
  svg.setAttribute('aria-label', `El jugador de práctica, ${said.join('; ')}.`);
  $('labChart').replaceChildren(svg);
}

function renderNotes() {
  $('labNotes').replaceChildren(
    ...lab.notes.map((n) => {
      const li = document.createElement('li');
      const what = n.changes
        .map((c) => `${nameOf(c.path)}: ${show(c.path, c.from)} → ${show(c.path, c.to)}`)
        .join(' · ');
      const kind =
        n.kind === 'undo'
          ? `Deshace el cambio n.º ${n.undoes}. `
          : n.kind === 'reset'
            ? 'Valores de fábrica. '
            : '';
      li.append(
        Object.assign(document.createElement('strong'), {
          textContent: `n.º ${n.version} · ${new Date(n.at).toLocaleString('es-ES')}`,
        }),
        document.createElement('br'),
        `${kind}${what}`,
      );
      if (n.note)
        li.append(
          document.createElement('br'),
          Object.assign(document.createElement('small'), { textContent: `«${n.note}»` }),
        );
      if (n.kind === 'set') {
        const undo = Object.assign(document.createElement('button'), {
          type: 'button',
          className: 'secondary',
          textContent: '↩️ Volver al valor anterior',
        });
        undo.addEventListener('click', () =>
          save({ action: 'undo', version: n.version, note: $('labNote').value }),
        );
        li.append(document.createElement('br'), undo);
      }
      return li;
    }),
  );
}

function render(data) {
  lab = data;
  Object.keys(trying).forEach((k) => delete trying[k]);
  $('labLogin').classList.add('hidden');
  $('labPanel').classList.remove('hidden');
  renderParams();
  renderNotes();
  renderChart();
  renderData();
}

const DIFFICULTIES = { easy: 'Fácil', hard: 'Difícil', extreme: 'Extremo' };
const pct = (part, all) => (all ? `${Math.round((part / all) * 100)} %` : '—');

// GA4 rows -> one table per lab version: wins per difficulty and games that ended on time.
async function renderData() {
  const box = $('labData');
  const r = await api(undefined, '/api/lab-data');
  if (r.status !== 200) return (box.textContent = 'Ahora no se pueden traer los datos de Google Analytics.');
  const byVersion = Map.groupBy(r.body.rows, (row) =>
    row.lab_version === '(not set)' ? '0' : row.lab_version,
  );
  const versions = [...byVersion.keys()].sort((a, b) => Number(b) - Number(a));
  if (!versions.length) return (box.textContent = 'Todavía no hay partidas.');
  box.replaceChildren(
    ...versions.map((v) => {
      const rows = byVersion.get(v);
      const sum = (f) => rows.filter(f).reduce((n, row) => n + row.games, 0);
      const table = document.createElement('table');
      const head = v === '0' ? 'Valores de fábrica' : `Desde el guardado n.º ${v}`;
      const row = (tag, ...c) => {
        const tr = document.createElement('tr');
        tr.append(...c.map((x) => Object.assign(document.createElement(tag), { textContent: x })));
        return tr;
      };
      const caption = document.createElement('caption');
      caption.textContent = `${head} · ${sum(() => true)} partidas`;
      table.append(
        caption,
        row('th', 'Contra la máquina', 'Partidas', 'Gana la persona', 'Gana la máquina'),
        ...Object.entries(DIFFICULTIES).map(([d, name]) => {
          const all = sum((g) => g.difficulty === d);
          return row(
            'td',
            name,
            all,
            pct(
              sum((g) => g.difficulty === d && g.result === 'player'),
              all,
            ),
            pct(
              sum((g) => g.difficulty === d && g.result === 'machine'),
              all,
            ),
          );
        }),
      );
      const timeouts = document.createElement('p');
      const all = sum(() => true);
      timeouts.textContent = `Acaban por tiempo: ${pct(
        sum((row) => row.end_reason === 'timeout'),
        all,
      )} (${sum((row) => row.end_reason === 'timeout')} de ${all}).`;
      const block = document.createElement('div');
      block.append(table, timeouts);
      return block;
    }),
  );
}

async function save(body) {
  const r = await api(body);
  const ERRORS = {
    nothing: 'No has cambiado ningún valor.',
    invalid: 'Ese valor no vale (¿Fácil por encima de Difícil?).',
    stale: 'Alguien guardó a la vez: prueba otra vez.',
  };
  if (r.status !== 200)
    return ($('labStatus').textContent = ERRORS[r.body.error] ?? 'No se ha podido guardar.');
  $('labNote').value = '';
  render(r.body);
  $('labStatus').textContent = `✅ Guardado como n.º ${r.body.version}: ya se aplica en el juego.`;
}

$('labLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const r = await api({ action: 'login', password: $('labPassword').value });
  if (r.status !== 200)
    return ($('labLoginError').textContent =
      r.status === 429 ? 'Demasiados intentos: espera un rato.' : 'Contraseña incorrecta.');
  const data = await api();
  if (data.status === 200) render(data.body);
});
$('labSimulate').addEventListener('click', renderChart);
$('labSave').addEventListener('click', () =>
  save({ action: 'set', values: { ...trying }, note: $('labNote').value }),
);
$('labReset').addEventListener('click', () => save({ action: 'reset', note: $('labNote').value }));

const first = await api();
if (first.status === 200) render(first.body);
