/**
 * Vector search with cosine similarity
 */

import { DocumentChunk, VectorDatabase } from '../../types/vector-db.js';
import { cosineSimilarity } from '../utils/similarity.js';

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

export class VectorSearch {
  private vectorDB: VectorDatabase | null = null;
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
      this.vectorDB = await response.json();
      console.log(`Loaded ${this.vectorDB!.chunks.length} chunks`);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Search for similar chunks using cosine similarity
   */
  async search(queryEmbedding: number[], topK: number = 5): Promise<SearchResult[]> {
    if (!this.vectorDB) {
      await this.loadVectorDB();
    }

    // Calculate cosine similarity for all chunks
    const results: SearchResult[] = this.vectorDB!.chunks.map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Return top K
    return results.slice(0, topK);
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
