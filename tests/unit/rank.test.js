import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GAME } from '../../public/js/config.js';
import { entry, expected, medal, machineRating, recordRanks, tierFor, deltas } from '../../public/js/rank.js';

const R = GAME.rank;
const play = (store, players, winner, times = 1) => {
  let s = store;
  const ups = [];
  for (let n = 0; n < times; n++) {
    const r = recordRanks(s, players, winner);
    s = r.store;
    ups.push(...r.ups);
  }
  return { store: s, ups };
};

test('like Elo: beating someone stronger gives more than beating someone weaker', () => {
  assert.equal(expected(1000, 1000), 0.5);
  const [vsHard] = deltas([1000, machineRating('hard')], [0]);
  const [vsEasy] = deltas([1000, machineRating('easy')], [0]);
  assert.equal(Math.round(vsHard), 24);
  assert.equal(Math.round(vsEasy), 8);
  const [lostToEasy] = deltas([1000, machineRating('easy')], [1]);
  assert.equal(Math.round(lostToEasy), -24);
  assert.deepEqual(deltas([1000, 1000], []), [0, 0]);
});

test('everyone starts with the same points and no medal; names are trimmed and case-insensitive', () => {
  assert.deepEqual(entry(null, 'Julia'), { rating: R.start, games: 0, tier: 0 });
  const { store } = play(null, [{ name: ' Julia ' }, { rating: machineRating('easy') }], 0);
  assert.equal(entry(store, 'julia').games, 1);
  assert.ok(entry(store, 'JULIA').rating > R.start);
});

test('the machine, empty names and an online rival are never ranked on this device', () => {
  const { store } = play(null, [{ name: 'Julia' }, { name: '' }, { rating: 1500 }, {}], 0);
  assert.deepEqual(Object.keys(store.players), ['julia']);
});

test('two players with the same name are not ranked: nobody can tell them apart', () => {
  const { store } = play(null, [{ name: 'Julia' }, { name: 'julia' }], 0);
  assert.deepEqual(store.players, {});
});

test('medals: none during the first games, then by points; they never go down', () => {
  const vsHard = [{ name: 'Julia' }, { rating: machineRating('hard') }];
  const early = play(null, vsHard, 0, R.provisionalGames - 1);
  assert.ok(entry(early.store, 'Julia').rating >= R.bronze);
  assert.equal(medal(early.store, 'Julia'), 0, 'still provisional');
  const up = play(early.store, vsHard, 0);
  assert.deepEqual(up.ups, [{ player: 0, tier: 1 }]);
  const many = play(up.store, vsHard, 0, 30);
  assert.equal(medal(many.store, 'Julia'), 3);
  const down = play(many.store, vsHard, 1, 30);
  assert.ok(entry(down.store, 'Julia').rating < R.gold, 'points go down');
  assert.equal(medal(down.store, 'Julia'), 3, 'the medal stays');
  assert.deepEqual(down.ups, []);
});

test('tiers follow config.js and four players compare with the other three', () => {
  assert.deepEqual([R.bronze - 1, R.bronze, R.silver, R.gold].map(tierFor), [0, 1, 2, 3]);
  const d = deltas([1000, 1000, 1000, 1000], [2]);
  assert.ok(d[2] > 0 && d[0] < 0 && d[0] === d[1] && d[1] === d[3]);
  const shared = deltas([1000, 1000, 1000, 1000], [0, 1]);
  assert.ok(shared[0] > 0 && shared[2] < 0);
  assert.ok(Math.abs(d.reduce((a, b) => a + b)) < 1e-9, 'points move between players');
});
