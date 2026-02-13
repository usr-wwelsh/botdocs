import { pipeline, env } from '@xenova/transformers';

// Disable local model loading - use Hugging Face
env.allowLocalModels = false;

export class Embedder {
  private model: any;
  private modelName: string;
  private dimension: number;

  constructor(modelName: string = 'Xenova/all-MiniLM-L6-v2') {
    this.modelName = modelName;
    this.dimension = 384; // all-MiniLM-L6-v2 produces 384-dimensional embeddings
  }

  /**
   * Initialize the embedding model
   */
  async initialize(): Promise<void> {
    console.log(`Loading embedding model: ${this.modelName}...`);

    this.model = await pipeline('feature-extraction', this.modelName);

    console.log('Embedding model loaded');
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    if (!this.model) {
      await this.initialize();
    }

    // Generate embedding
    const output = await this.model(text, {
      pooling: 'mean',
      normalize: true,
    });

    // Convert to array
    const embedding = Array.from(output.data) as number[];

    return embedding;
  }

  /**
   * Generate embeddings for multiple texts (batched for efficiency)
   */
  async embedBatch(
    texts: string[],
    batchSize: number = 10,
    onProgress?: (current: number, total: number) => void
  ): Promise<number[][]> {
    if (!this.model) {
      await this.initialize();
    }

    const embeddings: number[][] = [];
    const total = texts.length;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      // Process batch in parallel
      const batchEmbeddings = await Promise.all(
        batch.map((text) => this.embed(text))
      );

      embeddings.push(...batchEmbeddings);

      // Report progress
      const current = Math.min(i + batchSize, total);
      if (onProgress) {
        onProgress(current, total);
      } else {
        console.log(`Embedded ${current}/${total} chunks`);
      }
    }

    return embeddings;
  }

  /**
   * Get embedding dimension
   */
  getDimension(): number {
    return this.dimension;
  }

  /**
   * Get model name
   */
  getModelName(): string {
    return this.modelName;
  }
}
