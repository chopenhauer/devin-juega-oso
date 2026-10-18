// Secrets: hidden features told one by one as a reward for coming back to play (docs/ideas/secretos-y-regalos.md).
// Every GAMES_PER_SECRET finished games (any mode, any result) one more is due, at most one a day.
// They are told in the order of SECRETS, so new ones go at the end. `how` says how to trigger it,
// never what happens; `hint` is the short reminder shown later under «Ya sabías…». `cta` is the
// button that takes you where it is used: `go` 'home' (the 🎨 step) or 'play' (a game with extras).
import { GAME } from './config.js';
import { t } from './i18n.js';

const seconds = (ms) => t('secrets.seconds', { count: ms / 1000, n: (ms / 1000).toLocaleString('es') });

export const SECRETS = [
  {
    id: 'temas',
    hint: t('secrets.temas.hint'),
    how: t('secrets.temas.how', { seconds: seconds(GAME.themes.eggHoldMs) }),
    cta: { label: t('secrets.temas.cta'), go: 'home' },
  },
  {
    id: 'tienda',
    hint: t('secrets.tienda.hint'),
    how: t('secrets.tienda.how', { seconds: seconds(GAME.shop.holdMs) }),
    cta: { label: t('startGame'), go: 'play' },
  },
];
export const GAMES_PER_SECRET = GAME.secrets.gamesPerSecret;

const KEY = 'oso.secretos.v1';
// Games finished before secrets existed, counted by the feedback question.
const FEEDBACK_KEY = 'oso.feedback.v1';

// The next secret to tell, or null: not enough games yet, one already told today, or none left.
export function nextSecret(state, today, list = SECRETS) {
  if (state.day === today) return null;
  if (state.played < GAMES_PER_SECRET * (state.told.length + 1)) return null;
  return list.find((s) => !state.told.includes(s.id)) ?? null;
}

// Secrets told before, oldest first, for «Ya sabías…».
export const knownSecrets = (state, except, list = SECRETS) =>
  list.filter((s) => s.id !== except && state.told.includes(s.id));

export function readSecrets() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) return { played: 0, told: [], day: null, ...saved };
    const before = JSON.parse(localStorage.getItem(FEEDBACK_KEY))?.games;
    return { played: Number.isInteger(before) ? before : 0, told: [], day: null };
  } catch {
    return { played: 0, told: [], day: null };
  }
}
function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: secrets just wait */
  }
  return state;
}
// Call once at start-up so the feedback count is taken before it grows.
export const initSecrets = () => save(readSecrets());
export const countGame = () => {
  const state = readSecrets();
  return save({ ...state, played: state.played + 1 });
};
export function tellSecret(id, today) {
  const state = readSecrets();
  if (state.told.includes(id)) return state;
  return save({ ...state, told: [...state.told, id], day: today });
}
