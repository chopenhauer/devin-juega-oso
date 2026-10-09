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
  const wins = [0, 0],
    points = [0, 0];
  let draws = 0;
  const games = session?.games ?? [];
  for (const g of games) {
    if (g.winner === null) draws++;
    else wins[g.winner]++;
    points[0] += g.scores[0];
    points[1] += g.scores[1];
  }
  return { games: games.length, wins, points, draws };
}
