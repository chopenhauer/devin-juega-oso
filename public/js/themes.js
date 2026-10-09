// Visual themes (skins). They only change avatars, icons, colours and background;
// the rules never change. Every theme offers the same number of avatars so a
// player keeps the same slot when switching.
export const THEMES = {
  classic: {
    label: 'Clásico',
    icon: '🐻',
    avatars: ['🐻', '🐼', '🐻‍❄️', '🧸', '🦊', '🐯', '🦁', '🐸', '🐵', '🐨', '🐧', '🦄'],
    decor: [],
    confetti: ['#38b6ff', '#ff5d8f', '#ffd23f', '#7dffb2', '#b388ff', '#ff9f1c'],
  },
  halloween: {
    label: 'Halloween',
    when: { month: 10, day: 31 },
    icon: '🎃',
    avatars: ['🎃', '🧛', '👻', '🧙', '🦇', '💀', '🕷️', '🧟', '🐈‍⬛', '🦉', '🍬', '🩸'],
    decor: ['🦇', '🎃', '👻', '🕸️', '🩸', '🦇', '🍬', '💀'],
    confetti: ['#ff8a1f', '#9b5de5', '#7dff6b', '#e63946', '#fff3b0'],
  },
  christmas: {
    label: 'Navidad',
    when: { month: 12, day: 24, days: 2 },
    icon: '⛄',
    avatars: ['⛄', '🎅', '🦌', '🐧', '🥕', '☕', '🎁', '❄️', '🎄', '🍪', '🧦', '🐻‍❄️'],
    decor: ['❄️', '❄️', '❄️', '⛄', '❄️', '🎁', '❄️', '☕', '❄️', '🥕'],
    confetti: ['#e63946', '#2a9d8f', '#ffffff', '#ffd23f', '#8ecae6'],
  },
  newyear: {
    label: 'Año Nuevo',
    icon: '🎆',
    when: { month: 12, day: 31, days: 2 },
    avatars: ['🎆', '🥂', '🍇', '🕛', '🎉', '🥳', '🎇', '✨', '🎊', '🍾', '⏰', '🌟'],
    decor: ['🎆', '✨', '🎇', '🎉', '🍇', '🌟'],
    confetti: ['#ffd23f', '#e8e8f0', '#ff5d8f', '#38b6ff', '#b388ff'],
    bg: ['#3b2a7a', '#7a5a12', '#07061a', '#15103a', '#2a1a52'],
    board: ['#241a55', '#120c30'],
    motion: 'rise',
  },
  kings: {
    label: 'Reyes Magos',
    icon: '👑',
    when: { month: 1, day: 5, days: 2 },
    avatars: ['👑', '🐪', '🎁', '⭐', '🍰', '🌟', '🏰', '💎', '🕯️', '🍬', '🐫', '📜'],
    decor: ['⭐', '👑', '🐪', '🎁', '✨'],
    confetti: ['#ffd23f', '#e63946', '#2a9d8f', '#b388ff', '#ffffff'],
    bg: ['#5a2a8f', '#8f6a12', '#0b0a26', '#1d1450', '#3a1c52'],
    board: ['#2a1a5c', '#140c33'],
    motion: 'fall',
  },
  valentine: {
    label: 'San Valentín',
    icon: '💘',
    when: { month: 2, day: 14 },
    avatars: ['💘', '🌹', '💌', '🧸', '🍫', '🦢', '💖', '💝', '🌷', '🍓', '😍', '🦋'],
    decor: ['💖', '💘', '🌹', '💌', '💕'],
    confetti: ['#ff5d8f', '#e63946', '#ffb3c6', '#ffffff', '#c9184a'],
    bg: ['#a8205a', '#6a1f8f', '#1f0619', '#3a0b2e', '#4a0d24'],
    board: ['#4a1238', '#24081c'],
    motion: 'rise',
  },
  carnival: {
    label: 'Carnaval',
    icon: '🎭',
    when: { easter: -49, days: 3 },
    avatars: ['🎭', '🤡', '🦸', '🧚', '🦹', '🎊', '🪅', '🥁', '🎺', '🦜', '👸', '🤠'],
    decor: ['🎭', '🎊', '🎉', '🪅', '✨'],
    confetti: ['#ff5d8f', '#ffd23f', '#38b6ff', '#7dffb2', '#b388ff', '#ff9f1c'],
    bg: ['#8f1f7a', '#1f6a8f', '#120626', '#2a0c4a', '#3a0c36'],
    board: ['#33124f', '#1a0830'],
    motion: 'fall',
  },
  stpatrick: {
    label: 'San Patricio',
    icon: '☘️',
    when: { month: 3, day: 17 },
    avatars: ['☘️', '🍀', '🌈', '🪙', '🎩', '🧚', '🐸', '🐑', '🎻', '🦄', '🌿', '💚'],
    decor: ['☘️', '🍀', '🌈', '🪙', '🍀'],
    confetti: ['#2ecc71', '#ffd23f', '#ffffff', '#7dffb2', '#1b9e4b'],
    bg: ['#1f8f4a', '#8f7a12', '#04140c', '#0a2a1a', '#123a22'],
    board: ['#0f3a24', '#071c12'],
    motion: 'fall',
  },
  easter: {
    label: 'Pascua',
    icon: '🐰',
    when: { easter: 0 },
    avatars: ['🐰', '🐣', '🥚', '🧺', '🍫', '🌷', '🐇', '🐥', '🌼', '🦆', '🍬', '🐑'],
    decor: ['🥚', '🐣', '🌷', '🐰', '🌼'],
    confetti: ['#ffd23f', '#ff9fc7', '#9be7ff', '#c1f7a4', '#d6b3ff'],
    bg: ['#6a4fb0', '#2f8f6a', '#0f0f2e', '#1f1f52', '#163a3a'],
    board: ['#2a2a5c', '#141433'],
    motion: 'fall',
  },
  stgeorge: {
    label: 'Sant Jordi',
    icon: '🐉',
    when: { month: 4, day: 23 },
    avatars: ['🐉', '🌹', '📚', '🏰', '🛡️', '👸', '🗡️', '🤴', '📖', '🐲', '🐴', '🎀'],
    decor: ['🌹', '📚', '🌹', '🐉', '📖'],
    confetti: ['#e63946', '#ffd23f', '#2a9d8f', '#ffffff', '#9b2226'],
    bg: ['#9b1d2a', '#2f6a2a', '#14060a', '#2e0c14', '#1a2a14'],
    board: ['#3a1420', '#1c0a10'],
    motion: 'fall',
  },
  stjohn: {
    label: 'San Juan',
    icon: '🔥',
    when: { month: 6, day: 23, days: 2 },
    avatars: ['🔥', '🎆', '🎇', '🌙', '🌊', '✨', '🪵', '🌟', '🧙', '🦉', '🏖️', '🍉'],
    decor: ['🔥', '✨', '🎆', '🎇', '🌟'],
    confetti: ['#ff6a00', '#ffd23f', '#ff5d8f', '#38b6ff', '#ffffff'],
    bg: ['#a8410c', '#1f3a8f', '#070a1f', '#141a3d', '#2a120a'],
    board: ['#1f1a3a', '#0f0c22'],
    motion: 'rise',
  },
  sanfermin: {
    label: 'San Fermín',
    icon: '🐂',
    when: { month: 7, day: 7 },
    avatars: ['🐂', '🧣', '🎉', '🏃', '🔴', '⚪', '🎺', '🥁', '🐮', '🎊', '🏟️', '🍬'],
    decor: ['🧣', '🎉', '🐂', '🎊', '🔴'],
    confetti: ['#e63946', '#ffffff', '#ffd23f', '#9b2226', '#f1faee'],
    bg: ['#b0202a', '#8f6a12', '#1a0608', '#3a0c10', '#2a1408'],
    board: ['#3a1216', '#1c080a'],
    motion: 'fall',
  },
  thanksgiving: {
    label: 'Acción de Gracias',
    icon: '🦃',
    when: { month: 11, weekday: 4, nth: 4 },
    avatars: ['🦃', '🥧', '🌽', '🍁', '🍂', '🥔', '🎃', '🍎', '🥖', '🐿️', '🌰', '🍯'],
    decor: ['🍁', '🍂', '🌽', '🦃', '🍂'],
    confetti: ['#ff9f1c', '#c1440e', '#ffd23f', '#8c5523', '#f4a261'],
    bg: ['#8f3a0c', '#6a4a12', '#1a0c04', '#33180a', '#2a1a08'],
    board: ['#3a200e', '#1c1006'],
    motion: 'fall',
  },
  spring: {
    label: 'Primavera',
    icon: '🌷',
    when: { from: [3, 21], to: [6, 20] },
    avatars: ['🌷', '🦋', '🐝', '🌸', '🐞', '🌱', '🌼', '🐛', '🌺', '🐦', '🌈', '🐌'],
    decor: ['🌸', '🦋', '🌷', '🌼', '🐝'],
    confetti: ['#ff9fc7', '#c1f7a4', '#ffd23f', '#9be7ff', '#d6b3ff'],
    bg: ['#2f8f4a', '#a8407a', '#071a12', '#123a2a', '#1a2a3a'],
    board: ['#163a2c', '#0a1c16'],
    motion: 'fall',
  },
  summer: {
    label: 'Verano',
    icon: '🏖️',
    when: { from: [6, 21], to: [9, 22] },
    avatars: ['🏖️', '🦀', '🐠', '🐬', '🍉', '🍦', '🕶️', '☀️', '🌴', '🐚', '⛱️', '🏄'],
    decor: ['☀️', '🌴', '🐚', '🍉', '🦀'],
    confetti: ['#ffd23f', '#38b6ff', '#ff9f1c', '#7dffb2', '#ff5d8f'],
    bg: ['#1f7aa8', '#a87a12', '#041a2a', '#0a3352', '#0c4a5c'],
    board: ['#0e3a52', '#07202e'],
    motion: 'fall',
  },
  autumn: {
    label: 'Otoño',
    icon: '🍂',
    when: { from: [9, 23], to: [12, 20] },
    avatars: ['🍂', '🦔', '🐿️', '🍄', '🌰', '🦉', '🍁', '🍎', '🦊', '☔', '🎃', '🍇'],
    decor: ['🍂', '🍁', '🍂', '🍄', '🌰'],
    confetti: ['#ff9f1c', '#c1440e', '#ffd23f', '#8c5523', '#e9c46a'],
    bg: ['#8f4a0c', '#5a3a1a', '#140a04', '#2a1608', '#3a200c'],
    board: ['#3a2210', '#1c1008'],
    motion: 'fall',
  },
  africa: {
    label: 'África',
    icon: '🦁',
    avatars: ['🦁', '🐘', '🦒', '🦓', '🦏', '🐊', '🦛', '🐆', '🦩', '🐒', '🌍', '🌵'],
    decor: ['🌿', '🦒', '🌍', '🐘', '🌿'],
    confetti: ['#ff9f1c', '#ffd23f', '#e76f51', '#2a9d8f', '#f4a261'],
    bg: ['#a8520c', '#6a7a12', '#1a0c04', '#3a1a06', '#2a2408'],
    board: ['#3a2410', '#1c1208'],
    motion: 'fall',
  },
  antarctica: {
    label: 'Antártida',
    icon: '🐧',
    avatars: ['🐧', '🦭', '🐋', '🧊', '🏔️', '🛷', '❄️', '🐳', '🐟', '⛷️', '🧤', '🌌'],
    decor: ['❄️', '🧊', '❄️', '🐧', '❄️'],
    confetti: ['#ffffff', '#8ecae6', '#bde0fe', '#a2d2ff', '#48cae4'],
    bg: ['#1f7aa8', '#2a8f7a', '#04121f', '#0a2640', '#123a52'],
    board: ['#123a5c', '#081e30'],
    motion: 'fall',
  },
  atlantis: {
    label: 'Atlántida',
    icon: '🔱',
    avatars: ['🧜', '🐙', '🐚', '🔱', '🏛️', '🐠', '🐡', '🦑', '🐬', '🪸', '💎', '🫧'],
    decor: ['🫧', '🐚', '🫧', '🐠', '🫧'],
    confetti: ['#48cae4', '#7dffb2', '#ffd23f', '#b388ff', '#ffffff'],
    bg: ['#0c7a8f', '#2a4a8f', '#020f1a', '#062a3a', '#0a1f3d'],
    board: ['#0a3346', '#051a24'],
    motion: 'rise',
  },
  space: {
    label: 'Espacio',
    icon: '🚀',
    avatars: ['🚀', '👽', '🪐', '🛸', '👩‍🚀', '🌙', '⭐', '☄️', '🌍', '🛰️', '🌌', '👾'],
    decor: ['⭐', '✨', '🪐', '☄️', '⭐'],
    confetti: ['#b388ff', '#38b6ff', '#ffd23f', '#7dffb2', '#ffffff'],
    bg: ['#3a1f8f', '#0c4a8f', '#03030f', '#0a0a26', '#120a2a'],
    board: ['#16143a', '#0a0a1e'],
    motion: 'fall',
  },
  dinosaurs: {
    label: 'Dinosaurios',
    icon: '🦖',
    avatars: ['🦖', '🦕', '🌋', '🥚', '🌿', '🦴', '🐊', '🦎', '🐢', '🌴', '🪨', '☄️'],
    decor: ['🌿', '🌴', '🦴', '🌿', '🥚'],
    confetti: ['#7dffb2', '#ff9f1c', '#e63946', '#ffd23f', '#2a9d8f'],
    bg: ['#2f6a1f', '#8f2a0c', '#071206', '#12260c', '#1f2a0c'],
    board: ['#1c3312', '#0e1a09'],
    motion: 'fall',
  },
  pirates: {
    label: 'Piratas',
    icon: '🏴‍☠️',
    avatars: ['🏴‍☠️', '🦜', '💰', '🗺️', '⚓', '🦈', '🏝️', '⛵', '💎', '🗡️', '🐙', '🧭'],
    decor: ['🌊', '⚓', '🦜', '💰', '🗺️'],
    confetti: ['#ffd23f', '#e63946', '#ffffff', '#2a9d8f', '#8c5523'],
    bg: ['#1f4a7a', '#7a5a1f', '#040c14', '#0c1f33', '#1a1a0e'],
    board: ['#13283d', '#0a141f'],
    motion: 'fall',
  },
  birthday: {
    label: 'Cumpleaños',
    icon: '🎂',
    avatars: ['🎂', '🎈', '🎁', '🥳', '🎉', '🧁', '🎊', '🍰', '🕯️', '🍭', '🎀', '🪅'],
    decor: ['🎈', '🎉', '🎈', '🎊', '🎁'],
    confetti: ['#ff5d8f', '#ffd23f', '#38b6ff', '#7dffb2', '#b388ff', '#ff9f1c'],
    bg: ['#8f1f6a', '#1f5a8f', '#12061f', '#260c3d', '#1a0c33'],
    board: ['#2e1450', '#170a29'],
    motion: 'rise',
  },
};

export const THEME_IDS = Object.keys(THEMES);
export const themeOf = (id) => THEMES[id] ?? THEMES.classic;

// Carries each player's avatar to the same slot of the new theme. Non-theme
// avatars (the machine's 🤖) are kept; clashes fall back to the first free one.
export function mapAvatars(avatars, from, to) {
  const out = avatars.map((a) => {
    const i = from.avatars.indexOf(a);
    if (i >= 0) return to.avatars[i];
    return to.avatars.includes(a) || a === '🤖' ? a : to.avatars[0];
  });
  if (out[1] === out[0]) out[1] = to.avatars.find((a) => a !== out[0]);
  return out;
}

// DATES: festivals show in the 🎨 menu from a month before to a month after their day and switch on
// by themselves on the day; seasons show while they last; the rest live under «Ver otros».
const DAY = 86400000;
const NEAR_DAYS = 31;
export const MENU_MAX = 5;
export const LIST_MAX = 10;
const utc = (y, m, d) => Date.UTC(y, m - 1, d);
const dayOf = (date) => utc(date.getFullYear(), date.getMonth() + 1, date.getDate());
export const isoDay = (date) => new Date(dayOf(date)).toISOString().slice(0, 10);

// Gregorian Easter Sunday (anonymous algorithm).
export function easterSunday(y) {
  const a = y % 19,
    b = Math.floor(y / 100),
    c = y % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    n = h + l - 7 * m + 114;
  return utc(y, Math.floor(n / 31), (n % 31) + 1);
}

function span(when, y) {
  if (when.from) return [utc(y, ...when.from), utc(y, ...when.to)];
  let start;
  if (when.easter !== undefined) start = easterSunday(y) + when.easter * DAY;
  else if (when.nth) {
    const first = new Date(utc(y, when.month, 1)).getUTCDay();
    start = utc(y, when.month, 1 + ((when.weekday - first + 7) % 7) + 7 * (when.nth - 1));
  } else start = utc(y, when.month, when.day);
  return [start, start + ((when.days ?? 1) - 1) * DAY];
}
const spans = (when, t) => {
  const y = new Date(t).getUTCFullYear();
  return [y - 1, y, y + 1].map((year) => span(when, year));
};
// Days from t to the theme's dates (0 while they last).
const distance = (when, t) =>
  Math.min(...spans(when, t).map(([a, b]) => (t < a ? (a - t) / DAY : t > b ? (t - b) / DAY : 0)));
const daysUntil = (when, t) =>
  Math.min(
    ...spans(when, t)
      .filter(([, b]) => b >= t)
      .map(([a]) => Math.max(0, (a - t) / DAY)),
  );

// The festival whose day it is, if any (seasons never switch on by themselves).
export function festivalOn(date) {
  const t = dayOf(date);
  return (
    THEME_IDS.find((id) => THEMES[id].when && !THEMES[id].when.from && !distance(THEMES[id].when, t)) ?? null
  );
}

// What the 🎨 menu offers on a date: up to MENU_MAX themes (Clásico and the nearby dates), «Ver
// otros» up to LIST_MAX in total, and the rest only through the easter egg. The current theme is
// always reachable without it.
export function themeMenuFor(date, current = 'classic') {
  const t = dayOf(date);
  const dated = THEME_IDS.filter((id) => THEMES[id].when);
  const near = dated
    .filter((id) => distance(THEMES[id].when, t) <= (THEMES[id].when.from ? 0 : NEAR_DAYS))
    .sort((a, b) => {
      const wa = THEMES[a].when,
        wb = THEMES[b].when;
      return !!wa.from - !!wb.from || distance(wa, t) - distance(wb, t);
    });
  const menu = ['classic', ...near].slice(0, MENU_MAX);
  const upcoming = dated
    .filter((id) => !menu.includes(id))
    .sort((a, b) => daysUntil(THEMES[a].when, t) - daysUntil(THEMES[b].when, t));
  const always = THEME_IDS.filter((id) => !THEMES[id].when && id !== 'classic' && id !== 'birthday');
  const pool = ['birthday'];
  for (let i = 0; i < Math.max(upcoming.length, always.length); i++)
    pool.push(...[always[i], upcoming[i]].filter(Boolean));
  let others = pool.slice(0, LIST_MAX - menu.length);
  if (THEMES[current] && !menu.includes(current) && !others.includes(current))
    others = [...others.slice(0, LIST_MAX - menu.length - 1), current];
  const hidden = THEME_IDS.filter((id) => !menu.includes(id) && !others.includes(id));
  return { menu, others, hidden };
}
