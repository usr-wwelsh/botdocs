import { ProcessedDocument } from '../types/document.js';
import { ChunkMetadata } from '../types/vector-db.js';

export interface TextChunk {
  text: string;
  metadata: ChunkMetadata;
}

export interface ChunkerOptions {
  maxChunkSize: number;
  chunkOverlap: number;
  /**
   * Chunks smaller than this (in estimated tokens) are folded into a
   * neighboring chunk instead of being kept as standalone, low-information
   * entries in the vector DB (e.g. a heading followed by a single short
   * line). Set to 0 to disable merging.
   */
  minChunkSize: number;
}

/**
 * Text chunker that splits documents by headings while respecting token limits
 */
export class Chunker {
  private options: ChunkerOptions;

  constructor(options: Partial<ChunkerOptions> = {}) {
    this.options = {
      maxChunkSize: options.maxChunkSize || 500,
      chunkOverlap: options.chunkOverlap || 50,
      minChunkSize: options.minChunkSize ?? 15,
    };
  }

  /**
   * Chunk a document into semantically meaningful pieces
   */
  chunkDocument(doc: ProcessedDocument, fileHash?: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    const lines = doc.content.split('\n');

    let currentChunk: string[] = [];
    let currentHeading: string | undefined;
    let inCodeBlock = false;
    let codeBlockLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          // Start of code block
          inCodeBlock = true;
          codeBlockLines = [line];
        } else {
          // End of code block
          inCodeBlock = false;
          codeBlockLines.push(line);

          // Add complete code block to current chunk
          currentChunk.push(...codeBlockLines);
          codeBlockLines = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockLines.push(line);
        continue;
      }

      // Detect headings
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);

      if (headingMatch) {
        // Save current chunk if it exists
        if (currentChunk.length > 0) {
          chunks.push(
            this.createChunk(currentChunk.join('\n'), doc, currentHeading, fileHash)
          );
        }

        // Start new chunk with this heading
        currentHeading = headingMatch[2];
        currentChunk = [line];
      } else {
        currentChunk.push(line);

        // Check if chunk is getting too large
        const tokenCount = this.estimateTokens(currentChunk.join('\n'));
        if (tokenCount >= this.options.maxChunkSize) {
          // Split chunk
          const chunkText = currentChunk.join('\n');
          chunks.push(this.createChunk(chunkText, doc, currentHeading, fileHash));

          // Create overlap for next chunk
          const overlapLines = this.getOverlapLines(
            currentChunk,
            this.options.chunkOverlap
          );
          currentChunk = overlapLines;
        }
      }
    }

    // Add final chunk
    if (currentChunk.length > 0) {
      chunks.push(
        this.createChunk(currentChunk.join('\n'), doc, currentHeading, fileHash)
      );
    }

    const nonEmptyChunks = chunks.filter((chunk) => chunk.text.trim().length > 0);
    return this.mergeSmallChunks(nonEmptyChunks);
  }

  /**
   * Fold chunks smaller than minChunkSize into a neighbor so a heading with
   * little or no body content doesn't become its own low-signal retrieval
   * candidate.
   */
  private mergeSmallChunks(chunks: TextChunk[]): TextChunk[] {
    const minTokens = this.options.minChunkSize;
    if (minTokens <= 0 || chunks.length <= 1) return chunks;

    const merged: TextChunk[] = [];

    for (const chunk of chunks) {
      const prev = merged[merged.length - 1];
      if (prev && this.estimateTokens(prev.text) < minTokens) {
        // Absorb forward: the small chunk becomes the lead-in for the next
        // section, which takes over as the chunk's heading/metadata.
        merged[merged.length - 1] = {
          text: `${prev.text}\n\n${chunk.text}`,
          metadata: chunk.metadata,
        };
      } else {
        merged.push(chunk);
      }
    }

    // A trailing chunk with nothing after it to absorb into gets folded
    // backward instead, keeping the earlier (more substantial) heading.
    if (merged.length > 1) {
      const last = merged[merged.length - 1];
      if (this.estimateTokens(last.text) < minTokens) {
        const prev = merged[merged.length - 2];
        merged[merged.length - 2] = {
          text: `${prev.text}\n\n${last.text}`,
          metadata: prev.metadata,
        };
        merged.pop();
      }
    }

    return merged;
  }

  /**
   * Create a chunk with metadata
   */
  private createChunk(
    text: string,
    doc: ProcessedDocument,
    heading?: string,
    fileHash?: string
  ): TextChunk {
    return {
      text: text.trim(),
      metadata: {
        sourceFile: doc.relativePath,
        title: doc.metadata.title || 'Untitled',
        heading,
        headingId: heading ? this.slugify(heading) : undefined,
        url: doc.url,
        fileHash,
      },
    };
  }

  /**
   * Convert heading text to anchor ID (matches markdown-it-anchor behavior)
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s+]/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  /**
   * Estimate token count (rough approximation: ~4 chars = 1 token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get last N tokens worth of lines for overlap
   */
  private getOverlapLines(lines: string[], targetTokens: number): string[] {
    const result: string[] = [];
    let tokenCount = 0;

    // Work backwards from end
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const lineTokens = this.estimateTokens(line);

      if (tokenCount + lineTokens > targetTokens) {
        break;
      }

      result.unshift(line);
      tokenCount += lineTokens;
    }

    return result;
  }

  /**
   * Chunk multiple documents
   */
  chunkDocuments(documents: ProcessedDocument[], fileHashes?: Map<string, string>): TextChunk[] {
    const allChunks: TextChunk[] = [];

    for (const doc of documents) {
      const fileHash = fileHashes?.get(doc.relativePath);
      const chunks = this.chunkDocument(doc, fileHash);
      allChunks.push(...chunks);
    }

    return allChunks;
  }
}
