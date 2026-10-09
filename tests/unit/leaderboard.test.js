import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sessionKey, recordGame, standings } from '../../public/js/leaderboard.js';

const players = { mode: 'two', difficulty: 'easy', names: ['Julia', 'Papá'], avatars: ['🐻', '🐼'] };

test('consecutive games between the same players add up, whatever the board size', () => {
  const key = sessionKey(players);
  let s = recordGame(null, key, { scores: [3, 1], winner: 0, size: 5 });
  s = recordGame(s, key, { scores: [2, 2], winner: null, size: 5 });
  s = recordGame(s, key, { scores: [1, 4], winner: 1, size: 7 });
  assert.deepEqual(standings(s), { games: 3, wins: [1, 1], points: [6, 7], draws: 1 });
});

test('changing players, mode or machine difficulty starts a new session', () => {
  const s = recordGame(null, sessionKey(players), { scores: [3, 1], winner: 0, size: 5 });
  for (const other of [
    { ...players, names: ['Julia', 'Mamá'] },
    { ...players, avatars: ['🐻', '🦊'] },
    { ...players, mode: 'solo' },
  ]) {
    const next = recordGame(s, sessionKey(other), { scores: [0, 2], winner: 1, size: 5 });
    assert.equal(standings(next).games, 1);
  }
  const solo = { ...players, mode: 'solo' };
  assert.notEqual(sessionKey(solo), sessionKey({ ...solo, difficulty: 'hard' }));
  assert.equal(sessionKey(players), sessionKey({ ...players, difficulty: 'hard' }));
});

test('an empty or unreadable session has no games', () => {
  assert.deepEqual(standings(null), { games: 0, wins: [0, 0], points: [0, 0], draws: 0 });
  assert.equal(
    standings(recordGame({ key: 'x', games: 'bad' }, 'x', { scores: [1, 0], winner: 0 })).games,
    1,
  );
});

test('standings handle four players and shared victories', () => {
  let session = recordGame(null, 'k', { scores: [3, 1, 3, 0], winner: [0, 2], size: 6 });
  session = recordGame(session, 'k', { scores: [0, 2, 1, 1], winner: 1, size: 7 });
  const st = standings(session);
  assert.deepEqual(st.wins, [1, 1, 1, 0]);
  assert.deepEqual(st.points, [3, 3, 4, 1]);
  assert.equal(st.draws, 0);
});
