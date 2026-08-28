import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvesInternalHref } from './validate-site.mjs';

test('directory URLs require an index.html file', () => {
  const files = new Set(['labs']);
  const isFile = (path) => files.has(path);

  assert.equal(resolvesInternalHref('/labs/', isFile), false);
  files.add('labs/index.html');
  assert.equal(resolvesInternalHref('/labs/', isFile), true);
});

test('file URLs resolve to their exact file', () => {
  assert.equal(resolvesInternalHref('/assets/v2.css', (path) => path === 'assets/v2.css'), true);
});
