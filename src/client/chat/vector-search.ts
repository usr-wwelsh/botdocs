/**
 * Hybrid search: dense vector cosine similarity combined with BM25 keyword
 * scoring via Reciprocal Rank Fusion. Dense embeddings alone can miss exact
 * identifiers (config keys, flags, function names) that prose-similar but
 * wrong passages outrank; BM25 catches those.
 */

import { DocumentChunk, VectorDatabase } from '../../types/vector-db.js';
import { cosineSimilarity } from '../utils/similarity.js';
import { BM25Index } from '../utils/bm25.js';

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

// Standard RRF constant: dampens the influence of rank position so results
// far down either ranking don't swing the fused order much.
const RRF_K = 60;

// A small embedding model's raw cosine floor is noisy enough on a narrow,
// single-topic corpus that a completely off-topic query (e.g. a proper
// noun from a different domain) can score as high as, or higher than, a
// genuinely on-topic one — no fixed minScore can separate them. Requiring
// at least one literal query term to appear somewhere in the chunk (BM25
// score > 0) catches what the cosine gate misses, since an unrelated
// query shares no vocabulary with the corpus at all. Near-exact semantic
// matches (paraphrases with zero literal overlap) are still let through.
const KEYWORD_BYPASS_SCORE = 0.9;

export class VectorSearch {
  private vectorDB: VectorDatabase | null = null;
  private bm25Index: BM25Index | null = null;
  private isLoading: boolean = false;

  /**
   * Load vector database from JSON
   */
  async loadVectorDB(): Promise<void> {
    if (this.vectorDB) return;

    if (this.isLoading) {
      // Wait for existing load
      while (this.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.isLoading = true;

    try {
      console.log('Loading vector database...');
      const response = await fetch('/vector-db.json');
      this.setDatabase((await response.json()) as VectorDatabase);
      console.log(`Loaded ${this.vectorDB!.chunks.length} chunks`);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Inject a vector database directly, bypassing the fetch. Used by the
   * build/load path above and by tests.
   */
  setDatabase(db: VectorDatabase): void {
    this.vectorDB = db;
    this.bm25Index = null;
  }

  private getBM25Index(): BM25Index {
    if (!this.bm25Index) {
      this.bm25Index = new BM25Index(
        this.vectorDB!.chunks.map((chunk) => ({ id: chunk.id, text: chunk.text }))
      );
    }
    return this.bm25Index;
  }

  /**
   * Hybrid search: rank all chunks by vector cosine similarity and by BM25
   * keyword score, fuse the two rankings with Reciprocal Rank Fusion, then
   * gate the fused results on the raw cosine score so a keyword-heavy but
   * semantically unrelated chunk can't slip past the relevance floor.
   */
  async search(
    queryEmbedding: number[],
    queryText: string,
    topK: number = 5,
    minScore: number = 0
  ): Promise<SearchResult[]> {
    if (!this.vectorDB) {
      await this.loadVectorDB();
    }

    const chunks = this.vectorDB!.chunks;
    const vectorScores: SearchResult[] = chunks.map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    const vectorRanked = [...vectorScores].sort((a, b) => b.score - a.score);
    const vectorRank = new Map(vectorRanked.map((r, i) => [r.chunk.id, i]));

    const bm25Scores = this.getBM25Index().scoreAll(queryText);
    const bm25Ranked = [...bm25Scores.entries()].sort((a, b) => b[1] - a[1]);
    const bm25Rank = new Map(bm25Ranked.map(([id], i) => [id, i]));

    const fused = vectorScores
      .map(({ chunk, score }) => {
        const vRank = vectorRank.get(chunk.id)!;
        const bRank = bm25Rank.get(chunk.id)!;
        const rrfScore = 1 / (RRF_K + vRank + 1) + 1 / (RRF_K + bRank + 1);
        const bm25Score = bm25Scores.get(chunk.id) ?? 0;
        return { chunk, score, rrfScore, bm25Score };
      })
      .filter((r) => r.score >= minScore)
      .filter((r) => r.bm25Score > 0 || r.score >= KEYWORD_BYPASS_SCORE)
      .sort((a, b) => b.rrfScore - a.rrfScore);

    return fused.slice(0, topK).map(({ chunk, score }) => ({ chunk, score }));
  }

  /**
   * Check if vector DB is loaded
   */
  isReady(): boolean {
    return this.vectorDB !== null;
  }

  /**
   * Get database info
   */
  getInfo(): { chunkCount: number; dimension: number; model: string } | null {
    if (!this.vectorDB) return null;

    return {
      chunkCount: this.vectorDB.chunks.length,
      dimension: this.vectorDB.dimension,
      model: this.vectorDB.model,
    };
  }
}

// Singleton instance
let searchInstance: VectorSearch | null = null;

export function getVectorSearch(): VectorSearch {
  if (!searchInstance) {
    searchInstance = new VectorSearch();
  }
  return searchInstance;
}
