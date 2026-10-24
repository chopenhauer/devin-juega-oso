import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pushSupported, shouldAsk } from '../../public/js/push.js';

test('asks for the 🔔 notice only once, after the first reto of the day', () => {
  const base = { supported: true, permission: 'default', asked: false, first: true, quiet: false };
  assert.equal(shouldAsk(base), true);
  assert.equal(shouldAsk({ ...base, first: false }), false);
  assert.equal(shouldAsk({ ...base, asked: true }), false);
  assert.equal(shouldAsk({ ...base, permission: 'denied' }), false);
  assert.equal(shouldAsk({ ...base, permission: 'granted' }), false);
  assert.equal(shouldAsk({ ...base, supported: false }), false);
  assert.equal(shouldAsk({ ...base, quiet: true }), false);
});

test('needs a service worker, PushManager and Notification (iPhone only once installed)', () => {
  const full = { navigator: { serviceWorker: {} }, PushManager: class {}, Notification: class {} };
  assert.equal(pushSupported(full), true);
  assert.equal(pushSupported({ ...full, PushManager: undefined }), false);
  assert.equal(pushSupported({ navigator: {} }), false);
});
