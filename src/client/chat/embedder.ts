/**
 * Client-side embedder using Transformers.js
 */

import { pipeline, env, FeatureExtractionPipeline, ProgressInfo } from '@huggingface/transformers';

// Configure for browser environment
env.allowLocalModels = false;

const MODEL_CACHE_NAME = 'transformers-cache';

// Xenova/e5-small-v2, quantized ONNX weights (the file transformers.js fetches by default)
export const ESTIMATED_MODEL_SIZE_MB = 30;

export class ClientEmbedder {
  private model: FeatureExtractionPipeline | null = null;
  private modelName: string;
  private isLoading: boolean = false;

  constructor(modelName: string = 'Xenova/e5-small-v2') {
    this.modelName = modelName;
  }

  /**
   * Check whether model files already exist in the browser's Cache API,
   * without triggering a download.
   */
  async isModelCached(): Promise<boolean> {
    if (typeof caches === 'undefined') return false;

    try {
      const cache = await caches.open(MODEL_CACHE_NAME);
      const keys = await cache.keys();
      return keys.some((request) => request.url.includes(this.modelName));
    } catch {
      return false;
    }
  }

  /**
   * Initialize the embedding model (lazy loading)
   */
  async initialize(onProgress?: (progress: number) => void): Promise<void> {
    if (this.model) return;

    if (this.isLoading) {
      // Wait for existing initialization
      while (this.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.isLoading = true;

    try {
      const fileProgress = new Map<string, { loaded: number; total: number }>();

      this.model = await pipeline('feature-extraction', this.modelName, {
        progress_callback: onProgress
          ? (event: ProgressInfo) => {
              if (event.status !== 'progress' || !event.total) return;

              fileProgress.set(event.file, {
                loaded: event.loaded ?? 0,
                total: event.total,
              });

              let loaded = 0;
              let total = 0;
              for (const entry of fileProgress.values()) {
                loaded += entry.loaded;
                total += entry.total;
              }

              onProgress(total > 0 ? (loaded / total) * 100 : 0);
            }
          : undefined,
      });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Generate embedding for a query
   */
  async embed(text: string): Promise<number[]> {
    if (!this.model) {
      await this.initialize();
    }

    if (!this.model) {
      throw new Error('Failed to initialize embedding model');
    }

    // Prepend "query: " prefix for e5 models
    const prefixedText = `query: ${text}`;

    const output = await this.model(prefixedText, {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(output.data);
  }

  /**
   * Generate embeddings for multiple texts in a single forward pass.
   * Used for re-ranking sentences/segments within already-retrieved chunks.
   */
  async embedBatch(texts: string[], prefix: 'query' | 'passage' = 'passage'): Promise<number[][]> {
    if (texts.length === 0) return [];

    if (!this.model) {
      await this.initialize();
    }
    if (!this.model) {
      throw new Error('Failed to initialize embedding model');
    }

    const prefixedTexts = texts.map((text) => `${prefix}: ${text}`);

    const output = await this.model(prefixedTexts, {
      pooling: 'mean',
      normalize: true,
    });

    return output.tolist();
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return this.model !== null;
  }
}

// Singleton instance
let embedderInstance: ClientEmbedder | null = null;

export function getEmbedder(): ClientEmbedder {
  if (!embedderInstance) {
    embedderInstance = new ClientEmbedder();
  }
  return embedderInstance;
}
