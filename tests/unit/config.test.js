import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BOARD_SIZES, GAME, HELP, SECTIONS, configValue } from '../../public/js/config.js';
import { buildConfigDoc, out } from '../../scripts/config-doc.js';
import { SECRETS } from '../../public/js/secrets.js';

const leaves = Object.entries(GAME).flatMap(([s, o]) => Object.keys(o).map((k) => `${s}.${k}`));
const positive = (path) => assert.ok(configValue(path) > 0, `${path} must be > 0`);

test('every parameter is explained and belongs to a section', () => {
  assert.deepEqual(Object.keys(SECTIONS), Object.keys(GAME));
  assert.deepEqual([...leaves].sort(), Object.keys(HELP).sort());
  for (const path of leaves) assert.ok(HELP[path].length > 10, path);
});

test('parameters are frozen so nothing changes them at run time', () => {
  assert.ok(Object.isFrozen(GAME) && Object.isFrozen(GAME.board.seconds));
});

test('boards: sizes in order, positive times that grow, default and 4-player minimum exist', () => {
  assert.ok(BOARD_SIZES.length > 0);
  BOARD_SIZES.forEach((n, i) => {
    assert.ok(Number.isInteger(n) && n >= 3 && n <= 10, `size ${n}`);
    if (i)
      assert.ok(n > BOARD_SIZES[i - 1] && GAME.board.seconds[n] >= GAME.board.seconds[BOARD_SIZES[i - 1]]);
    assert.ok(Number.isInteger(GAME.board.seconds[n]) && GAME.board.seconds[n] > 0);
  });
  assert.ok(BOARD_SIZES.includes(GAME.board.defaultSize));
  assert.ok(BOARD_SIZES.includes(GAME.board.fourPlayersMinSize));
});

test('extras are whole numbers of uses; chances are between 0 and 1', () => {
  for (const [k, v] of Object.entries(GAME.extras)) assert.ok(Number.isInteger(v) && v >= 0, k);
  for (const path of ['machine.easyAim', 'machine.hardAim', 'telemetry.timeoutTarget', 'sound.volume']) {
    const v = configValue(path);
    assert.ok(v >= 0 && v <= 1, path);
  }
  assert.ok(Number.isInteger(GAME.machine.pool) && GAME.machine.pool >= 1);
  assert.ok(GAME.machine.easyAim < GAME.machine.hardAim);
});

test('times, counts and limits are positive and consistent', () => {
  const rest = leaves.filter((p) => !/^(board|extras)\.|Chance$|timeoutTarget|volume/.test(p));
  rest.forEach(positive);
  assert.ok(GAME.clock.lowSeconds < GAME.board.seconds[BOARD_SIZES[0]]);
  assert.ok(GAME.online.closeAfterMinutes * 60 < GAME.online.roomHours * 3600);
  assert.ok(GAME.online.nudgeSeconds * 1000 > GAME.online.pollMs);
  assert.ok(GAME.themes.menuMax <= GAME.themes.listMax);
  assert.ok(GAME.secrets.holdRingMs < GAME.secrets.holdMs, 'ring before the secret');
  for (const k of ['hintSeconds', 'swapSeconds', 'sosSeconds'])
    assert.ok(GAME.shop[k] < GAME.board.seconds[BOARD_SIZES[0]], `shop.${k} must be affordable`);
  for (const k of ['streak', 'cooldown', 'gamesPerSecret'])
    assert.ok(Number.isInteger(GAME.feedback[k] ?? GAME.secrets[k]), k);
});

test('texts follow the parameters: HTML defaults, the 🎨 secret and docs/CONFIG.md', () => {
  const html = readFileSync(new URL('../../public/index.html', import.meta.url), 'utf8');
  const spans = [...html.matchAll(/data-config="([\w.]+)">([^<]*)</g)];
  assert.ok(spans.length > 0);
  for (const [, path, text] of spans) assert.equal(text, String(configValue(path)), path);
  assert.doesNotMatch(html, /<option value="\d"/, 'board options are generated from config.js');
  const temas = SECRETS.find((s) => s.id === 'temas');
  assert.match(temas.how, GAME.secrets.holdMs === 1500 ? /durante 1,5 segundos/ : /segundo/);
  assert.equal(readFileSync(out, 'utf8'), buildConfigDoc(), 'docs/CONFIG.md is stale: run `npm run config`');
});
