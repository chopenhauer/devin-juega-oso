// Rules of one game as plain data, shared by the local game (app.js) and the
// online referee (api/sala.js). Each function changes the match in place and
// returns what happened so the caller can animate it. Times are milliseconds
// from any clock: performance.now() locally, Date.now() on the server.
import { LETTERS, findNew, rebuildScores, replayHistory, timeFor } from './engine.js';

export const BONUS = 10;
export const POWERS = ['hint', 'last'];
// How long the 🛟 SOS replay animation lasts; the clock does not run meanwhile.
export const sosReplayMs = (moves) => 1120 + 260 * moves;

export function newMatch({ size, players = 2, first = 0, now = 0 }) {
  return {
    size,
    players,
    board: Array(size * size).fill(''),
    scored: new Map(),
    scores: Array(players).fill(0),
    times: Array(players).fill(timeFor(size)),
    current: first,
    history: [],
    extras: Array.from({ length: players }, () => ({ hint: 1, last: 1, swap: 1 })),
    word: 'OSO',
    sosUsed: false,
    over: false,
    winner: null,
    reason: null,
    timedOut: false,
    // When the clock of the player on turn last started; null while paused.
    since: now,
    version: 0,
  };
}

export const toJSON = (m) => ({ ...m, scored: [...m.scored] });
export const fromJSON = (o) => ({ ...o, scored: new Map(o.scored) });

const fail = (error, events = []) => ({ ok: false, error, events });

// Next player with time left (with 4 players, whoever runs out of time is out).
export function nextPlayer(m, from = m.current) {
  for (let k = 1; k <= m.players; k++) {
    const p = (from + k) % m.players;
    if (m.times[p] > 0) return p;
  }
  return from;
}

// Players with the top score; `out` (who ran out of time) can't win.
export function leaders(m, out = null) {
  const ids = m.scores.map((_, i) => i).filter((i) => i !== out);
  const top = Math.max(...ids.map((i) => m.scores[i]));
  const best = ids.filter((i) => m.scores[i] === top);
  return best.length === 1 ? best[0] : best;
}

function end(m, winner, reason, timedOut = reason === 'tiempo') {
  Object.assign(m, { over: true, winner, reason, timedOut, since: null });
  m.version++;
  return { type: 'end', winner, reason, timedOut };
}

// `timedOut`: with 4 players, the game ends when only one has time left.
export function endByScore(m, timedOut = false) {
  const top = [leaders(m)].flat();
  return end(m, top.length === m.scores.length ? null : leaders(m), 'puntos', timedOut);
}

// Seconds left on each clock at `now`, without changing the match.
export function clocks(m, now) {
  const times = [...m.times];
  if (!m.over && m.since !== null && now > m.since)
    times[m.current] = Math.max(0, times[m.current] - (now - m.since) / 1000);
  return times;
}

// Charges the player on turn for the time elapsed. Returns the events when the
// clock ran out: the game ends, or with 4 players that player is out.
export function settle(m, now) {
  if (m.over || m.since === null || now <= m.since) return [];
  m.times = clocks(m, now);
  m.since = now;
  if (m.times[m.current] > 0) return [];
  const p = m.current;
  if (m.players === 2) return [end(m, 1 - p, 'tiempo')];
  if (m.times.filter((t) => t > 0).length <= 1) return [endByScore(m, true)];
  m.current = nextPlayer(m, p);
  m.version++;
  return [{ type: 'out', player: p }];
}

export function pause(m, now) {
  settle(m, now);
  if (!m.over) m.since = null;
}

export function resume(m, now) {
  if (!m.over) m.since = now;
}

// Common checks before a player acts; also charges their clock.
function begin(m, p, now) {
  if (m.over) return fail('over');
  if (p !== m.current) return fail('turn');
  const events = settle(m, now);
  if (events.length) return fail('time', events);
  return null;
}

const validIndex = (m, index) => Number.isInteger(index) && index >= 0 && index < m.board.length;

function after(m, events) {
  m.version++;
  if (m.board.every(Boolean)) events.push(endByScore(m));
  return { ok: true, events };
}

// Puts a letter on an empty cell. Scoring keeps the turn and adds time.
export function place(m, p, index, letter, now) {
  if (!validIndex(m, index)) return fail('index');
  if (!LETTERS.includes(letter)) return fail('letter');
  if (m.board[index]) return fail('occupied');
  const error = begin(m, p, now);
  if (error) return error;
  m.board[index] = letter;
  m.history.push({ player: p, index, letter });
  const made = findNew(m.board, m.size, m.scored, index, m.word);
  made.forEach((k) => m.scored.set(k, p));
  if (made.length) {
    m.scores[p] += made.length;
    m.times[p] += BONUS * made.length;
  } else m.current = nextPlayer(m, p);
  return after(m, [{ type: 'place', player: p, index, letter, made }]);
}

// 🔄 Turns an O into an S (or back) once per game; the turn always passes.
export function swap(m, p, index, now) {
  if (!validIndex(m, index)) return fail('index');
  if (!m.board[index]) return fail('empty');
  if (!m.extras[p]?.swap) return fail('used');
  const error = begin(m, p, now);
  if (error) return error;
  m.extras[p].swap = 0;
  m.board[index] = m.board[index] === 'O' ? 'S' : 'O';
  m.history.push({ player: p, index, letter: m.board[index], power: 'swap' });
  ({ scored: m.scored, scores: m.scores } = rebuildScores(m.board, m.size, m.word, m.scored, p, m.players));
  m.current = nextPlayer(m, p);
  return after(m, [{ type: 'swap', player: p, index, letter: m.board[index] }]);
}

// 💡 hint and 👁️ last move only show something on the player's own screen;
// the match just records that they are spent.
export function usePower(m, p, power, now) {
  if (!POWERS.includes(power)) return fail('power');
  if (!m.extras[p]?.[power]) return fail('used');
  if (power === 'last' && !m.history.some((x) => x.player !== p)) return fail('no_move');
  const error = begin(m, p, now);
  if (error) return error;
  m.extras[p][power] = 0;
  m.version++;
  return { ok: true, events: [{ type: 'power', player: p, power }] };
}

// 🛟 Once per game for everybody: the whole game is scored again as SOS.
// The clock waits while the replay is shown.
export function sos(m, p, now) {
  if (m.sosUsed) return fail('used');
  const error = begin(m, p, now);
  if (error) return error;
  const replay = m.history.map((x) => ({ ...x }));
  Object.assign(m, { sosUsed: true, word: 'SOS' }, replayHistory(m.size, replay, 'SOS', m.players));
  m.since = now + sosReplayMs(replay.length);
  m.version++;
  return { ok: true, events: [{ type: 'sos', player: p, replay }] };
}

// Leaving a 1 vs 1 game on purpose: the rival wins.
export function leave(m, p) {
  if (m.over) return fail('over');
  return { ok: true, events: [end(m, 1 - p, 'abandono', false)] };
}
