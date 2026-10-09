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

const { easterSunday, festivalOn, themeMenuFor, MENU_MAX, LIST_MAX } =
  await import('../../public/js/themes.js');

test('movable dates: Easter and Thanksgiving', () => {
  assert.equal(easterSunday(2026), Date.UTC(2026, 3, 5));
  assert.equal(easterSunday(2027), Date.UTC(2027, 2, 28));
  assert.equal(festivalOn(new Date(2026, 3, 5)), 'easter');
  assert.equal(festivalOn(new Date(2026, 1, 16)), 'carnival');
  assert.equal(festivalOn(new Date(2026, 10, 26)), 'thanksgiving');
  assert.equal(festivalOn(new Date(2027, 10, 25)), 'thanksgiving');
});

test('a festival switches on only on its day; seasons and places never do', () => {
  assert.equal(festivalOn(new Date(2026, 6, 7)), 'sanfermin');
  assert.equal(festivalOn(new Date(2026, 6, 8)), null);
  assert.equal(festivalOn(new Date(2026, 1, 14)), 'valentine');
  assert.equal(festivalOn(new Date(2027, 0, 1)), 'newyear');
  assert.equal(festivalOn(new Date(2026, 9, 31)), 'halloween');
  assert.equal(festivalOn(new Date(2026, 4, 10)), null);
});

test('the menu shows Clásico plus nearby dates, at most 5, and 10 with «Ver otros»', () => {
  const oct = themeMenuFor(new Date(2026, 9, 8));
  assert.equal(oct.menu[0], 'classic');
  assert.ok(oct.menu.includes('halloween') && oct.menu.includes('autumn'));
  assert.ok(!oct.menu.includes('christmas'));
  assert.equal(oct.others[0], 'birthday');
  assert.equal(themeMenuFor(new Date(2026, 6, 7)).menu[1], 'sanfermin');
  for (let d = 0; d < 366; d++) {
    const { menu, others, hidden } = themeMenuFor(new Date(2026, 0, 1 + d));
    assert.ok(menu.length <= MENU_MAX && menu.length + others.length <= LIST_MAX);
    assert.deepEqual([...menu, ...others, ...hidden].sort(), [...THEME_IDS].sort());
  }
});

test('the current theme is always reachable without the easter egg', () => {
  const { hidden } = themeMenuFor(new Date(2026, 9, 8));
  const pick = hidden[0];
  const withIt = themeMenuFor(new Date(2026, 9, 8), pick);
  assert.ok(withIt.others.includes(pick) && !withIt.hidden.includes(pick));
  assert.ok(withIt.menu.length + withIt.others.length <= LIST_MAX);
});
