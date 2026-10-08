import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findNew,
  rebuildScores,
  bestHint,
  chooseMachineMove,
  replayHistory,
  timeFor,
} from '../../public/js/engine.js';

const parse = (rows) =>
  rows
    .join('')
    .replaceAll('.', ' ')
    .split('')
    .map((c) => (c === ' ' ? '' : c));

test('timeFor gives 30-second steps that grow with the board', () => {
  assert.equal(timeFor(4), 90);
  assert.equal(timeFor(5), 120);
  assert.equal(timeFor(8), 240);
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

test('hard machine takes the scoring move, else the centre; it never mutates the board', () => {
  const board = parse(['OS..', '....', '....', '....']);
  const copy = [...board];
  assert.deepEqual(chooseMachineMove(board, 4, new Map(), 'OSO', 'hard'), { index: 2, letter: 'O' });
  assert.deepEqual(board, copy);
  assert.deepEqual(chooseMachineMove(Array(25).fill(''), 5, new Map(), 'OSO', 'hard'), {
    index: 12,
    letter: 'O',
  });
});

test('easy machine scores when the dice allow it and always returns a legal move', () => {
  const board = parse(['OS..', '....', '....', '....']);
  assert.deepEqual(
    chooseMachineMove(board, 4, new Map(), 'OSO', 'easy', () => 0),
    { index: 2, letter: 'O' },
  );
  const move = chooseMachineMove(board, 4, new Map(), 'OSO', 'easy', () => 0.99);
  assert.equal(board[move.index], '');
  assert.ok(['O', 'S'].includes(move.letter));
  assert.equal(chooseMachineMove(Array(16).fill('S'), 4, new Map(), 'OSO', 'easy'), null);
});
