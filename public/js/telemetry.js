// Anonymous gameplay telemetry for Google Analytics. Events only leave the
// device after the visitor accepts analytics in the cookie banner, and never
// carry names, avatars or anything typed by the players.
import { VERSION } from './version.js';

// Share of games that should end because someone runs out of time; the target
// used later to tune the clock of each board (see docs/ROADMAP.md).
export const TIMEOUT_TARGET = 0.5;

const CONSENT_KEY = 'oso.consent.v1';
const FEEDBACK_KEY = 'oso.feedback.v1';
// Ask for a 👍/👎 from the third finished game on, once per device.
export const FEEDBACK_AFTER_GAMES = 3;

export const IDEAS_EMAIL = 'hola@juegaoso.com';
export const ideasHref = (subject = 'Ideas para OSO') =>
  `mailto:${IDEAS_EMAIL}?subject=${encodeURIComponent(subject)}`;

function consented() {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
  } catch {
    return false;
  }
}

export function track(name, params = {}) {
  if (!consented()) return false;
  window.gtag?.('event', name, { ...params, app_version: VERSION });
  return true;
}

const seconds = (s) => Math.round(Math.max(0, s));

// Parameters shared by every game event.
export function gameParams({ size, mode, difficulty }) {
  return {
    board_size: `${size}x${size}`,
    players: mode === 'four' ? 4 : 2,
    mode,
    vs_machine: mode === 'solo',
    difficulty: mode === 'solo' ? difficulty : 'none',
  };
}

// `game_end`: how the game finished and how much clock each player used.
export function gameEndParams({ size, mode, difficulty, reason, winner, scores, available, times, filled }) {
  const left = times.map(seconds);
  const used = times.map((t) => seconds(available - t));
  const params = {
    ...gameParams({ size, mode, difficulty }),
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
  return params;
}

function readFeedback() {
  try {
    return { games: 0, asked: false, ...JSON.parse(localStorage.getItem(FEEDBACK_KEY)) };
  } catch {
    return { games: 0, asked: false };
  }
}

// Counts a finished game and says whether to show the 👍/👎 question now.
export function shouldAskFeedback() {
  const state = readFeedback();
  state.games += 1;
  const ask = !state.asked && state.games >= FEEDBACK_AFTER_GAMES;
  if (ask) state.asked = true;
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(state));
  } catch {
    return false;
  }
  return ask;
}
