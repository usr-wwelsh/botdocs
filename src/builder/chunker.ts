import { ProcessedDocument } from '../types/document.js';
import { ChunkMetadata } from '../types/vector-db.js';

export interface TextChunk {
  text: string;
  metadata: ChunkMetadata;
}

export interface ChunkerOptions {
  maxChunkSize: number;
  chunkOverlap: number;
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

    return chunks.filter((chunk) => chunk.text.trim().length > 0);
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
