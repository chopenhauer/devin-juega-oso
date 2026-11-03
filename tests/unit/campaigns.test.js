import { test } from 'node:test';
import assert from 'node:assert/strict';
import { origin, fresh, CAMPAIGNS, SHARED } from '../../public/js/campaigns.js';

test('a shared link gives its campaign and source', () => {
  assert.deepEqual(origin('?utm_source=whatsapp&utm_medium=share&utm_campaign=racha'), {
    campaign: 'racha',
    source: 'whatsapp',
  });
  assert.deepEqual(origin('?reto=abc&utm_source=copy&utm_medium=share&utm_campaign=reto'), {
    campaign: 'reto',
    source: 'copy',
  });
});

test('unknown campaigns and sources become «otra», never the value itself', () => {
  assert.deepEqual(origin('?utm_campaign=verano2027&utm_source=tiktok'), {
    campaign: 'otra',
    source: 'otra',
  });
});

test('our rules page and search engines are told apart from direct visits', () => {
  assert.deepEqual(origin('?desde=como-jugar'), { campaign: 'como_jugar', source: 'web' });
  assert.deepEqual(origin('', 'https://www.google.es/'), { campaign: 'buscador' });
  assert.deepEqual(origin('', 'https://duckduckgo.com/'), { campaign: 'buscador' });
  assert.deepEqual(origin('', 'https://notgoogle.example/'), {});
  assert.deepEqual(origin('', ''), {});
});

test('a device is new until it starts its first game', () => {
  const storage = (value) => ({ getItem: () => value });
  assert.equal(fresh(storage(null)), true);
  assert.equal(fresh(storage('{"mode":"solo"}')), false);
  assert.equal(
    fresh({
      getItem() {
        throw new Error('blocked');
      },
    }),
    false,
  );
});

test('shared campaigns are known campaigns', () => {
  for (const c of SHARED) assert.ok(CAMPAIGNS.includes(c), c);
});
