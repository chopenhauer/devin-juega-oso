import { test } from 'node:test';
import assert from 'node:assert/strict';
import { swallowed } from '../../public/js/report.js';

test('a failing best-effort feature leaves one console warning per place, not one per call', (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const error = new Error('QuotaExceededError');
  swallowed('test: save', error);
  swallowed('test: save', error);
  swallowed('test: read', error);
  assert.deepEqual(
    warn.mock.calls.map((c) => c.arguments),
    [
      ['OSO: test: save', error],
      ['OSO: test: read', error],
    ],
  );
});
