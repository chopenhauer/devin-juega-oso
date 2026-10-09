// Session leaderboard: consecutive games between the same players. Changing the
// players (names, avatars, mode or machine difficulty) starts a new session;
// changing the board size keeps it.
export const sessionKey = ({ mode, difficulty, names, avatars }) =>
  JSON.stringify([mode, mode === 'solo' ? difficulty : '', names, avatars]);

export function recordGame(session, key, { scores, winner, size }) {
  const games = session?.key === key && Array.isArray(session.games) ? session.games : [];
  return { key, games: [...games, { scores: [...scores], winner, size }] };
}

export function standings(session) {
  const games = session?.games ?? [];
  const players = games[0]?.scores.length ?? 2;
  const wins = Array(players).fill(0),
    points = Array(players).fill(0);
  let draws = 0;
  for (const g of games) {
    const winners = g.winner === null ? [] : [g.winner].flat();
    if (!winners.length) draws++;
    winners.forEach((w) => wins[w]++);
    g.scores.forEach((s, i) => (points[i] += s));
  }
  return { games: games.length, wins, points, draws };
}
