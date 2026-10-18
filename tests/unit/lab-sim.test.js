import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulate, seeded } from '../../public/js/lab-sim.js';

const machine = (easyAim) => ({ easyAim, hardAim: 0.8, pool: 6 });

test('the simulator is repeatable and adds up', () => {
  const a = simulate({ machine: machine(0.5), games: 40, seed: 7 });
  assert.deepEqual(a, simulate({ machine: machine(0.5), games: 40, seed: 7 }));
  for (const r of a) assert.equal(r.player + r.machine + r.draw, 40);
  assert.notEqual(seeded(1)(), seeded(2)());
});

test('an easier machine lets the practice players win more', () => {
  const share = (aim) =>
    simulate({ machine: machine(aim), skills: [0.5], games: 150, seed: 3 })[0].playerShare;
  assert.ok(share(0.1) > share(0.9), `${share(0.1)} vs ${share(0.9)}`);
});
