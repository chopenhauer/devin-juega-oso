// Challenge links against the machine: ?reto=5-hard-9-4&tema=halloween means «5×5 in Difícil,
// I won 9 to 4, beat that». Beating it = winning by a wider margin (the machine has luck in it,
// so the margin is fairer than the points); after a loss, any win beats it.
import { BOARD_SIZES } from './config.js';
import { THEMES } from './themes.js';

const RE = /^(\d{1,2})-(easy|hard|extreme)-(\d{1,3})-(\d{1,3})$/;

export function parseChallenge(search) {
  const params = new URLSearchParams(search);
  const m = RE.exec(params.get('reto') ?? '');
  if (!m || !BOARD_SIZES.includes(+m[1])) return null;
  const theme = params.get('tema');
  return {
    size: +m[1],
    difficulty: m[2],
    mine: +m[3],
    theirs: +m[4],
    theme: theme && Object.hasOwn(THEMES, theme) ? theme : null,
  };
}

export const challengeParam = ({ size, difficulty, mine, theirs }) =>
  `${size}-${difficulty}-${mine}-${theirs}`;

// Points of margin needed to beat it.
export const challengeTarget = (c) => Math.max(c.mine - c.theirs, 0) + 1;

export function challengeOutcome(c, [mine, theirs]) {
  const missing = challengeTarget(c) - (mine - theirs);
  return { beaten: missing <= 0, missing: Math.max(missing, 0) };
}
