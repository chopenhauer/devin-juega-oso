// OSO wrap (docs/ideas/oso-wrap.md): the year's totals of what is played on this device, saved now
// so an end-of-year summary has something to tell. Only counters, never each game, and nothing
// leaves the device. Pure, except readWrap/saveWrap (localStorage).
import { GAME } from './config.js';

export const STORAGE_KEY = 'oso.wrap.v1';
// This year and the last one: the summary is shown from December to mid-January.
export const KEEP_YEARS = 2;
// Most names counted per year, so a device where many names are typed stays small.
export const MAX_NAMES = 20;

const tally = () => ({ won: 0, lost: 0, draw: 0 });
export const emptyYear = () => ({
  games: 0,
  days: 0,
  firstDay: null,
  lastDay: null,
  modes: {},
  boards: {},
  themes: {},
  themeChanges: 0,
  avatars: {},
  extras: {},
  machine: {},
  online: tally(),
  names: {},
  lastName: null,
  nameChanges: 0,
  longestSession: 0,
  marathons: 0,
  shares: {},
  dayRun: 0,
  bestDayRun: 0,
  beatenBy: {},
  sosComebacks: 0,
  plenos: 0,
  bought: {},
  secrets: {},
  offline: 0,
  installed: 0,
  challenges: {},
  replays: 0,
  rematches: 0,
  rematchRun: 0,
  points: 0,
  best: 0,
  bigWin: 0,
  streak: 0,
  timeouts: 0,
  weekdays: Array(7).fill(0),
  hours: Array(24).fill(0),
  daily: { played: 0, won: 0, bestStreak: 0 },
});

const add = (counts, key, n = 1) => ({ ...counts, [key]: (counts[key] ?? 0) + n });
const outcome = (winner, p) => (winner === null ? 'draw' : [winner].flat().includes(p) ? 'won' : 'lost');
const weekday = (day) => new Date(`${day}T12:00:00Z`).getUTCDay();

const dayBefore = (day) => new Date(Date.parse(`${day}T12:00:00Z`) - 864e5).toISOString().slice(0, 10);

function year(state, day, played = true) {
  const y = day.slice(0, 4);
  const saved = state.years?.[y];
  // Fields added later start empty in a year saved before them.
  const current = { ...emptyYear(), ...saved, daily: { ...emptyYear().daily, ...saved?.daily } };
  if (!played) return { y, current };
  const firstVisit = current.lastDay !== day;
  const dayRun = !firstVisit ? current.dayRun : current.lastDay === dayBefore(day) ? current.dayRun + 1 : 1;
  return {
    y,
    current: {
      ...current,
      dayRun,
      bestDayRun: Math.max(current.bestDayRun, dayRun),
      firstDay: current.firstDay ?? day,
      lastDay: day,
      days: current.days + (firstVisit ? 1 : 0),
    },
  };
}
function keep(state, y, current) {
  const years = { ...state.years, [y]: current };
  const recent = Object.keys(years).sort().slice(-KEEP_YEARS);
  return { years: Object.fromEntries(recent.map((k) => [k, years[k]])) };
}

// One finished game. `day` is 'YYYY-MM-DD' and `hour` 0–23 where it was played; `local` are the
// players on this device (0 against the machine, your seat online, everybody in Juntos and with 4);
// `longest` is each player's longest streak; `extras` the extras used on this device;
// `sessionGames` the games of the session so far, this one included.
export function recordGame(
  state,
  {
    day,
    hour,
    mode,
    size,
    theme,
    difficulty,
    winner,
    scores,
    names,
    avatars,
    local,
    longest,
    extras = {},
    reason,
    sessionGames = 1,
    offline = false,
    installed = false,
    pleno = false,
  },
) {
  const { y, current: c } = year(state, day);
  const r = { ...c };
  r.games++;
  r.modes = add(r.modes, mode);
  r.boards = add(r.boards, `${size}x${size}`);
  r.themes = add(r.themes, theme);
  for (const [extra, n] of Object.entries(extras)) r.extras = add(r.extras, extra, n);
  r.weekdays = r.weekdays.map((n, i) => n + (i === weekday(day) ? 1 : 0));
  r.hours = r.hours.map((n, i) => n + (i === hour ? 1 : 0));
  if (reason === 'tiempo') r.timeouts++;
  if (offline) r.offline++;
  if (installed) r.installed++;
  if (pleno && local.includes(winner)) r.plenos++;
  for (const p of local) r.avatars = add(r.avatars, avatars[p]);
  // Your name is the first one on this device: player 1, or your seat online.
  const me = names[local[0]];
  if (r.lastName !== null && me !== r.lastName) r.nameChanges++;
  r.lastName = me;
  // Your nemesis: who beats you, the machine by level or the rival's name.
  if (Number.isInteger(winner) && outcome(winner, local[0]) === 'lost') {
    const rival = mode === 'solo' ? `machine.${difficulty}` : names[winner];
    if (rival in r.beatenBy || Object.keys(r.beatenBy).length < MAX_NAMES)
      r.beatenBy = add(r.beatenBy, rival);
  }
  r.longestSession = Math.max(r.longestSession, sessionGames);
  if (sessionGames === GAME.wrap.marathonGames) r.marathons++;
  const mine = local.map((p) => scores[p]);
  r.points += mine.reduce((a, b) => a + b, 0);
  r.best = Math.max(r.best, ...mine);
  r.streak = Math.max(r.streak, ...local.map((p) => longest[p] ?? 0));
  // Against the machine and online there is one of you: how it went, and the biggest win.
  if (mode === 'solo' || mode === 'online') {
    const [me] = local;
    const result = outcome(winner, me);
    if (mode === 'solo')
      r.machine = { ...r.machine, [difficulty]: add(r.machine[difficulty] ?? tally(), result) };
    else r.online = add(r.online, result);
    if (result === 'won')
      r.bigWin = Math.max(r.bigWin, scores[me] - Math.max(...scores.filter((_, i) => i !== me)));
  }
  // Everybody plays on this device in Juntos and with 4: who plays and who wins, by name.
  if (mode === 'two' || mode === 'four') {
    r.names = { ...r.names };
    for (const p of local) {
      const name = names[p];
      if (!(name in r.names) && Object.keys(r.names).length >= MAX_NAMES) continue;
      const prev = r.names[name] ?? { games: 0, won: 0 };
      r.names[name] = { games: prev.games + 1, won: prev.won + (outcome(winner, p) === 'won' ? 1 : 0) };
    }
  }
  return keep(state, y, r);
}

// Something done outside a game, like sharing or changing the theme: `field` goes up by one, or
// `field[key]` if there is a key. It does not count as a day played.
// With `atLeast`, `field` keeps the biggest value seen instead.
export function count(state, { day, field, key, atLeast }) {
  const { y, current: r } = year(state, day, false);
  const value =
    atLeast !== undefined
      ? Math.max(r[field] ?? 0, atLeast)
      : key === undefined
        ? (r[field] ?? 0) + 1
        : add(r[field] ?? {}, key);
  return keep(state, y, { ...r, [field]: value });
}

// The 🛟 turned the score round for `player`: behind before, ahead of everybody after.
export function isComeback(before, after, player) {
  const best = (list) => Math.max(...list.filter((_, i) => i !== player));
  return before[player] < best(before) && after[player] > best(after);
}

// The first try at a reto del día, with the streak it leaves.
export function recordDaily(state, { day, won, streak }) {
  const { y, current: r } = year(state, day);
  const daily = {
    played: r.daily.played + 1,
    won: r.daily.won + (won ? 1 : 0),
    bestStreak: Math.max(r.daily.bestStreak, streak),
  };
  return keep(state, y, { ...r, daily });
}

export function readWrap() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.years ? saved : { years: {} };
  } catch {
    return { years: {} };
  }
}
export function saveWrap(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: this game is just not counted */
  }
  return state;
}
