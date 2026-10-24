// Rules of one game as plain data, shared by the local game (app.js) and the
// online referee (api/sala.js). Each function changes the match in place and
// returns what happened so the caller can animate it. Times are milliseconds
// from any clock: performance.now() locally, Date.now() on the server.
import { GAME } from './config.js';
import { LETTERS, findNew, rebuildScores, replayHistory, replayMove, timeFor } from './engine.js';

export const BONUS = GAME.clock.bonusSeconds;
export const POWERS = ['hint', 'last'];
// 🛒 Spent extras that can be bought back with seconds (GAME.shop).
export const SHOP = ['hint', 'swap', 'sos'];
export const price = (power) => GAME.shop[`${power}Seconds`];
// How long the 🛟 SOS replay animation lasts; the clock does not run meanwhile.
export const sosReplayMs = (moves) => GAME.sos.flashMs + GAME.sos.pauseMs + GAME.sos.moveMs * moves;

// `preset`: letters already on the board (reto del día, daily.js). They go first in the history,
// as player 0's but marked `preset`, so the 🛟 replay and the streaks see them; they never score.
export function newMatch({ size, players = 2, first = 0, now = 0, preset = [] }) {
  const board = Array(size * size).fill('');
  preset.forEach(({ index, letter }) => (board[index] = letter));
  return {
    size,
    players,
    board,
    scored: new Map(),
    scores: Array(players).fill(0),
    times: Array(players).fill(timeFor(size)),
    current: first,
    history: preset.map(({ index, letter }) => ({ player: 0, index, letter, preset: true })),
    extras: Array.from({ length: players }, () => ({ ...GAME.extras })),
    word: 'OSO',
    sosUsed: false,
    // 🛟 SOS bought back by each player (the first one is free for everybody).
    sosCredits: Array(players).fill(0),
    over: false,
    winner: null,
    reason: null,
    timedOut: false,
    // What broke a tie on points when the board filled up (see standing()).
    tiebreak: null,
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

// A streak (racha) is a run of moves by the same player that each make at least one OSO (or
// SOS): scoring keeps the turn, so it lasts until that player places without scoring. A move
// that makes two OSO at once is still one move. Replayed from the history with the current word,
// so it always matches the scores after 🔄 and 🛟; a 🔄 never scores a streak and ends it.
export function streaks(m) {
  const stats = Array.from({ length: m.players }, () => ({ longest: 0, count: 0 }));
  let state = {
    size: m.size,
    board: Array(m.size * m.size).fill(''),
    scored: new Map(),
    scores: Array(m.players).fill(0),
  };
  let run = 0;
  let last = null;
  for (const move of m.history) {
    const before = state.scores[move.player];
    state = replayMove(state, move, m.word);
    if (move.power || state.scores[move.player] <= before) {
      last = null;
      continue;
    }
    const s = stats[move.player];
    if (last === move.player) run++;
    else {
      run = 1;
      s.count++;
    }
    last = move.player;
    s.longest = Math.max(s.longest, run);
  }
  return stats;
}

// Tiebreakers after the points, in order (`tiebreak` in the match and in `game_end`).
export const TIEBREAKS = ['streak', 'streaks'];

// Who is on top: most points, then the longest streak, then the most streaks. `out` (who ran out
// of time) can't win. `tiebreak`: 'none' if the points decide, the tiebreaker that decided, or
// 'draw' if still tied after all of them.
export function standing(m, out = null) {
  const stats = streaks(m);
  const keys = [(i) => m.scores[i], (i) => stats[i].longest, (i) => stats[i].count];
  let best = m.scores.map((_, i) => i).filter((i) => i !== out);
  let decided = 'none';
  keys.forEach((key, k) => {
    const top = Math.max(...best.map(key));
    const next = best.filter((i) => key(i) === top);
    if (k > 0 && next.length < best.length) decided = TIEBREAKS[k - 1];
    best = next;
  });
  const winner = best.length === 1 ? best[0] : best;
  return { winner, tiebreak: best.length > 1 ? 'draw' : decided, stats };
}

export const leaders = (m, out = null) => standing(m, out).winner;

function end(m, winner, reason, timedOut = reason === 'tiempo') {
  Object.assign(m, { over: true, winner, reason, timedOut, since: null });
  m.version++;
  return { type: 'end', winner, reason, timedOut };
}

// `timedOut`: with 4 players, the game ends when only one has time left.
export function endByScore(m, timedOut = false) {
  const { winner, tiebreak } = standing(m);
  m.tiebreak = tiebreak;
  return end(m, [winner].flat().length === m.scores.length ? null : winner, 'puntos', timedOut);
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

// 🔄 Turns an O into an S (or back) GAME.extras.swap times per game; the turn always passes.
export function swap(m, p, index, now) {
  if (!validIndex(m, index)) return fail('index');
  if (!m.board[index]) return fail('empty');
  if (!m.extras[p]?.swap) return fail('used');
  const error = begin(m, p, now);
  if (error) return error;
  m.extras[p].swap--;
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
  m.extras[p][power]--;
  m.version++;
  return { ok: true, events: [{ type: 'power', player: p, power }] };
}

// 🛒 Buys back a spent 💡, 🔄 or 🛟 with seconds of one's own clock, as long as some are left
// afterwards. Using it is a separate action.
export function buy(m, p, power, now) {
  if (!SHOP.includes(power)) return fail('power');
  if (power === 'sos' ? sosReady(m, p) : m.extras[p]?.[power]) return fail('available');
  const error = begin(m, p, now);
  if (error) return error;
  const cost = price(power);
  if (m.times[p] <= cost) return fail('funds');
  m.times[p] -= cost;
  if (power === 'sos') (m.sosCredits ??= Array(m.players).fill(0))[p]++;
  else m.extras[p][power]++;
  m.version++;
  return { ok: true, events: [{ type: 'buy', player: p, power, cost }] };
}

export const sosReady = (m, p) => !m.sosUsed || m.sosCredits?.[p] > 0;

// 🛟 Once per game for everybody: the whole game is scored again as SOS. A 🛟 bought back
// switches it again (SOS ↔ OSO), also for everybody. The clock waits while the replay is shown.
export function sos(m, p, now) {
  if (!sosReady(m, p)) return fail('used');
  const error = begin(m, p, now);
  if (error) return error;
  if (m.sosUsed) m.sosCredits[p]--;
  const word = m.word === 'SOS' ? 'OSO' : 'SOS';
  const replay = m.history.map((x) => ({ ...x }));
  Object.assign(m, { sosUsed: true, word }, replayHistory(m.size, replay, word, m.players));
  m.since = now + sosReplayMs(replay.length);
  m.version++;
  return { ok: true, events: [{ type: 'sos', player: p, replay }] };
}

// Leaving a 1 vs 1 game on purpose: the rival wins.
export function leave(m, p) {
  if (m.over) return fail('over');
  return { ok: true, events: [end(m, 1 - p, 'abandono', false)] };
}
