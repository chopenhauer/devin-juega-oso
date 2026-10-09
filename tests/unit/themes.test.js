import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, THEME_IDS, themeOf, mapAvatars } from '../../public/js/themes.js';

test('every theme offers the same number of distinct avatars', () => {
  for (const id of THEME_IDS) {
    const { avatars } = THEMES[id];
    assert.equal(avatars.length, THEMES.classic.avatars.length, id);
    assert.equal(new Set(avatars).size, avatars.length, id);
  }
});

test('switching theme keeps each player in the same avatar slot', () => {
  const { classic, halloween, christmas } = THEMES;
  assert.deepEqual(mapAvatars(['🐻', '🐼'], classic, halloween), ['🎃', '🧛']);
  assert.deepEqual(mapAvatars(['🧛', '🎃'], halloween, christmas), ['🎅', '⛄']);
  assert.deepEqual(mapAvatars(['🦊', '🤖'], classic, christmas), ['🥕', '🤖']);
});

test('unknown avatars or themes fall back without clashes', () => {
  assert.equal(themeOf('nope'), THEMES.classic);
  assert.deepEqual(mapAvatars(['x', 'y'], THEMES.classic, THEMES.halloween), ['🎃', '🧛']);
});
