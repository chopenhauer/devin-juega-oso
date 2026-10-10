import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  feedbackMoment,
  gameEndParams,
  gameParams,
  ideasHref,
  TIMEOUT_TARGET,
} from '../../public/js/telemetry.js';

test('game_end describes the game without personal data', () => {
  const params = gameEndParams({
    size: 5,
    mode: 'solo',
    difficulty: 'hard',
    reason: 'tiempo',
    winner: 1,
    scores: [2, 3],
    available: 120,
    times: [0, 47.6],
    filled: 18,
  });
  assert.deepEqual(params, {
    board_size: '5x5',
    players: 2,
    mode: 'solo',
    vs_machine: true,
    difficulty: 'hard',
    end_reason: 'timeout',
    result: 'machine',
    time_available: 120,
    time_used_max: 120,
    time_left_min: 0,
    cells_filled: 18,
    cells_total: 25,
    score_total: 5,
    time_left_p1: 0,
    time_left_p2: 48,
  });
});

test('game params cover 4 players, draws and time bonuses', () => {
  assert.equal(gameParams({ size: 7, mode: 'four', difficulty: 'easy' }).difficulty, 'none');
  const params = gameEndParams({
    size: 7,
    mode: 'four',
    difficulty: 'easy',
    reason: 'puntos',
    winner: null,
    scores: [1, 1, 1, 1],
    available: 180,
    times: [190, 10, 0, 5],
    filled: 49,
  });
  assert.equal(params.players, 4);
  assert.equal(params.end_reason, 'board_full');
  assert.equal(params.result, 'draw');
  assert.equal(params.time_used_max, 180);
  assert.equal(params.time_left_p4, 5);
});

test('ideas open an email with the subject filled in and the target is configurable', () => {
  assert.equal(ideasHref(), 'mailto:hola@juegaoso.com?subject=Ideas%20para%20OSO');
  assert.equal(TIMEOUT_TARGET, 0.5);
});

test('the 👍/👎 question picks good moments and does not nag', () => {
  const ask = (state, context = {}) =>
    feedbackMoment({
      state: { lastAsk: 0, answered: null, ...state },
      version: '2.4.0',
      mode: 'two',
      winner: 0,
      sessionGames: 1,
      ...context,
    });
  assert.equal(ask({ games: 1 }), 'first_game');
  assert.equal(ask({ games: 2 }), null);
  assert.equal(ask({ games: 4 }, { sessionGames: 3 }), 'streak');
  assert.equal(ask({ games: 4 }, { mode: 'solo', winner: 0 }), 'beat_machine');
  assert.equal(ask({ games: 1 }, { mode: 'solo', winner: 1 }), null, 'not right after the machine wins');
  assert.equal(ask({ games: 5, lastAsk: 1 }, { sessionGames: 3 }), null, 'cooldown');
  assert.equal(ask({ games: 6, lastAsk: 1 }, { sessionGames: 6 }), 'streak');
  assert.equal(ask({ games: 9, answered: '2.4.0' }, { sessionGames: 3 }), null, 'answered in this version');
  assert.equal(ask({ games: 9, answered: '2.3.1' }, { sessionGames: 3 }), 'streak', 'new minor version');
});
