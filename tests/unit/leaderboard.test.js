import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sessionKey, recordGame, standings, endPhrase, sessionNudge } from '../../public/js/leaderboard.js';

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

const g = (scores, winner) => ({ scores, winner, size: 5 });

test('the end phrase tells the story of the game and of the session', () => {
  assert.equal(endPhrase([g([2, 2], null)]), null);
  assert.equal(endPhrase([g([4, 2], 0)]), null);
  assert.deepEqual(endPhrase([g([5, 0], 0)]), { key: 'rout', player: 0 });
  assert.deepEqual(endPhrase([g([3, 4], 1)]), { key: 'close', player: 1 });
  assert.deepEqual(endPhrase([g([4, 1], 0), g([1, 3], 1)]), { key: 'first_win', player: 1 });
  assert.deepEqual(endPhrase([g([4, 1], 0), g([4, 2], 0), g([3, 1], 0)]), {
    key: 'unstoppable',
    player: 0,
    count: 3,
  });
  // 1 – 0, 1 – 1 and now 2 – 1: whoever led before gets it back.
  assert.deepEqual(endPhrase([g([4, 1], 0), g([1, 4], 1), g([4, 2], 0)]), { key: 'lead_back', player: 0 });
  assert.deepEqual(endPhrase([g([4, 1], 0), g([1, 4], 1), g([2, 4], 1)]), { key: 'comeback', player: 1 });
});

test('against the machine, losing gets an encouraging phrase', () => {
  assert.deepEqual(endPhrase([g([2, 3], 1)], { machine: 1 }), { key: 'machine_close' });
  assert.deepEqual(endPhrase([g([0, 5], 1)], { machine: 1 }), { key: 'machine' });
  assert.deepEqual(endPhrase([g([5, 0], 0)], { machine: 1 }), { key: 'rout', player: 0 });
});

test('shared wins and four-player games only get the phrases about this game', () => {
  assert.equal(endPhrase([g([3, 3, 1, 0], [0, 1])]), null);
  assert.deepEqual(endPhrase([g([3, 2, 1, 0], 0)]), { key: 'close', player: 0 });
});

test('the session nudge says what the next game can change', () => {
  assert.equal(sessionNudge({ wins: [0, 0] }), null);
  assert.deepEqual(sessionNudge({ wins: [1, 1] }), { key: 'tied' });
  assert.deepEqual(sessionNudge({ wins: [2, 1] }), { key: 'can_tie', player: 1 });
  assert.deepEqual(sessionNudge({ wins: [0, 3] }), { key: 'ahead', player: 1, count: 3 });
  assert.deepEqual(sessionNudge({ wins: [0, 3] }, { machine: 1 }), { key: 'machine_ahead', player: 0 });
  assert.equal(sessionNudge({ wins: [1, 0, 0, 0] }), null);
});
