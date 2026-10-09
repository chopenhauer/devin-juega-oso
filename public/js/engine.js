// Pure game rules: no DOM, no globals. A board is a flat array of '', 'O' or 'S'
// with size*size cells; a sequence key is "a-b-c" (three cell indices).

export const LETTERS = ['O', 'S'];
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export const timeFor = (n) => Math.ceil((30 + n * n * 3) / 30) * 30;

const emptyCells = (board) => board.flatMap((v, i) => (v ? [] : [i]));

// New (not yet scored) sequences spelling `word` that include cell `idx`.
export function findNew(board, size, scored, idx, word) {
  const r0 = Math.floor(idx / size);
  const c0 = idx % size;
  const found = [];
  for (const [dr, dc] of DIRECTIONS) {
    for (let off = -2; off <= 0; off++) {
      const cells = [];
      for (let k = 0; k < 3; k++) {
        const r = r0 + (off + k) * dr;
        const c = c0 + (off + k) * dc;
        if (r < 0 || c < 0 || r >= size || c >= size) break;
        cells.push(r * size + c);
      }
      if (cells.length === 3 && cells.every((cell, k) => board[cell] === word[k])) {
        const key = cells.join('-');
        if (!scored.has(key) && !found.includes(key)) found.push(key);
      }
    }
  }
  return found;
}

// Recomputes every sequence on the board. Sequences that survive keep their
// owner from `previous`; brand-new ones go to `author`; destroyed ones vanish.
export function rebuildScores(board, size, word, previous, author, players = 2) {
  const scored = new Map();
  const scores = Array(players).fill(0);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const [dr, dc] of DIRECTIONS) {
        const r2 = r + 2 * dr;
        const c2 = c + 2 * dc;
        if (r2 < 0 || c2 < 0 || r2 >= size || c2 >= size) continue;
        const cells = [r * size + c, (r + dr) * size + (c + dc), r2 * size + c2];
        if (cells.every((cell, k) => board[cell] === word[k])) {
          const key = cells.join('-');
          const owner = previous.has(key) ? previous.get(key) : author;
          scored.set(key, owner);
          scores[owner]++;
        }
      }
    }
  }
  return { scored, scores };
}

const gainIfPlaced = (board, size, scored, index, letter, word) => {
  const trial = [...board];
  trial[index] = letter;
  return findNew(trial, size, scored, index, word).length;
};

export function bestHint(board, size, scored, word, fallbackLetter) {
  for (const i of emptyCells(board)) {
    for (const letter of LETTERS) {
      if (gainIfPlaced(board, size, scored, i, letter, word)) return { index: i, letter };
    }
  }
  const empties = emptyCells(board);
  if (!empties.length) return null;
  const center = (size * size - 1) / 2;
  empties.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
  return { index: empties[0], letter: fallbackLetter };
}

function potential(board, size, scored, letter, index, word) {
  if (board[index]) return -999;
  const center = (size - 1) / 2;
  const r = Math.floor(index / size);
  const c = index % size;
  const centrality = 1 / (1 + Math.abs(r - center) + Math.abs(c - center));
  return gainIfPlaced(board, size, scored, index, letter, word) * 100 + centrality;
}

// Easy: takes a scoring move 70% of the time, otherwise a random good-looking one.
// Hard: always takes the best scoring move, otherwise the most central cell.
export function chooseMachineMove(board, size, scored, word, difficulty, random = Math.random) {
  const empties = emptyCells(board);
  if (!empties.length) return null;

  const scoring = [];
  for (const i of empties) {
    for (const letter of LETTERS) {
      const gain = gainIfPlaced(board, size, scored, i, letter, word);
      if (gain > 0) scoring.push({ index: i, letter, gain });
    }
  }

  if (difficulty === 'easy') {
    if (scoring.length && random() < 0.7) {
      scoring.sort((a, b) => b.gain - a.gain);
      const { index, letter } = scoring[0];
      return { index, letter };
    }
    const candidates = empties.flatMap((i) =>
      LETTERS.map((letter) => ({
        index: i,
        letter,
        score: potential(board, size, scored, letter, i, word) + random() * 2,
      })),
    );
    candidates.sort((a, b) => b.score - a.score);
    const pool = candidates.slice(0, Math.min(6, candidates.length));
    const { index, letter } = pool[Math.floor(random() * pool.length)];
    return { index, letter };
  }

  let best = null;
  let bestScore = -Infinity;
  const consider = (index, letter, score) => {
    if (score > bestScore) {
      bestScore = score;
      best = { index, letter };
    }
  };
  for (const { index, letter, gain } of scoring) {
    consider(index, letter, gain * 1000 + potential(board, size, scored, letter, index, word));
  }
  if (best) return best;
  for (const i of empties) {
    for (const letter of LETTERS) {
      consider(i, letter, potential(board, size, scored, letter, i, word) + (letter === 'O' ? 0.15 : 0));
    }
  }
  return best;
}

// Applies one history entry ({player,index,letter} or {power:'swap',player,index})
// during the OSO→SOS replay, with the same semantics as live play.
export function replayMove(state, move, word) {
  const { size } = state;
  const board = [...state.board];
  if (move.power === 'swap') {
    if (board[move.index]) board[move.index] = board[move.index] === 'O' ? 'S' : 'O';
    return {
      size,
      board,
      ...rebuildScores(board, size, word, state.scored, move.player, state.scores.length),
    };
  }
  board[move.index] = move.letter;
  const scored = new Map(state.scored);
  const scores = [...state.scores];
  for (const key of findNew(board, size, scored, move.index, word)) {
    scored.set(key, move.player);
    scores[move.player]++;
  }
  return { size, board, scored, scores };
}

export function replayHistory(size, history, word, players = 2) {
  let state = {
    size,
    board: Array(size * size).fill(''),
    scored: new Map(),
    scores: Array(players).fill(0),
  };
  for (const move of history) state = replayMove(state, move, word);
  return state;
}
