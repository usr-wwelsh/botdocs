import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matches, recallAtK, reciprocalRank, summarize } from './metrics.js';

const hit = { sourceFile: 'botdocs/README.md', headingId: 'configuration' };
const miss = { sourceFile: 'fanoutd/README.md', headingId: 'roadmap' };

test('a page-level label matches any section of that page', () => {
  assert.ok(matches('botdocs/README.md', hit));
});

test('a section label only matches that exact section', () => {
  assert.ok(matches('botdocs/README.md#configuration', hit));
  assert.ok(!matches('botdocs/README.md#install', hit));
});

test('recall counts each expected label found within the top k once', () => {
  const ranked = [miss, hit, hit];
  assert.equal(recallAtK(['botdocs/README.md', 'vitalSVG/README.md'], ranked, 5), 0.5);
});

test('recall ignores hits ranked below k', () => {
  assert.equal(recallAtK(['botdocs/README.md'], [miss, hit], 1), 0);
});

test('reciprocal rank is one over the position of the first relevant result', () => {
  assert.equal(reciprocalRank(['botdocs/README.md'], [miss, miss, hit], 10), 1 / 3);
});

test('reciprocal rank is zero when nothing relevant is within k', () => {
  assert.equal(reciprocalRank(['botdocs/README.md'], [miss, hit], 1), 0);
});

test('summary scores answerable queries on ranking and negatives on abstention', () => {
  const summary = summarize(
    [
      { expect: ['botdocs/README.md'] },
      { expect: [] },
      { expect: [] },
    ],
    [[hit], [], [miss]],
    5
  );
  assert.deepEqual(summary, { recall: 1, mrr: 1, falsePositiveRate: 0.5 });
});
