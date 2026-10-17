import test from 'node:test';
import assert from 'node:assert/strict';
import { replaySteps } from '../../public/js/replay.js';

test('each step has the board, the scores and the OSOs it made', () => {
  const steps = replaySteps(
    4,
    [
      { player: 0, index: 0, letter: 'O' },
      { player: 1, index: 1, letter: 'S' },
      { player: 0, index: 2, letter: 'O' },
    ],
    'OSO',
  );
  assert.equal(steps.length, 3);
  assert.deepEqual(steps[0].board.slice(0, 3), ['O', '', '']);
  assert.deepEqual(steps[2].made, ['0-1-2']);
  assert.deepEqual(steps[2].scores, [1, 0]);
  assert.equal(steps[2].scored.get('0-1-2'), 0);
});

test('a move that leaves an OSO ready for the rival is a gift', () => {
  const steps = replaySteps(
    4,
    [
      { player: 0, index: 0, letter: 'O' },
      { player: 1, index: 1, letter: 'S' },
    ],
    'OSO',
  );
  assert.equal(steps[0].gift, 0);
  assert.equal(steps[1].gift, 1);
});

test('a move that scores is never a gift (the turn goes on)', () => {
  const steps = replaySteps(
    4,
    [
      { player: 0, index: 0, letter: 'O' },
      { player: 1, index: 5, letter: 'S' },
      { player: 1, index: 10, letter: 'O' },
    ],
    'OSO',
  );
  assert.equal(steps[1].gift, 1);
  assert.deepEqual(steps[2].made, ['0-5-10']);
  assert.equal(steps[2].gift, 0);
});

test('the replay is scored with the final word', () => {
  const steps = replaySteps(
    3,
    [
      { player: 0, index: 0, letter: 'S' },
      { player: 1, index: 1, letter: 'O' },
      { player: 0, index: 2, letter: 'S' },
    ],
    'SOS',
  );
  assert.deepEqual(steps[2].made, ['0-1-2']);
});
