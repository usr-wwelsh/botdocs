import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VectorSearch } from './vector-search.js';
import { VectorDatabase, DocumentChunk } from '../../types/vector-db.js';

function makeChunk(id: string, embedding: number[], text: string): DocumentChunk {
  return {
    id,
    text,
    embedding,
    metadata: {
      sourceFile: `${id}.md`,
      title: id,
      url: `/${id}.html`,
    },
  };
}

function makeDB(chunks: DocumentChunk[]): VectorDatabase {
  return { version: '1.0', model: 'test', dimension: chunks[0]?.embedding.length ?? 0, chunks };
}

test('drops chunks below the minimum similarity threshold instead of always filling topK', async () => {
  const search = new VectorSearch();
  search.setDatabase(
    makeDB([
      makeChunk('relevant', [1, 0], 'closely matches the query'),
      makeChunk('irrelevant', [0, 1], 'has nothing to do with the query'),
    ])
  );

  const results = await search.search([1, 0], 'query', 5, 0.5);

  assert.equal(results.length, 1);
  assert.equal(results[0].chunk.id, 'relevant');
});

test('gates on true relevance (raw cosine), not on fused keyword rank, so keyword-stuffing cannot bypass the quality floor', async () => {
  const search = new VectorSearch();
  search.setDatabase(
    makeDB([
      makeChunk('vector-strong', [1, 0], 'genuinely on topic but never says the literal word'),
      makeChunk(
        'keyword-stuffed',
        [0.3, Math.sqrt(1 - 0.09)],
        'widget widget widget widget widget widget widget widget'
      ),
    ])
  );

  const results = await search.search([1, 0], 'widget', 5, 0.5);

  assert.equal(results.length, 1);
  assert.equal(results[0].chunk.id, 'vector-strong');
});

test('hybrid ranking promotes a strong keyword match ahead of a marginally higher-cosine result', async () => {
  const search = new VectorSearch();
  search.setDatabase(
    makeDB([
      makeChunk('x-no-keyword', [1, 0], 'This section covers unrelated topics like themes and styling only.'),
      makeChunk(
        'y-keyword-heavy',
        [0.9, Math.sqrt(1 - 0.81)],
        'widget widget widget widget setup configuration guide for the widget system'
      ),
      makeChunk('z-keyword-light', [0.8, 0.6], 'A brief mention of a widget appears here once.'),
    ])
  );

  const results = await search.search([1, 0], 'widget', 3, 0.5);

  assert.deepEqual(
    results.map((r) => r.chunk.id),
    ['y-keyword-heavy', 'x-no-keyword', 'z-keyword-light']
  );
});

test('returns raw cosine similarity as the score, not the fused rank score', async () => {
  const search = new VectorSearch();
  search.setDatabase(makeDB([makeChunk('a', [1, 0], 'widget widget widget')]));

  const results = await search.search([1, 0], 'widget', 5, 0);

  assert.equal(results[0].score, 1);
});

test('drops a result with no literal keyword overlap in the query unless its vector score is near-exact', async () => {
  const search = new VectorSearch();
  search.setDatabase(
    makeDB([
      makeChunk(
        'plausible-but-unrelated',
        [0.8, Math.sqrt(1 - 0.64)],
        'talks about totally different concepts using different words'
      ),
    ])
  );

  // A small embedding model's cosine floor is noisy enough that an
  // off-topic query can still score above a fixed threshold on a narrow
  // corpus — e.g. "quantum entanglement" outscoring a genuinely on-topic
  // query on a game-editor docs site. Requiring some literal keyword
  // overlap (unless the vector match is near-exact) catches what a
  // cosine-only gate misses.
  const results = await search.search([1, 0], 'gadget', 5, 0.5);

  assert.equal(results.length, 0);
});

test('keeps a near-exact semantic match even with zero keyword overlap', async () => {
  const search = new VectorSearch();
  search.setDatabase(
    makeDB([makeChunk('near-exact', [1, 0], 'a passage that never uses the query term')])
  );

  const results = await search.search([1, 0], 'gadget', 5, 0.5);

  assert.equal(results.length, 1);
});

test('still respects topK after threshold filtering and hybrid re-ranking', async () => {
  const search = new VectorSearch();
  search.setDatabase(
    makeDB([
      makeChunk('a', [1, 0], 'alpha content'),
      makeChunk('b', [0.95, Math.sqrt(1 - 0.9025)], 'beta content'),
      makeChunk('c', [0.9, Math.sqrt(1 - 0.81)], 'gamma content'),
    ])
  );

  const results = await search.search([1, 0], 'content', 2, 0);

  assert.equal(results.length, 2);
});
