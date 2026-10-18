// Rank: Elo-like points per player name, kept only on this device. They give the medal shown on
// the avatar (🥉 🥈 🥇), which never goes down even if the points do. Status only: no advantage.
import { GAME } from './config.js';

const R = GAME.rank;

export const machineRating = (difficulty) =>
  ({ easy: R.machineEasy, hard: R.machineHard, extreme: R.machineExtreme })[difficulty] ?? R.machineEasy;

// Same name, same player: «Julia» and « julia » share their rank.
export const rankId = (name) => (typeof name === 'string' ? name.trim().toLocaleLowerCase('es') : '');

export const expected = (a, b) => 1 / (1 + 10 ** ((b - a) / 400));

// 0 none, 1 bronze, 2 silver, 3 gold.
export const tierFor = (rating) => [R.bronze, R.silver, R.gold].filter((min) => rating >= min).length;

export function entry(store, name) {
  const e = store?.players?.[rankId(name)];
  return Number.isFinite(e?.rating)
    ? { rating: e.rating, games: e.games | 0, tier: e.tier | 0 }
    : { rating: R.start, games: 0, tier: 0 };
}

export const medal = (store, name) => (rankId(name) ? entry(store, name).tier : 0);

// Change of each player's points: compared with every other player, a win scores 1, a loss 0 and
// sharing the result (both won or both lost) ½. With 4 players the change is averaged.
export function deltas(ratings, winners) {
  const won = (i) => winners.includes(i);
  const n = ratings.length;
  return ratings.map((a, i) => {
    let sum = 0;
    ratings.forEach((b, j) => {
      if (j === i) return;
      const score = won(i) === won(j) ? 0.5 : won(i) ? 1 : 0;
      sum += score - expected(a, b);
    });
    return (R.k * sum) / (n - 1);
  });
}

// players: [{ name }] for someone ranked on this device (an empty name is not), or
// [{ rating }] for the machine or an online rival, whose points this device never changes.
// winner: index, array of indexes or null for a draw. Returns the new store and who got a medal.
export function recordRanks(store, players, winner) {
  const winners = winner === null ? [] : [winner].flat();
  const ids = players.map((p) => rankId(p.name));
  const ranked = ids.map((id) => !!id && ids.filter((x) => x === id).length === 1);
  const before = players.map((p, i) => (ranked[i] ? entry(store, p.name) : null));
  const ratings = players.map((p, i) => before[i]?.rating ?? p.rating ?? R.start);
  const change = deltas(ratings, winners);
  const next = { players: { ...(store?.players ?? {}) } };
  const ups = [];
  before.forEach((e, i) => {
    if (!e) return;
    const rating = Math.round(ratings[i] + change[i]);
    const games = e.games + 1;
    const tier = games >= R.provisionalGames ? Math.max(e.tier, tierFor(rating)) : e.tier;
    if (tier > e.tier) ups.push({ player: i, tier });
    next.players[ids[i]] = { rating, games, tier };
  });
  return { store: next, ups };
}
