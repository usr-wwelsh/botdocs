import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, isIndexSizeWarning } from './index-size.js';

test('formatBytes renders human-readable sizes', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1024), '1.0 KB');
  assert.equal(formatBytes(1536 * 1024), '1.5 MB');
  assert.equal(formatBytes(3 * 1024 * 1024), '3.0 MB');
});

test('isIndexSizeWarning trips past the 2MB threshold', () => {
  const mb = 1024 * 1024;
  assert.equal(isIndexSizeWarning(2 * mb - 1), false);
  assert.equal(isIndexSizeWarning(2 * mb), true);
});
