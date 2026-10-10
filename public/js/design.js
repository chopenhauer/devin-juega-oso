// Living style guide (/design): reads every token from tokens.css, so it always
// matches the game. Not published in production (see vercel.json buildCommand).
import { THEMES, THEME_IDS, themeTokens } from './themes.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};
const isColour = (v) => /^(#|rgba?\()/.test(v);
const sheet = [...document.styleSheets].find((s) => s.href?.endsWith('/css/tokens.css'));
const layers = [...sheet.cssRules]
  .filter((r) => r.selectorText === ':root' || r.selectorText === ':root, body')
  .map((r) => [...r.style].filter((p) => p.startsWith('--')));
const [primitives, semantic, components, aliases] = layers;
const valueOf = (n) => getComputedStyle(document.body).getPropertyValue(n).trim();

function sample(n) {
  const raw = sheet.cssRules[0].style.getPropertyValue(n).trim();
  if (/^--(fs|font)/.test(n)) {
    const t = el('div', 'ds-text', 'Aa OSO 🐻');
    t.style.font = `var(--fw-bold) var(${n.startsWith('--fs') ? n : '--fs-2xl'}) var(--font-family)`;
    return t;
  }
  if (n.startsWith('--space')) {
    const b = el('div', 'ds-bar');
    b.style.width = `var(${n})`;
    return b;
  }
  const s = el('div', 'ds-sample');
  if (n.startsWith('--r-')) {
    s.style.borderRadius = `var(${n})`;
    s.style.background = 'var(--color-surface-strong)';
  } else if (/^--(relief|shadow|glow)/.test(n)) {
    s.style.boxShadow = `var(${n})`;
    s.style.background = 'var(--color-surface-strong)';
  } else if (/-bg$|scene/.test(n) || isColour(raw) || n.startsWith('--color')) {
    s.style.background = `var(${n})`;
  } else return null;
  return s;
}

function group(title, names) {
  const sec = el('section');
  sec.append(el('h3', '', `${title} (${names.length})`));
  const grid = el('div', 'ds-grid');
  for (const n of names) {
    const item = el('div', 'ds-item ds-swatch');
    item.dataset.token = n;
    const s = sample(n);
    if (s) item.append(s);
    item.append(el('strong', '', n), el('code', 'ds-value', valueOf(n)));
    grid.append(item);
  }
  sec.append(grid);
  return sec;
}

function render() {
  const by = (re) => primitives.filter((n) => re.test(n));
  const root = document.getElementById('dsTokens');
  const h = (t) => el('h2', '', t);
  root.replaceChildren(
    h('Semánticos: lo que cambian los temas'),
    group('Colores con significado', semantic),
    h('Componentes'),
    group('Decisiones de cada pieza', components),
    h('Primitivos'),
    group('Paleta', by(/^--(?!fs|fw|font|space|r-|dur|ease|z-)/)),
    group('Tipografía', by(/^--(fs|fw|font)/)),
    group('Espacios', by(/^--space/)),
    group('Radios', by(/^--r-/)),
    group('Animación', by(/^--(dur|ease)/)),
    group('Capas', by(/^--z-/)),
    group('Alias de compatibilidad', aliases),
  );
}

let applied = [];
function applyTheme(id) {
  const t = THEMES[id];
  applied.forEach((k) => document.body.style.removeProperty(k));
  const tokens = themeTokens(t);
  applied = Object.keys(tokens);
  applied.forEach((k) => document.body.style.setProperty(k, tokens[k]));
  document.body.dataset.theme = id;
  document.querySelectorAll('.ds-swatch').forEach((i) => {
    i.querySelector('.ds-value').textContent = valueOf(i.dataset.token);
  });
}

const select = document.getElementById('dsTheme');
for (const id of THEME_IDS) select.append(new Option(`${THEMES[id].icon} ${THEMES[id].label}`, id));
select.addEventListener('change', () => applyTheme(select.value));
render();
