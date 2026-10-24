import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findNew, LETTERS } from '../../public/js/engine.js';
import {
  dayKey,
  dailyNumber,
  addDays,
  dailyChallenge,
  dailyRandom,
  recordDaily,
  currentStreak,
  emptyDaily,
  msToNext,
  isDailyPath,
  EPOCH,
} from '../../public/js/daily.js';
import { newMatch, place, streaks, sos } from '../../public/js/match.js';

test('the day is the date in Madrid, and reto n.º 1 is the first day', () => {
  assert.equal(dayKey(new Date('2026-10-24T21:59:00Z')), '2026-10-24');
  assert.equal(dayKey(new Date('2026-10-24T22:01:00Z')), '2026-10-25');
  assert.equal(dayKey(new Date('2026-12-31T23:30:00Z')), '2027-01-01');
  assert.equal(dailyNumber(EPOCH), 1);
  assert.equal(dailyNumber('2026-11-23'), 31);
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('every phone gets the same challenge for a day, and another one the next day', () => {
  const a = dailyChallenge('2026-10-26');
  assert.deepEqual(a, dailyChallenge('2026-10-26'));
  assert.notDeepEqual(a.preset, dailyChallenge('2026-10-27').preset);
  assert.equal(a.number, 3);
  assert.deepEqual([a.size, a.difficulty], [5, 'easy']);
  assert.deepEqual([dailyChallenge('2026-10-24').size, dailyChallenge('2026-10-25').size], [6, 6]);
  const r1 = dailyRandom('2026-10-26');
  const r2 = dailyRandom('2026-10-26');
  assert.deepEqual([r1(), r1(), r1()], [r2(), r2(), r2()]);
});

test('the letters already placed never score nor leave a point ready to take', () => {
  for (let d = 0; d < 120; d++) {
    const { size, preset } = dailyChallenge(addDays(EPOCH, d));
    assert.equal(preset.length, 4);
    assert.equal(new Set(preset.map((p) => p.index)).size, 4);
    const board = Array(size * size).fill('');
    preset.forEach((p) => (board[p.index] = p.letter));
    for (const word of ['OSO', 'SOS'])
      board.forEach((v, i) => {
        if (v) assert.deepEqual(findNew(board, size, new Map(), i, word), []);
        else
          for (const l of LETTERS)
            assert.deepEqual(
              findNew(Object.assign([...board], { [i]: l }), size, new Map(), i, word),
              [],
              `${d} ${i}`,
            );
      });
  }
  assert.deepEqual(dailyChallenge('2026-10-26', 0).preset, []);
});

test('a match can start with letters on the board; they score for nobody, also after a 🛟', () => {
  const { size, preset } = dailyChallenge('2026-10-26');
  const m = newMatch({ size, preset, now: 0 });
  assert.equal(m.board.filter(Boolean).length, 4);
  assert.equal(m.history.length, 4);
  assert.ok(m.history.every((x) => x.preset && x.player === 0));
  const free = m.board.findIndex((v) => !v);
  assert.ok(place(m, 0, free, 'O', 1).ok);
  assert.deepEqual(streaks(m), [
    { longest: 0, count: 0 },
    { longest: 0, count: 0 },
  ]);
  assert.ok(sos(m, 1, 2).ok);
  assert.deepEqual(m.scores, [0, 0]);
  assert.equal(m.board.filter(Boolean).length, 5);
});

test('only the first game of each day counts, and the streak counts days in a row', () => {
  let s = emptyDaily();
  ({ state: s } = recordDaily(s, '2026-10-24', { mine: 5, theirs: 3, won: true }));
  assert.equal(s.streak, 1);
  const again = recordDaily(s, '2026-10-24', { mine: 0, theirs: 9, won: false });
  assert.equal(again.first, false);
  assert.deepEqual(again.state.results['2026-10-24'], { mine: 5, theirs: 3, won: true });
  ({ state: s } = recordDaily(s, '2026-10-25', { mine: 1, theirs: 3, won: false }));
  assert.equal(s.streak, 2);
  assert.equal(currentStreak(s, '2026-10-26'), 2);
  assert.equal(currentStreak(s, '2026-10-27'), 0);
  ({ state: s } = recordDaily(s, '2026-10-27', { mine: 4, theirs: 3, won: true }));
  assert.equal(s.streak, 1);
  ({ state: s } = recordDaily(s, '2027-02-01', { mine: 4, theirs: 3, won: true }));
  assert.deepEqual(Object.keys(s.results), ['2027-02-01']);
});

test('the next challenge comes at midnight in Madrid, and /reto is its address', () => {
  assert.equal(msToNext(new Date('2026-10-24T21:00:00Z')), 3600000);
  // After the clocks go back on 25-10 midnight in Madrid is 23:00 UTC.
  assert.equal(msToNext(new Date('2026-10-25T22:30:00Z')), 30 * 60000);
  for (const p of ['/reto', '/reto/', '/reto.html']) assert.ok(isDailyPath(p), p);
  for (const p of ['/', '/retos', '/sala']) assert.ok(!isDailyPath(p), p);
});
