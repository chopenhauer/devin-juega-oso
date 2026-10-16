// Pure game rules: no DOM, no globals. A board is a flat array of '', 'O' or 'S'
// with size*size cells; a sequence key is "a-b-c" (three cell indices).

import { GAME } from './config.js';

export const LETTERS = ['O', 'S'];
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

// Seconds on each player's clock for an n×n board (GAME.board.seconds).
export const timeFor = (n) => GAME.board.seconds[n];

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

const centrality = (size, index) => {
  const center = (size - 1) / 2;
  const r = Math.floor(index / size);
  const c = index % size;
  return 1 / (1 + Math.abs(r - center) + Math.abs(c - center));
};

// Placing a letter on `work` and taking it back: cheaper than copying the board for every try.
const gainAt = (work, size, scored, index, letter, word) => {
  work[index] = letter;
  const gain = findNew(work, size, scored, index, word).length;
  work[index] = '';
  return gain;
};

const scoringMoves = (work, size, scored, word) =>
  emptyCells(work).flatMap((index) =>
    LETTERS.flatMap((letter) => {
      const gain = gainAt(work, size, scored, index, letter, word);
      return gain ? [{ index, letter, gain }] : [];
    }),
  );

// Empty cells that share a line of three with `index` (the only ones a letter there can open).
function neighbours(size, index) {
  const r0 = Math.floor(index / size);
  const c0 = index % size;
  const cells = new Set();
  for (const [dr, dc] of [...DIRECTIONS, ...DIRECTIONS.map(([r, c]) => [-r, -c])]) {
    for (let k = 1; k <= 2; k++) {
      const r = r0 + k * dr;
      const c = c0 + k * dc;
      if (r >= 0 && c >= 0 && r < size && c < size) cells.add(r * size + c);
    }
  }
  return [...cells];
}

// True when, on a board with nothing to score, `letter` at `index` leaves an OSO for the rival.
function opens(work, size, scored, index, letter, word) {
  work[index] = letter;
  const open = neighbours(size, index).some(
    (j) => !work[j] && LETTERS.some((l) => gainAt(work, size, scored, j, l, word)),
  );
  work[index] = '';
  return open;
}

// Points the rival would chain if it took every OSO left after `letter` at `index`.
function giveaway(work, size, scored, index, letter, word) {
  work[index] = letter;
  const taken = new Map(scored);
  const placed = [];
  let points = 0;
  for (;;) {
    const best = scoringMoves(work, size, taken, word).sort((a, b) => b.gain - a.gain)[0];
    if (!best) break;
    work[best.index] = best.letter;
    placed.push(best.index);
    for (const key of findNew(work, size, taken, best.index, word)) taken.set(key, 1);
    points += best.gain;
  }
  for (const i of [index, ...placed]) work[i] = '';
  return points;
}

// Cells where the rival could still play without opening an OSO for the machine.
const safeCells = (work, size, scored, word) =>
  emptyCells(work).filter((i) => LETTERS.some((l) => !opens(work, size, scored, i, l, word)));

// Extreme quiet move. Safe moves only; near the end it counts the rival's safe cells and prefers
// leaving none, or an even number (with independent cells, whoever faces an even count runs out
// first and has to give points away).
function extremeQuiet(work, size, scored, word, random) {
  const moves = emptyCells(work).flatMap((index) => LETTERS.map((letter) => ({ index, letter })));
  const safe = moves.filter(({ index, letter }) => !opens(work, size, scored, index, letter, word));
  if (!safe.length) {
    const cost = moves.map((m) => ({ ...m, points: giveaway(work, size, scored, m.index, m.letter, word) }));
    cost.sort((a, b) => a.points - b.points || centrality(size, b.index) - centrality(size, a.index));
    return { index: cost[0].index, letter: cost[0].letter };
  }
  const lookahead = new Set(safe.map((m) => m.index)).size <= GAME.machine.extremeLookahead;
  let best = null;
  let bestScore = -Infinity;
  for (const { index, letter } of safe) {
    let score = centrality(size, index) + random() * 0.5;
    if (lookahead) {
      work[index] = letter;
      const left = safeCells(work, size, scored, word).length;
      work[index] = '';
      score += left === 0 ? 1000 : left % 2 === 0 ? 100 - left : -left;
    }
    if (score > bestScore) {
      bestScore = score;
      best = { index, letter };
    }
  }
  return best;
}

// easy / hard: takes an OSO within reach with probability GAME.machine.easyAim / hardAim (the
// biggest one); otherwise a random move among the GAME.machine.pool most central ones that don't
// score, so it can leave OSOs for the rival.
// extreme: always takes the biggest OSO; otherwise a move that leaves nothing to score and, near
// the end, traps the rival into having to give points away.
export function chooseMachineMove(board, size, scored, word, difficulty, random = Math.random) {
  const work = [...board];
  const empties = emptyCells(work);
  if (!empties.length) return null;

  const scoring = scoringMoves(work, size, scored, word).sort((a, b) => b.gain - a.gain);
  const aim = { easy: GAME.machine.easyAim, hard: GAME.machine.hardAim }[difficulty] ?? 1;
  if (scoring.length && (aim >= 1 || random() < aim)) {
    const { index, letter } = scoring[0];
    return { index, letter };
  }
  if (difficulty === 'extreme') return extremeQuiet(work, size, scored, word, random);

  const quiet = empties.flatMap((index) =>
    LETTERS.filter((letter) => !gainAt(work, size, scored, index, letter, word)).map((letter) => ({
      index,
      letter,
      score: centrality(size, index) + random(),
    })),
  );
  if (!quiet.length) {
    const { index, letter } = scoring[0];
    return { index, letter };
  }
  quiet.sort((a, b) => b.score - a.score);
  const pool = quiet.slice(0, Math.min(GAME.machine.pool, quiet.length));
  const { index, letter } = pool[Math.floor(random() * pool.length)];
  return { index, letter };
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
