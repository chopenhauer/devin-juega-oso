import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseChallenge,
  challengeParam,
  challengeTarget,
  challengeOutcome,
} from '../../public/js/challenge.js';

test('reads a challenge link and writes it back', () => {
  const c = parseChallenge('?reto=5-hard-9-4&tema=halloween&utm_source=whatsapp');
  assert.deepEqual(c, { size: 5, difficulty: 'hard', mine: 9, theirs: 4, theme: 'halloween' });
  assert.equal(challengeParam(c), '5-hard-9-4');
});

test('ignores broken links and unknown themes', () => {
  for (const q of ['', '?reto=5-hard-9', '?reto=99-hard-1-0', '?reto=5-pro-1-0', '?reto=5-hard-x-1'])
    assert.equal(parseChallenge(q), null, q);
  assert.equal(parseChallenge('?reto=4-easy-3-1&tema=nope').theme, null);
});

test('beating it means winning by a wider margin; after a loss any win does', () => {
  const won = { size: 5, difficulty: 'hard', mine: 9, theirs: 4, theme: null };
  assert.equal(challengeTarget(won), 6);
  assert.deepEqual(challengeOutcome(won, [10, 4]), { beaten: true, missing: 0 });
  assert.deepEqual(challengeOutcome(won, [9, 4]), { beaten: false, missing: 1 });
  assert.deepEqual(challengeOutcome(won, [3, 5]), { beaten: false, missing: 8 });
  const lost = { ...won, mine: 2, theirs: 7 };
  assert.equal(challengeTarget(lost), 1);
  assert.deepEqual(challengeOutcome(lost, [4, 3]), { beaten: true, missing: 0 });
  assert.deepEqual(challengeOutcome(lost, [3, 3]), { beaten: false, missing: 1 });
});
