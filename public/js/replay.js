// «Ver la partida»: the finished game again, move by move. Pure (no DOM), so it can be tested.
// Scored with the final word, as the 🛟 rescores the whole game with it.
import { findNew, replayMove, LETTERS } from './engine.js';

// OSOs the next player could make in one move that use the cell just played.
function gifts(board, size, scored, index, word) {
  const keys = new Set();
  board.forEach((v, cell) => {
    if (v) return;
    for (const letter of LETTERS) {
      const trial = [...board];
      trial[cell] = letter;
      for (const k of findNew(trial, size, scored, cell, word))
        if (k.split('-').map(Number).includes(index)) keys.add(k);
    }
  });
  return keys.size;
}

export function replaySteps(size, history, word, players = 2) {
  let state = { size, board: Array(size * size).fill(''), scored: new Map(), scores: Array(players).fill(0) };
  return history.map((move) => {
    const before = state.scored;
    state = replayMove(state, move, word);
    const made = [...state.scored.keys()].filter((k) => !before.has(k));
    return {
      move,
      board: state.board,
      scored: state.scored,
      scores: state.scores,
      made,
      // Scoring keeps the turn, so only a move that scores nothing can hand the rival a point.
      gift: made.length || move.power ? 0 : gifts(state.board, size, state.scored, move.index, word),
    };
  });
}
