// Anonymous gameplay telemetry for Google Analytics. Events only leave the
// device after the visitor accepts analytics in the cookie banner, and never
// carry names, avatars or anything typed by the players.
import { VERSION } from './version.js';
import { GAME } from './config.js';
import { t, LANG, BROWSER_LANG } from './i18n.js';

// Share of games that should end because someone runs out of time; the target
// used later to tune the clock of each board (see docs/ideas/reloj.md).
export const TIMEOUT_TARGET = GAME.telemetry.timeoutTarget;

const CONSENT_KEY = 'oso.consent.v1';
const FEEDBACK_KEY = 'oso.feedback.v1';
// When to ask «¿Os está gustando OSO?» (see feedbackMoment).
export const FEEDBACK_COOLDOWN = GAME.feedback.cooldown;
export const FEEDBACK_STREAK = GAME.feedback.streak;

export const IDEAS_EMAIL = 'hola@juegaoso.com';
export const ideasHref = (subject = t('ideas.subject')) =>
  `mailto:${IDEAS_EMAIL}?subject=${encodeURIComponent(subject)}`;

function consented() {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
  } catch {
    return false;
  }
}

// 'standalone' when OSO was opened from the home screen icon, 'browser' otherwise.
export function displayMode() {
  const installed =
    window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  return installed ? 'standalone' : 'browser';
}

export function track(name, params = {}) {
  if (!consented()) return false;
  window.gtag?.('event', name, {
    ...params,
    app_version: VERSION,
    app_language: LANG,
    browser_language: BROWSER_LANG,
    display_mode: displayMode(),
  });
  return true;
}

const seconds = (s) => Math.round(Math.max(0, s));

// Parameters shared by every game event.
export function gameParams({ size, mode, difficulty, theme = 'classic', themeSource = 'default' }) {
  return {
    board_size: `${size}x${size}`,
    players: mode === 'four' ? 4 : 2,
    mode,
    vs_machine: mode === 'solo',
    difficulty: mode === 'solo' ? difficulty : 'none',
    theme,
    theme_source: themeSource,
  };
}

// The four extras, in the order of the buttons (`extra_used`, `extras_*` in `game_end`).
export const EXTRAS = ['hint', 'last', 'swap', 'sos'];

// `game_end`: how the game finished, how much clock each player used and how many
// times each extra was used on this device (`extras_hint`, `extras_last`, ...).
export function gameEndParams({
  size,
  mode,
  difficulty,
  theme,
  themeSource,
  reason,
  winner,
  scores,
  available,
  times,
  filled,
  extras = {},
}) {
  const left = times.map(seconds);
  const used = times.map((t) => seconds(available - t));
  const params = {
    ...gameParams({ size, mode, difficulty, theme, themeSource }),
    end_reason: reason === 'tiempo' ? 'timeout' : 'board_full',
    result: winner === null ? 'draw' : mode === 'solo' && winner === 1 ? 'machine' : 'player',
    time_available: seconds(available),
    time_used_max: Math.max(...used),
    time_left_min: Math.min(...left),
    cells_filled: filled,
    cells_total: size * size,
    score_total: scores.reduce((a, b) => a + b, 0),
  };
  left.forEach((t, i) => (params[`time_left_p${i + 1}`] = t));
  for (const e of EXTRAS) params[`extras_${e}`] = extras[e] ?? 0;
  return params;
}

const minor = (version) => version.split('.').slice(0, 2).join('.');

// Picks a good moment for the 👍/👎 question, or null. `state.games` already
// counts the game that just finished; `sessionGames` counts the games in a row
// between the same players. Never right after the machine wins, never twice
// within FEEDBACK_COOLDOWN games, and once answered not again until the next
// minor version.
export function feedbackMoment({ state, version, mode, winner, sessionGames }) {
  if (state.answered && minor(state.answered) === minor(version)) return null;
  if (mode === 'solo' && winner === 1) return null;
  if (state.lastAsk && state.games - state.lastAsk < FEEDBACK_COOLDOWN) return null;
  if (state.games === 1) return 'first_game';
  if (mode === 'solo' && winner === 0) return 'beat_machine';
  if (sessionGames > 0 && sessionGames % FEEDBACK_STREAK === 0) return 'streak';
  return null;
}

function readFeedback() {
  try {
    return { games: 0, lastAsk: 0, answered: null, ...JSON.parse(localStorage.getItem(FEEDBACK_KEY)) };
  } catch {
    return { games: 0, lastAsk: 0, answered: null };
  }
}
function saveFeedback(state) {
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// Counts a finished game and returns the moment to ask for feedback, if any.
// `quiet`: something else is on the end screen (a secret), so the question waits for another game.
export function nextFeedback({ mode, winner, sessionGames, quiet = false }) {
  const state = readFeedback();
  state.games += 1;
  const moment = quiet ? null : feedbackMoment({ state, version: VERSION, mode, winner, sessionGames });
  if (moment) state.lastAsk = state.games;
  return saveFeedback(state) ? moment : null;
}

export function answerFeedback() {
  saveFeedback({ ...readFeedback(), answered: VERSION });
}
