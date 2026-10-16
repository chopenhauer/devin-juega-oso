import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findNew,
  rebuildScores,
  bestHint,
  chooseMachineMove,
  replayHistory,
  replayMove,
  timeFor,
} from '../../public/js/engine.js';
import { GAME } from '../../public/js/config.js';

const parse = (rows) =>
  rows
    .join('')
    .replaceAll('.', ' ')
    .split('')
    .map((c) => (c === ' ' ? '' : c));

test('timeFor gives 30-second steps that grow with the board', () => {
  assert.equal(timeFor(4), 60);
  assert.equal(timeFor(5), 90);
  assert.equal(timeFor(8), 210);
});

test('findNew detects rows, columns and both diagonals through the placed cell', () => {
  const size = 4;
  assert.deepEqual(findNew(parse(['OSO.', '....', '....', '....']), size, new Map(), 1, 'OSO'), ['0-1-2']);
  assert.deepEqual(findNew(parse(['O...', 'S...', 'O...', '....']), size, new Map(), 8, 'OSO'), ['0-4-8']);
  assert.deepEqual(findNew(parse(['O...', '.S..', '..O.', '....']), size, new Map(), 0, 'OSO'), ['0-5-10']);
  assert.deepEqual(findNew(parse(['..O.', '.S..', 'O...', '....']), size, new Map(), 5, 'OSO'), ['2-5-8']);
});

test('findNew ignores already scored sequences and sequences that wrap around rows', () => {
  const board = parse(['OSO.', '....', '....', '....']);
  assert.deepEqual(findNew(board, 4, new Map([['0-1-2', 0]]), 1, 'OSO'), []);
  assert.deepEqual(findNew(parse(['..OS', 'O...', '....', '....']), 4, new Map(), 3, 'OSO'), []);
});

test('rebuildScores keeps surviving owners, removes destroyed ones and credits new ones', () => {
  const board = parse(['OSO.', 'OSO.', '....', '....']);
  const previous = new Map([
    ['0-1-2', 1],
    ['8-9-10', 0],
  ]);
  const { scored, scores } = rebuildScores(board, 4, 'OSO', previous, 0);
  assert.equal(scored.get('0-1-2'), 1);
  assert.equal(scored.get('4-5-6'), 0);
  assert.equal(scored.has('8-9-10'), false);
  assert.deepEqual(scores, [1, 1]);
});

test('B03: SOS replay drops a sequence destroyed by a swap', () => {
  const history = [
    { player: 0, index: 0, letter: 'S' },
    { player: 1, index: 1, letter: 'O' },
    { player: 0, index: 2, letter: 'S' },
    { power: 'swap', player: 1, index: 0 },
  ];
  const withSwap = replayHistory(5, history, 'SOS');
  assert.deepEqual(withSwap.board.slice(0, 3), ['O', 'O', 'S']);
  assert.deepEqual(withSwap.scores, [0, 0]);
  assert.equal(withSwap.scored.size, 0);

  const withoutSwap = replayHistory(5, history.slice(0, 3), 'SOS');
  assert.deepEqual(withoutSwap.scores, [1, 0]);
  assert.equal(withoutSwap.scored.get('0-1-2'), 0);
});

test('bestHint suggests a scoring move, otherwise the central cell with the fallback letter', () => {
  assert.deepEqual(bestHint(parse(['O.O.', '....', '....', '....']), 4, new Map(), 'OSO', 'O'), {
    index: 1,
    letter: 'S',
  });
  assert.deepEqual(bestHint(Array(25).fill(''), 5, new Map(), 'OSO', 'S'), { index: 12, letter: 'S' });
  assert.equal(bestHint(Array(16).fill('O'), 4, new Map(), 'OSO', 'O'), null);
});

const dice = (value) => () => value;
// Whether, after `move`, the rival has an OSO within reach.
const gives = (board, size, move) => {
  const next = [...board];
  next[move.index] = move.letter;
  return next.some(
    (cell, i) =>
      !cell &&
      ['O', 'S'].some((letter) => {
        const trial = [...next];
        trial[i] = letter;
        return findNew(trial, size, new Map(), i, 'OSO').length > 0;
      }),
  );
};
const bestHintScores = (state) => {
  const hint = bestHint(state.board, state.size, state.scored, 'OSO', 'O');
  if (!hint) return false;
  const trial = [...state.board];
  trial[hint.index] = hint.letter;
  return findNew(trial, state.size, state.scored, hint.index, 'OSO').length > 0;
};
const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

test('easy and hard take an OSO within reach as often as GAME.machine.easyAim / hardAim say', () => {
  const board = parse(['OS..', '....', '....', '....']);
  const copy = [...board];
  for (const [level, aim] of [
    ['easy', GAME.machine.easyAim],
    ['hard', GAME.machine.hardAim],
  ]) {
    assert.deepEqual(chooseMachineMove(board, 4, new Map(), 'OSO', level, dice(aim - 0.01)), {
      index: 2,
      letter: 'O',
    });
    const miss = chooseMachineMove(board, 4, new Map(), 'OSO', level, dice(aim));
    assert.equal(board[miss.index], '');
    assert.equal(
      findNew(Object.assign([...board], { [miss.index]: miss.letter }), 4, new Map(), miss.index, 'OSO')
        .length,
      0,
    );
  }
  assert.deepEqual(board, copy);
  assert.equal(chooseMachineMove(Array(16).fill('S'), 4, new Map(), 'OSO', 'easy'), null);
});

test('extreme always scores, then never leaves an OSO within reach when it can avoid it', () => {
  const board = parse(['OS..', '....', '....', '....']);
  assert.deepEqual(chooseMachineMove(board, 4, new Map(), 'OSO', 'extreme', dice(0.99)), {
    index: 2,
    letter: 'O',
  });
  for (const rows of [
    ['O...', '....', '....', '....'],
    ['.....', '..S..', '.....', '..O..', '.....'],
  ]) {
    const b = parse(rows);
    for (const r of [0, 0.5, 0.99])
      assert.equal(
        gives(b, rows.length, chooseMachineMove(b, rows.length, new Map(), 'OSO', 'extreme', dice(r))),
        false,
      );
  }
});

test('extreme never leaves an OSO within reach while it has a safe move (games vs easy)', () => {
  const random = seeded(7);
  for (let game = 0; game < 20; game++) {
    let state = { size: 5, board: Array(25).fill(''), scored: new Map(), scores: [0, 0] };
    let player = game % 2;
    while (state.board.some((cell) => !cell)) {
      const level = player ? 'extreme' : 'easy';
      const move = chooseMachineMove(state.board, 5, state.scored, 'OSO', level, random);
      const scores = state.scores[player];
      if (level === 'extreme' && !bestHintScores(state)) {
        const safeExists = state.board.some(
          (cell, i) => !cell && ['O', 'S'].some((letter) => !gives(state.board, 5, { index: i, letter })),
        );
        if (safeExists) assert.equal(gives(state.board, 5, move), false);
      }
      state = replayMove(state, { player, ...move }, 'OSO');
      if (state.scores[player] === scores) player = 1 - player;
    }
  }
});

test('rebuildScores and replayHistory support four players', () => {
  const board = parse(['OSO.', 'OSO.', '....', '....']);
  const { scores } = rebuildScores(board, 4, 'OSO', new Map([['0-1-2', 3]]), 2, 4);
  assert.deepEqual(scores, [0, 0, 1, 1]);
  const history = [
    { player: 0, index: 0, letter: 'O' },
    { player: 1, index: 1, letter: 'S' },
    { player: 2, index: 2, letter: 'O' },
    { player: 2, index: 5, letter: 'S' },
    { player: 3, index: 4, letter: 'O' },
    { player: 3, index: 6, letter: 'O' },
  ];
  assert.deepEqual(replayHistory(4, history, 'OSO', 4).scores, [0, 0, 1, 1]);
});
