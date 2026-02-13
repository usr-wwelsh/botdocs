import { Chunker } from './chunker.js';
import { Embedder } from './embedder.js';
import { ProcessedDocument } from '../types/document.js';
import { VectorDatabase, DocumentChunk } from '../types/vector-db.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

export interface VectorDBBuilderOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  modelName?: string;
}

export class VectorDBBuilder {
  private chunker: Chunker;
  private embedder: Embedder;

  constructor(options: VectorDBBuilderOptions = {}) {
    this.chunker = new Chunker({
      maxChunkSize: options.chunkSize || 500,
      chunkOverlap: options.chunkOverlap || 50,
    });

    this.embedder = new Embedder(options.modelName);
  }

  /**
   * Build vector database from documents
   */
  async build(
    documents: ProcessedDocument[],
    outputDir: string,
    verbose: boolean = false
  ): Promise<VectorDatabase> {
    if (verbose) {
      console.log('Building vector database...');
    }

    // Step 1: Chunk documents
    console.log('Chunking documents...');
    const chunks = this.chunker.chunkDocuments(documents);
    console.log(`Created ${chunks.length} chunks`);

    // Step 2: Generate embeddings
    console.log('Generating embeddings...');
    await this.embedder.initialize();

    const texts = chunks.map((chunk) => chunk.text);
    const embeddings = await this.embedder.embedBatch(texts, 10);

    // Step 3: Create document chunks with embeddings
    const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
      id: this.generateChunkId(chunk.text, chunk.metadata.sourceFile, index),
      text: chunk.text,
      embedding: embeddings[index],
      metadata: chunk.metadata,
    }));

    // Step 4: Create vector database
    const vectorDB: VectorDatabase = {
      version: '1.0',
      model: this.embedder.getModelName(),
      dimension: this.embedder.getDimension(),
      chunks: documentChunks,
    };

    // Step 5: Write to file
    const outputPath = join(outputDir, 'vector-db.json');
    writeFileSync(outputPath, JSON.stringify(vectorDB, null, 2), 'utf-8');

    console.log(`Vector database saved: ${outputPath}`);
    console.log(`Total chunks: ${vectorDB.chunks.length}`);
    console.log(`Embedding dimension: ${vectorDB.dimension}`);

    return vectorDB;
  }

  /**
   * Generate unique ID for a chunk
   */
  private generateChunkId(text: string, sourceFile: string, index: number): string {
    const hash = createHash('md5')
      .update(`${sourceFile}:${index}:${text.substring(0, 100)}`)
      .digest('hex');
    return hash.substring(0, 16);
  }
}
