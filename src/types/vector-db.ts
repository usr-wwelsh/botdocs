export interface ChunkMetadata {
  sourceFile: string;
  title: string;
  heading?: string;
  headingId?: string; // Anchor ID for deep linking
  url: string;
  startLine?: number;
  endLine?: number;
  fileHash?: string; // MD5 hash of source file content for incremental builds
}

export interface DocumentChunk {
  id: string;
  text: string;
  embedding: number[];
  metadata: ChunkMetadata;
}

export interface VectorDatabase {
  version: string;
  model: string;
  dimension: number;
  chunks: DocumentChunk[];
}
