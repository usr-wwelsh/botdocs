import { Chunker } from './chunker.js';
import { Embedder } from './embedder.js';
import { ProcessedDocument } from '../types/document.js';
import { VectorDatabase, DocumentChunk } from '../types/vector-db.js';
import { writeFileSync, existsSync, readFileSync } from 'fs';
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
   * Build vector database from documents (with incremental build support)
   */
  async build(
    documents: ProcessedDocument[],
    outputDir: string,
    verbose: boolean = false
  ): Promise<VectorDatabase> {
    if (verbose) {
      console.log('Building vector database...');
    }

    const outputPath = join(outputDir, 'vector-db.json');

    // Step 1: Load existing vector database for incremental builds
    const existingDB = this.loadExistingDatabase(outputPath, verbose);
    const cachedChunks = this.buildCacheMap(existingDB);

    // Step 2: Hash documents and determine what needs rebuilding
    const fileHashes = new Map<string, string>();
    const changedDocs: ProcessedDocument[] = [];
    const unchangedDocs: ProcessedDocument[] = [];

    for (const doc of documents) {
      const hash = this.hashContent(doc.content);
      fileHashes.set(doc.relativePath, hash);

      const cachedDocChunks = cachedChunks.get(doc.relativePath);

      if (cachedDocChunks && cachedDocChunks[0]?.metadata.fileHash === hash) {
        unchangedDocs.push(doc);
        if (verbose) {
          console.log(`  ✓ Cached: ${doc.relativePath}`);
        }
      } else {
        changedDocs.push(doc);
        if (verbose) {
          console.log(`  ⟳ Changed: ${doc.relativePath}`);
        }
      }
    }

    console.log(`Unchanged: ${unchangedDocs.length}, Changed: ${changedDocs.length}, Total: ${documents.length}`);

    // Step 3: Reuse cached chunks for unchanged documents
    const reusedChunks: DocumentChunk[] = [];
    for (const doc of unchangedDocs) {
      const chunks = cachedChunks.get(doc.relativePath);
      if (chunks) {
        reusedChunks.push(...chunks);
      }
    }

    // Step 4: Process changed documents only
    let newChunks: DocumentChunk[] = [];
    if (changedDocs.length > 0) {
      console.log('Chunking changed documents...');
      const chunks = this.chunker.chunkDocuments(changedDocs, fileHashes);
      console.log(`Created ${chunks.length} chunks from ${changedDocs.length} changed documents`);

      // Generate embeddings only for changed documents
      console.log('Generating embeddings for changed documents...');
      await this.embedder.initialize();

      const texts = chunks.map((chunk) => chunk.text);
      const embeddings = await this.embedder.embedBatch(texts, 10);

      // Create document chunks with embeddings
      newChunks = chunks.map((chunk, index) => ({
        id: this.generateChunkId(chunk.text, chunk.metadata.sourceFile, index),
        text: chunk.text,
        embedding: embeddings[index],
        metadata: chunk.metadata,
      }));
    } else {
      console.log('No changes detected - reusing all cached embeddings');
    }

    // Step 5: Merge cached and new chunks
    const allChunks = [...reusedChunks, ...newChunks];

    // Step 6: Create vector database
    const vectorDB: VectorDatabase = {
      version: '1.0',
      model: this.embedder.getModelName(),
      dimension: this.embedder.getDimension(),
      chunks: allChunks,
    };

    // Step 7: Write to file
    writeFileSync(outputPath, JSON.stringify(vectorDB, null, 2), 'utf-8');

    console.log(`Vector database saved: ${outputPath}`);
    console.log(`Total chunks: ${vectorDB.chunks.length} (${reusedChunks.length} cached, ${newChunks.length} new)`);
    console.log(`Embedding dimension: ${vectorDB.dimension}`);

    return vectorDB;
  }

  /**
   * Load existing vector database from disk
   */
  private loadExistingDatabase(outputPath: string, verbose: boolean): VectorDatabase | null {
    if (!existsSync(outputPath)) {
      if (verbose) {
        console.log('No existing vector database found - performing full build');
      }
      return null;
    }

    try {
      const content = readFileSync(outputPath, 'utf-8');
      const db = JSON.parse(content) as VectorDatabase;
      if (verbose) {
        console.log(`Loaded existing vector database with ${db.chunks.length} chunks`);
      }
      return db;
    } catch (error) {
      console.warn('Failed to load existing vector database - performing full build');
      return null;
    }
  }

  /**
   * Build a map of sourceFile -> chunks for quick lookup
   */
  private buildCacheMap(db: VectorDatabase | null): Map<string, DocumentChunk[]> {
    const cache = new Map<string, DocumentChunk[]>();

    if (!db) {
      return cache;
    }

    for (const chunk of db.chunks) {
      const sourceFile = chunk.metadata.sourceFile;
      if (!cache.has(sourceFile)) {
        cache.set(sourceFile, []);
      }
      cache.get(sourceFile)!.push(chunk);
    }

    return cache;
  }

  /**
   * Hash file content for change detection
   */
  private hashContent(content: string): string {
    return createHash('md5').update(content).digest('hex');
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
