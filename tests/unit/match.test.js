import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BONUS,
  newMatch,
  place,
  swap,
  sos,
  usePower,
  settle,
  pause,
  resume,
  leave,
  clocks,
  sosReplayMs,
  toJSON,
  fromJSON,
} from '../../public/js/match.js';
import { replayHistory, timeFor } from '../../public/js/engine.js';

test('a new match starts empty with the board clock for everyone', () => {
  const m = newMatch({ size: 5, now: 1000 });
  assert.equal(m.board.length, 25);
  assert.deepEqual(m.times, [timeFor(5), timeFor(5)]);
  assert.equal(m.current, 0);
  assert.equal(m.since, 1000);
  assert.equal(newMatch({ size: 6, players: 4, first: 2 }).current, 2);
});

test('placing without scoring passes the turn; scoring keeps it and adds time', () => {
  const m = newMatch({ size: 4 });
  assert.equal(place(m, 0, 0, 'O', 0).ok, true);
  assert.equal(m.current, 1);
  place(m, 1, 1, 'S', 0);
  const r = place(m, 0, 2, 'O', 0);
  assert.deepEqual(r.events[0].made, ['0-1-2']);
  assert.equal(m.current, 0);
  assert.deepEqual(m.scores, [1, 0]);
  assert.equal(m.times[0], timeFor(4) + BONUS);
  assert.equal(m.version, 3);
});

test('invalid moves are rejected without changing the match', () => {
  const m = newMatch({ size: 4 });
  place(m, 0, 5, 'O', 0);
  const before = JSON.stringify(toJSON(m));
  assert.equal(place(m, 0, 6, 'O', 0).error, 'turn');
  assert.equal(place(m, 1, 5, 'S', 0).error, 'occupied');
  assert.equal(place(m, 1, 16, 'S', 0).error, 'index');
  assert.equal(place(m, 1, 1.5, 'S', 0).error, 'index');
  assert.equal(place(m, 1, 6, 'X', 0).error, 'letter');
  assert.equal(swap(m, 1, 6, 0).error, 'empty');
  assert.equal(usePower(m, 1, 'magic', 0).error, 'power');
  assert.equal(JSON.stringify(toJSON(m)), before);
});

test('the clock charges only the player on turn and ends the game at zero', () => {
  const m = newMatch({ size: 4, now: 0 });
  place(m, 0, 0, 'O', 10_000);
  assert.equal(m.times[0], timeFor(4) - 10);
  assert.deepEqual(clocks(m, 15_000), [timeFor(4) - 10, timeFor(4) - 5]);
  const events = settle(m, (timeFor(4) + 20) * 1000);
  assert.deepEqual(events, [{ type: 'end', winner: 0, reason: 'tiempo', timedOut: true }]);
  assert.equal(m.over, true);
  assert.equal(place(m, 1, 1, 'S', 0).error, 'over');
});

test('a move after the clock ran out is refused and ends the game', () => {
  const m = newMatch({ size: 4, now: 0 });
  const r = place(m, 0, 0, 'O', (timeFor(4) + 1) * 1000);
  assert.equal(r.error, 'time');
  assert.equal(r.events[0].winner, 1);
});

test('pause stops the clock until resume', () => {
  const m = newMatch({ size: 4, now: 0 });
  pause(m, 5000);
  assert.deepEqual(settle(m, 60_000), []);
  resume(m, 60_000);
  settle(m, 61_000);
  assert.equal(m.times[0], timeFor(4) - 6);
});

test('with 4 players whoever runs out is skipped until one is left', () => {
  const m = newMatch({ size: 6, players: 4, now: 0 });
  const t = timeFor(6) * 1000;
  assert.deepEqual(settle(m, t), [{ type: 'out', player: 0 }]);
  assert.equal(m.current, 1);
  settle(m, 2 * t);
  const events = settle(m, 3 * t);
  assert.equal(events[0].type, 'end');
  assert.equal(events[0].timedOut, true);
});

test('swap flips a letter once, re-scores the board and passes the turn', () => {
  const m = newMatch({ size: 4 });
  place(m, 0, 0, 'O', 0);
  place(m, 1, 1, 'O', 0);
  place(m, 0, 2, 'O', 0);
  const r = swap(m, 1, 1, 0);
  assert.equal(r.ok, true);
  assert.equal(m.board[1], 'S');
  assert.deepEqual(m.scores, [0, 1]);
  assert.equal(m.current, 0);
  place(m, 0, 3, 'O', 0);
  assert.equal(swap(m, 1, 0, 0).error, 'used');
});

test('SOS re-scores the whole game, is spent for everyone and holds the clock', () => {
  const m = newMatch({ size: 4, now: 0 });
  place(m, 0, 0, 'S', 0);
  place(m, 1, 1, 'O', 0);
  const r = sos(m, 0, 1000);
  assert.equal(r.ok, true);
  assert.equal(m.word, 'SOS');
  assert.equal(r.events[0].replay.length, 2);
  assert.equal(m.since, 1000 + sosReplayMs(2));
  assert.deepEqual(clocks(m, 1000 + sosReplayMs(2)), m.times);
  place(m, 0, 2, 'S', 1000 + sosReplayMs(2));
  assert.deepEqual(m.scores, [1, 0]);
  assert.deepEqual(m.scores, replayHistory(4, m.history, 'SOS').scores);
  assert.equal(sos(m, 0, 0).error, 'used');
});

test('hint and last move are spent once; last needs a rival move', () => {
  const m = newMatch({ size: 4 });
  assert.equal(usePower(m, 0, 'last', 0).error, 'no_move');
  assert.equal(usePower(m, 0, 'hint', 0).ok, true);
  assert.equal(usePower(m, 0, 'hint', 0).error, 'used');
  place(m, 0, 0, 'O', 0);
  assert.equal(usePower(m, 1, 'last', 0).ok, true);
});

test('a full board ends the game by points', () => {
  const m = newMatch({ size: 4 });
  for (let i = 0; i < 16; i++) place(m, m.current, i, 'O', 0);
  assert.equal(m.over, true);
  assert.equal(m.reason, 'puntos');
  assert.equal(m.winner, null);
});

test('leaving gives the game to the rival', () => {
  const m = newMatch({ size: 4 });
  assert.deepEqual(leave(m, 0).events[0], { type: 'end', winner: 1, reason: 'abandono', timedOut: false });
});

test('a match survives a JSON round trip', () => {
  const m = newMatch({ size: 4 });
  place(m, 0, 0, 'O', 0);
  place(m, 1, 1, 'S', 0);
  place(m, 0, 2, 'O', 0);
  const copy = fromJSON(JSON.parse(JSON.stringify(toJSON(m))));
  assert.deepEqual(copy, m);
  assert.equal(place(copy, 0, 3, 'S', 0).ok, true);
});
