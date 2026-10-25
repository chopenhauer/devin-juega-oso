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

// What the end screen says about the game just played, given every game of the session (the last
// one included). Returns an i18n key under `end.phrase.` and who it talks about, or null.
export function endPhrase(games, { machine = null } = {}) {
  const last = games.at(-1);
  const w = last?.winner;
  if (w === null || w === undefined || Array.isArray(w)) return null;
  const s = last.scores;
  const margin = s[w] - Math.max(...s.filter((_, i) => i !== w));
  if (w === machine) return { key: margin <= 1 ? 'machine_close' : 'machine' };

  let streak = 0;
  for (let i = games.length - 1; i >= 0 && games[i].winner === w; i--) streak++;
  if (streak >= 3) return { key: 'unstoppable', player: w, count: streak };

  const before = games.slice(0, -1);
  if (s.length === 2 && before.length >= 2) {
    const r = 1 - w;
    const lead = (list) => {
      const { wins } = standings({ games: list });
      return wins[w] === wins[r] ? null : wins[w] > wins[r] ? w : r;
    };
    if (lead(before) === null && before.some((g) => g.winner !== null)) {
      for (let n = before.length - 1; n > 0; n--) {
        const leader = lead(before.slice(0, n));
        if (leader !== null) return { key: leader === w ? 'lead_back' : 'comeback', player: w };
      }
    }
  }
  if (before.length && !before.some((g) => [g.winner].flat().includes(w)))
    return { key: 'first_win', player: w };
  if (margin === 1) return { key: 'close', player: w };
  if (margin >= Math.max(3, s[w] / 2)) return { key: 'rout', player: w };
  return null;
}

// One line under the session scoreboard to make the next game matter (two players only).
export function sessionNudge({ wins }, { machine = null } = {}) {
  if (wins.length !== 2) return null;
  const [a, b] = wins;
  if (a === b) return a ? { key: 'tied' } : null;
  const leader = a > b ? 0 : 1;
  const trailer = 1 - leader;
  const diff = Math.abs(a - b);
  if (diff === 1) return { key: 'can_tie', player: trailer };
  if (leader === machine) return { key: 'machine_ahead', player: trailer };
  return { key: 'ahead', player: leader, count: diff };
}
