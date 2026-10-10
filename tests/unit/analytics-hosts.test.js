import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function run(file, hostname) {
  const added = [];
  const window = {
    location: { hostname },
    addEventListener() {},
  };
  const context = {
    window,
    document: { createElement: () => ({}), head: { appendChild: (el) => added.push(el.src) } },
    localStorage: { getItem: () => 'granted' },
  };
  vm.runInNewContext(read(file), { ...context, ...window });
  return added;
}

for (const file of ['public/js/ga.js', 'public/js/clarity.js']) {
  test(`${file} loads on production hosts`, () => {
    for (const host of ['juegaoso.com', 'www.juegaoso.com', 'devin-juega-oso.vercel.app']) {
      assert.equal(run(file, host).length, 1, host);
    }
  });

  test(`${file} does not load on Vercel previews`, () => {
    for (const host of [
      'devin-juega-iyik6cu9g-vilarequi.vercel.app',
      'devin-juega-oso-git-x-vilarequi.vercel.app',
    ]) {
      assert.deepEqual(run(file, host), [], host);
    }
  });
}
