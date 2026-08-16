import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cosineSimilarity } from './similarity.js';

test('returns 1 for identical vectors', () => {
  assert.equal(cosineSimilarity([1, 2, 3], [1, 2, 3]), 1);
});

test('returns 0 for orthogonal vectors', () => {
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
});

test('returns -1 for opposite vectors', () => {
  assert.equal(cosineSimilarity([1, 0], [-1, 0]), -1);
});

test('returns 0 when a vector is all zeros', () => {
  assert.equal(cosineSimilarity([0, 0, 0], [1, 2, 3]), 0);
});

test('throws on mismatched vector lengths', () => {
  assert.throws(() => cosineSimilarity([1, 2], [1, 2, 3]));
});
