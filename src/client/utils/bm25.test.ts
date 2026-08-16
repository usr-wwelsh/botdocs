import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BM25Index } from './bm25.js';

test('ranks a doc containing the exact query term above one that does not', () => {
  const index = new BM25Index([
    { id: 'a', text: 'Configure the chunkOverlap option in botdocs.config.json.' },
    { id: 'b', text: 'This page explains how themes are selected and applied.' },
  ]);

  const scores = index.scoreAll('chunkOverlap');

  assert.ok(scores.get('a')! > scores.get('b')!);
  assert.equal(scores.get('b'), 0);
});

test('downweights terms that appear in most documents', () => {
  const index = new BM25Index([
    { id: 'a', text: 'documentation documentation documentation rare-term' },
    { id: 'b', text: 'documentation documentation documentation' },
    { id: 'c', text: 'documentation documentation documentation' },
  ]);

  const scores = index.scoreAll('documentation rare-term');

  // "rare-term" only appears in doc a, so a's score should be dominated by
  // that rarer term rather than the common "documentation" tokens.
  assert.ok(scores.get('a')! > scores.get('b')!);
});

test('matches identifier-like tokens (dashes, dots, camelCase runs) as whole terms', () => {
  const index = new BM25Index([
    { id: 'a', text: 'Pass --no-chat to disable the chatbot during build.' },
    { id: 'b', text: 'Set chunkSize in botdocs.config.json to change chunk length.' },
  ]);

  const chatScores = index.scoreAll('--no-chat');
  assert.ok(chatScores.get('a')! > 0);
  assert.equal(chatScores.get('b'), 0);

  const configScores = index.scoreAll('botdocs.config.json');
  assert.ok(configScores.get('b')! > 0);
  assert.equal(configScores.get('a'), 0);
});

test('returns zero scores for an empty corpus without throwing', () => {
  const index = new BM25Index([]);
  const scores = index.scoreAll('anything');
  assert.equal(scores.size, 0);
});

test('returns zero for every doc when the query has no matching terms', () => {
  const index = new BM25Index([{ id: 'a', text: 'hello world' }]);
  const scores = index.scoreAll('nonexistent');
  assert.equal(scores.get('a'), 0);
});
