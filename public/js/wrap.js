// OSO wrap (docs/ideas/oso-wrap.md): the year's totals of what is played on this device, saved now
// so an end-of-year summary has something to tell. Only counters, never each game, and nothing
// leaves the device. Pure, except readWrap/saveWrap (localStorage).
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
  extras: {},
  machine: {},
  online: tally(),
  names: {},
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

function year(state, day) {
  const y = day.slice(0, 4);
  const saved = state.years?.[y];
  // Fields added later start empty in a year saved before them.
  const current = { ...emptyYear(), ...saved, daily: { ...emptyYear().daily, ...saved?.daily } };
  const firstVisit = current.lastDay !== day;
  return {
    y,
    current: {
      ...current,
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
// `longest` is each player's longest streak; `extras` the extras used on this device.
export function recordGame(
  state,
  { day, hour, mode, size, theme, difficulty, winner, scores, names, local, longest, extras = {}, reason },
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
