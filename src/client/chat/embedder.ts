/**
 * Client-side embedder using Transformers.js
 */

import { pipeline, env } from '@xenova/transformers';

// Configure for browser environment
env.allowLocalModels = false;

export class ClientEmbedder {
  private model: any = null;
  private modelName: string;
  private isLoading: boolean = false;

  constructor(modelName: string = 'Xenova/e5-small-v2') {
    this.modelName = modelName;
  }

  /**
   * Initialize the embedding model (lazy loading)
   */
  async initialize(): Promise<void> {
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
      console.log('Loading embedding model...');
      this.model = await pipeline('feature-extraction', this.modelName);
      console.log('Embedding model loaded');
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

    // Prepend "query: " prefix for e5 models
    const prefixedText = `query: ${text}`;

    const output = await this.model(prefixedText, {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(output.data);
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
