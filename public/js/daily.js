// Reto del día (docs/ideas/reto-del-dia.md): the same game for everybody each day, like Wordle.
// Everything comes from the date in Madrid, so each phone works out the same challenge by itself,
// also offline: board, level, the letters already placed and the machine's luck. Pure, except for
// readDaily/saveDaily (localStorage).
import { GAME } from './config.js';
import { findNew, LETTERS } from './engine.js';

export const TIME_ZONE = 'Europe/Madrid';
export const STORAGE_KEY = 'oso.daily.v1';
const DAY_MS = 86400000;

// Board and level of each weekday (0 = Sunday): easy on school days, a bigger board at weekends.
export const WEEK = [
  { size: 6, difficulty: 'hard' },
  { size: 5, difficulty: 'easy' },
  { size: 5, difficulty: 'hard' },
  { size: 5, difficulty: 'easy' },
  { size: 5, difficulty: 'hard' },
  { size: 5, difficulty: 'easy' },
  { size: 6, difficulty: 'easy' },
];

// 'YYYY-MM-DD' of the reto being played at `date`. Each one starts at `startHour` in Madrid (2:00),
// so before that it is still the previous day's.
export function dayKey(date = new Date(), startHour = GAME.daily.startHour) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const key = `${p.year}-${p.month}-${p.day}`;
  return +p.hour < startHour ? addDays(key, -1) : key;
}

const utc = (key) => Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10));
// The reto's number is the day of the year (24 October = 297), so it never looks newly started.
export const dailyNumber = (key) => Math.round((utc(key) - Date.UTC(+key.slice(0, 4), 0, 1)) / DAY_MS) + 1;
// «lunes, 26 de octubre» (or «26 de octubre» without the weekday).
export const dateLabel = (key, weekday = true, locale = 'es') =>
  new Intl.DateTimeFormat(locale, {
    weekday: weekday ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(utc(key)));
export const addDays = (key, n) => new Date(utc(key) + n * DAY_MS).toISOString().slice(0, 10);

// Small seeded generator (mulberry32): the same seed always gives the same numbers.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedOf(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Letters already on the board: they never spell OSO or SOS (so they score for nobody, also after
// a 🛟) and never leave an OSO ready to take, so nobody gets a free point.
export function presetLetters(size, count, random) {
  const board = Array(size * size).fill('');
  const forms = (b, i) => ['OSO', 'SOS'].some((w) => findNew(b, size, new Map(), i, w).length);
  const gift = (b) =>
    b.some((v, i) => !v && LETTERS.some((l) => forms(Object.assign([...b], { [i]: l }), i)));
  const preset = [];
  for (let tries = 0; preset.length < count && tries < 200; tries++) {
    const index = Math.floor(random() * board.length);
    const letter = LETTERS[Math.floor(random() * LETTERS.length)];
    if (board[index]) continue;
    const next = Object.assign([...board], { [index]: letter });
    if (forms(next, index) || gift(next)) continue;
    board[index] = letter;
    preset.push({ index, letter });
  }
  return preset;
}

export function dailyChallenge(key = dayKey(), letters = GAME.daily.letters) {
  const { size, difficulty } = WEEK[new Date(utc(key)).getUTCDay()];
  const random = seededRandom(seedOf(`oso:${key}`));
  return { key, number: dailyNumber(key), size, difficulty, preset: presetLetters(size, letters, random) };
}

// The machine's luck for one game of the challenge: the same moves give the same answers.
export const dailyRandom = (key) => seededRandom(seedOf(`oso:${key}:machine`));

// What is kept on the phone: { last, streak, results: { key: { mine, theirs, won } } }.
// Only the first finished game of each day counts; the streak counts days played in a row.
export const emptyDaily = () => ({ last: null, streak: 0, results: {} });
const KEEP_DAYS = 60;

export function recordDaily(state, key, { mine, theirs, won }) {
  if (state.results[key]) return { state, first: false };
  const streak = state.last === addDays(key, -1) ? state.streak + 1 : 1;
  const results = Object.fromEntries(
    Object.entries({ ...state.results, [key]: { mine, theirs, won } }).filter(
      ([k]) => k > addDays(key, -KEEP_DAYS),
    ),
  );
  return { state: { last: key, streak, results }, first: true };
}

// Days in a row up to today (0 if yesterday was skipped).
export const currentStreak = (state, today) =>
  state.last === today || state.last === addDays(today, -1) ? state.streak : 0;

// Milliseconds until the next challenge (GAME.daily.startHour in Madrid).
export function msToNext(now = new Date()) {
  const today = dayKey(now);
  let lo = now.getTime();
  let hi = lo + DAY_MS + 3600000;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (dayKey(new Date(mid)) === today) lo = mid;
    else hi = mid;
  }
  return hi - now.getTime();
}

export const isDailyPath = (pathname) => /^\/reto(\.html)?\/?$/.test(pathname);

export function readDaily() {
  try {
    return { ...emptyDaily(), ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return emptyDaily();
  }
}

export function saveDaily(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or full storage: the challenge still plays, it just is not remembered.
  }
}

// 'h m' left until the next challenge, for the card.
export function waitParts(ms) {
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  return { h: Math.floor(minutes / 60), m: minutes % 60 };
}
