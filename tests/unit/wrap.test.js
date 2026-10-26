import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordGame, recordDaily, emptyYear, KEEP_YEARS, MAX_NAMES } from '../../public/js/wrap.js';

const game = (over = {}) => ({
  day: '2026-10-26',
  hour: 18,
  mode: 'solo',
  size: 5,
  theme: 'classic',
  difficulty: 'easy',
  winner: 0,
  scores: [6, 2],
  names: ['Julia', 'Máquina'],
  local: [0],
  longest: [3, 1],
  extras: {},
  reason: 'puntos',
  ...over,
});

test('a game against the machine counts what you did, not what the machine did', () => {
  const y = recordGame({ years: {} }, game({ extras: { hint: 1, sos: 1 } })).years['2026'];
  assert.equal(y.games, 1);
  assert.equal(y.days, 1);
  assert.equal(y.firstDay, '2026-10-26');
  assert.deepEqual(y.modes, { solo: 1 });
  assert.deepEqual(y.boards, { '5x5': 1 });
  assert.deepEqual(y.themes, { classic: 1 });
  assert.deepEqual(y.extras, { hint: 1, sos: 1 });
  assert.deepEqual(y.machine, { easy: { won: 1, lost: 0, draw: 0 } });
  assert.equal(y.points, 6);
  assert.equal(y.best, 6);
  assert.equal(y.bigWin, 4);
  assert.equal(y.streak, 3);
  assert.equal(y.weekdays[1], 1, '26-10-2026 is a Monday');
  assert.equal(y.hours[18], 1);
  assert.deepEqual(y.names, {}, 'against the machine no names are kept');
});

test('totals add up across games and days; a day counts once', () => {
  let s = recordGame({ years: {} }, game());
  s = recordGame(s, game({ winner: 1, scores: [9, 10], longest: [5, 2], difficulty: 'hard' }));
  s = recordGame(s, game({ day: '2026-10-27', winner: null, scores: [3, 3], reason: 'tiempo' }));
  const y = s.years['2026'];
  assert.equal(y.games, 3);
  assert.equal(y.days, 2);
  assert.equal(y.lastDay, '2026-10-27');
  assert.equal(y.points, 18);
  assert.equal(y.best, 9);
  assert.equal(y.bigWin, 4, 'a loss is never the biggest win');
  assert.equal(y.streak, 5);
  assert.equal(y.timeouts, 1);
  assert.deepEqual(y.machine, { easy: { won: 1, lost: 0, draw: 1 }, hard: { won: 0, lost: 1, draw: 0 } });
});

test('in Juntos and with 4 everybody is on this device: who plays and who wins, by name', () => {
  let s = recordGame({ years: {} }, game({ mode: 'two', names: ['Julia', 'Papá'], local: [0, 1] }));
  s = recordGame(
    s,
    game({
      mode: 'four',
      names: ['Julia', 'Papá', 'Mamá', 'Martina'],
      scores: [2, 4, 4, 1],
      winner: [1, 2],
      local: [0, 1, 2, 3],
      longest: [1, 2, 2, 1],
    }),
  );
  const y = s.years['2026'];
  assert.deepEqual(y.names, {
    Julia: { games: 2, won: 1 },
    Papá: { games: 2, won: 1 },
    Mamá: { games: 1, won: 1 },
    Martina: { games: 1, won: 0 },
  });
  assert.equal(y.points, 8 + 11);
  assert.deepEqual(y.machine, {});
});

test('online only your seat counts', () => {
  const y = recordGame(
    { years: {} },
    game({ mode: 'online', local: [1], winner: 1, scores: [2, 7], longest: [4, 2] }),
  ).years['2026'];
  assert.deepEqual(y.online, { won: 1, lost: 0, draw: 0 });
  assert.equal(y.points, 7);
  assert.equal(y.bigWin, 5);
  assert.equal(y.streak, 2);
});

test('at most MAX_NAMES names a year: new ones stop being counted, known ones go on', () => {
  let s = { years: {} };
  for (let i = 0; i < MAX_NAMES + 2; i++)
    s = recordGame(s, game({ mode: 'two', names: [`N${i}`, 'Julia'], local: [0, 1] }));
  const names = s.years['2026'].names;
  assert.equal(Object.keys(names).length, MAX_NAMES);
  assert.equal(names.Julia.games, MAX_NAMES + 2);
  assert.ok(!(`N${MAX_NAMES - 1}` in names));
});

test('the reto del día: first tries, wins and the best streak', () => {
  let s = recordDaily({ years: {} }, { day: '2026-10-26', won: true, streak: 1 });
  s = recordDaily(s, { day: '2026-10-27', won: false, streak: 2 });
  s = recordDaily(s, { day: '2026-10-29', won: true, streak: 1 });
  assert.deepEqual(s.years['2026'].daily, { played: 3, won: 2, bestStreak: 2 });
  assert.equal(s.years['2026'].games, 0, 'the game itself is counted by recordGame');
});

test('each year apart, and only the last years are kept', () => {
  let s = recordGame({ years: {} }, game({ day: '2025-12-31' }));
  s = recordGame(s, game({ day: '2026-01-01' }));
  assert.deepEqual(Object.keys(s.years), ['2025', '2026']);
  s = recordGame(s, game({ day: '2027-01-01' }));
  assert.equal(Object.keys(s.years).length, KEEP_YEARS);
  assert.deepEqual(Object.keys(s.years), ['2026', '2027']);
});

test('a year saved before a new field still works', () => {
  const old = { years: { 2026: { games: 4, days: 2, lastDay: '2026-10-20', modes: { solo: 4 } } } };
  const y = recordGame(old, game()).years['2026'];
  assert.equal(y.games, 5);
  assert.equal(y.days, 3);
  assert.deepEqual(y.modes, { solo: 5 });
  assert.deepEqual(y.daily, emptyYear().daily);
});
