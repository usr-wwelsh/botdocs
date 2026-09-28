import { DocumentChunk } from '../src/types/vector-db.js';
import { BM25Index } from '../src/client/utils/bm25.js';
import { cosineSimilarity } from '../src/client/utils/similarity.js';

const RRF_K = 60;

const byScoreDesc = <T>(scored: { item: T; score: number }[]): T[] =>
  scored.sort((a, b) => b.score - a.score).map(({ item }) => item);

export function grepRank(chunks: DocumentChunk[], query: string): DocumentChunk[] {
  const words = [...new Set(query.toLowerCase().match(/\w{3,}/g) ?? [])];
  const scored = chunks
    .map((item) => {
      const text = item.text.toLowerCase();
      return { item, score: words.filter((word) => text.includes(word)).length };
    })
    .filter(({ score }) => score > 0);
  return byScoreDesc(scored);
}

export function bm25Rank(chunks: DocumentChunk[], index: BM25Index, query: string): DocumentChunk[] {
  const scores = index.scoreAll(query);
  return byScoreDesc(
    chunks.map((item) => ({ item, score: scores.get(item.id) ?? 0 })).filter(({ score }) => score > 0)
  );
}

export function denseRank(chunks: DocumentChunk[], embedding: number[]): DocumentChunk[] {
  return byScoreDesc(chunks.map((item) => ({ item, score: cosineSimilarity(embedding, item.embedding) })));
}

export function hybridRank(
  chunks: DocumentChunk[],
  index: BM25Index,
  query: string,
  embedding: number[]
): DocumentChunk[] {
  const bm25Scores = index.scoreAll(query);
  const bm25Order = byScoreDesc(chunks.map((item) => ({ item, score: bm25Scores.get(item.id) ?? 0 })));
  const bm25Position = new Map(bm25Order.map((c, i) => [c.id, i]));
  return byScoreDesc(
    denseRank(chunks, embedding).map((item, i) => ({
      item,
      score: 1 / (RRF_K + i + 1) + 1 / (RRF_K + bm25Position.get(item.id)! + 1),
    }))
  );
}
