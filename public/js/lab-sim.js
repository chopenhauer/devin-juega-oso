// Simulator of Julia's lab: plays many games without clock between the machine (with the values
// being tried) and practice players of several levels, with the same rules as the game (an OSO
// gives another turn). Pure and seeded, so the same values always give the same chart.
import { findNew, chooseMachineMove } from './engine.js';

// Small seeded random generator (mulberry32).
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Practice player: takes an OSO within reach with probability `skill`, like a person who sees
// some of them.
const practice = (skill) => ({ easyAim: skill, hardAim: skill, pool: 12 });

// One game; returns 'player', 'machine' or 'draw'.
export function playGame({ size, difficulty, machine, skill, random, playerFirst = true }) {
  const board = Array(size * size).fill('');
  const scored = new Map();
  const scores = [0, 0];
  let turn = playerFirst ? 0 : 1;
  for (let moves = 0; moves < size * size; moves++) {
    const move =
      turn === 0
        ? chooseMachineMove(board, size, scored, 'OSO', 'easy', random, practice(skill))
        : chooseMachineMove(board, size, scored, 'OSO', difficulty, random, machine);
    board[move.index] = move.letter;
    const made = findNew(board, size, scored, move.index, 'OSO');
    made.forEach((k) => scored.set(k, turn));
    scores[turn] += made.length;
    if (!made.length) turn = 1 - turn;
  }
  return scores[0] > scores[1] ? 'player' : scores[1] > scores[0] ? 'machine' : 'draw';
}

// Share of games won by the practice player at each skill, half of them starting.
export function simulate({
  size = 5,
  difficulty = 'easy',
  machine,
  skills = [0.2, 0.5, 0.8],
  games = 200,
  seed = 1,
}) {
  const random = seeded(seed);
  return skills.map((skill) => {
    const result = { skill, player: 0, machine: 0, draw: 0 };
    for (let g = 0; g < games; g++)
      result[playGame({ size, difficulty, machine, skill, random, playerFirst: g % 2 === 0 })]++;
    return { ...result, playerShare: result.player / games };
  });
}
