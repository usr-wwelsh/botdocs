export interface DocumentMetadata {
  title?: string;
  description?: string;
  date?: string;
  author?: string;
  [key: string]: any;
}

export interface ProcessedDocument {
  filePath: string;
  relativePath: string;
  content: string;
  html: string;
  metadata: DocumentMetadata;
  url: string;
}

export interface NavigationItem {
  title: string;
  url: string;
  children?: NavigationItem[];
}
