import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VERSION } from '../../public/js/version.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('the footer version matches package.json and the latest CHANGELOG entry', () => {
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(JSON.parse(read('package.json')).version, VERSION);
  assert.equal(read('CHANGELOG.md').match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1], VERSION);
});
