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
    icon: '🎃',
    avatars: ['🎃', '🧛', '👻', '🧙', '🦇', '💀', '🕷️', '🧟', '🐈‍⬛', '🦉', '🍬', '🩸'],
    decor: ['🦇', '🎃', '👻', '🕸️', '🩸', '🦇', '🍬', '💀'],
    confetti: ['#ff8a1f', '#9b5de5', '#7dff6b', '#e63946', '#fff3b0'],
  },
  christmas: {
    label: 'Navidad',
    icon: '⛄',
    avatars: ['⛄', '🎅', '🦌', '🐧', '🥕', '☕', '🎁', '❄️', '🎄', '🍪', '🧦', '🐻‍❄️'],
    decor: ['❄️', '❄️', '❄️', '⛄', '❄️', '🎁', '❄️', '☕', '❄️', '🥕'],
    confetti: ['#e63946', '#2a9d8f', '#ffffff', '#ffd23f', '#8ecae6'],
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
