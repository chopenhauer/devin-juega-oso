import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { createLabDataHandler } from '../../api/_labdata.js';
import { makeToken, COOKIE } from '../../api/_labauth.js';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const account = {
  client_email: 'lab@example.iam.gserviceaccount.com',
  token_uri: 'https://oauth2.example/token',
  private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
};
const report = {
  rows: [
    {
      dimensionValues: ['easy', 'machine', 'board_full', '5x5', '(not set)'].map((value) => ({ value })),
      metricValues: [{ value: '17' }],
    },
  ],
};
function fakeFetch() {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    return Response.json(url === account.token_uri ? { access_token: 't' } : report);
  };
  return { calls, fn };
}
const asLab = async (password) =>
  new Request('http://x/api/lab-data', { headers: { cookie: `${COOKIE}=${await makeToken(password)}` } });

test('lab data needs the lab cookie and the GA4 key', async () => {
  const { fn } = fakeFetch();
  assert.equal((await createLabDataHandler({ account, fetchFn: fn })(new Request('http://x'))).status, 503);
  const handle = createLabDataHandler({ password: 'pw', account, fetchFn: fn });
  assert.equal((await handle(new Request('http://x/api/lab-data'))).status, 401);
  assert.equal((await createLabDataHandler({ password: 'pw' })(await asLab('pw'))).status, 503);
});

test('lab data turns GA4 rows into games and caches them for 10 minutes', async () => {
  const { calls, fn } = fakeFetch();
  let now = 1_000;
  const handle = createLabDataHandler({ password: 'pw', account, fetchFn: fn, now: () => now });
  const body = await (await handle(await asLab('pw'))).json();
  assert.deepEqual(body.rows, [
    {
      difficulty: 'easy',
      result: 'machine',
      end_reason: 'board_full',
      board_size: '5x5',
      lab_version: '(not set)',
      games: 17,
    },
  ]);
  assert.match(calls[0].init.body, /assertion=[\w-]+\.[\w-]+\.[\w-]+$/);
  assert.match(JSON.parse(calls[1].init.body).dimensions.at(-1).name, /customEvent:lab_version/);
  await handle(await asLab('pw'));
  assert.equal(calls.length, 2);
  now += 11 * 60 * 1000;
  await handle(await asLab('pw'));
  assert.equal(calls.length, 4);
});
