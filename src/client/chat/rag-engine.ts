/**
 * Smart Search engine (RAG without generation)
 * Uses vector search to find relevant documentation and presents it conversationally
 */

import { getEmbedder } from './embedder.js';
import { getVectorSearch } from './vector-search.js';

export interface RAGResponse {
  answer: string;
  sources: Array<{ title: string; url: string }>;
}

let isInitialized = false;
let topK = 5;

/**
 * Initialize search system (load vector DB and embeddings)
 */
export async function initializeRAG(
  onProgress?: (progress: number) => void
): Promise<void> {
  if (isInitialized) return;

  try {
    // Step 1: Load vector database
    if (onProgress) onProgress(20);
    const vectorSearch = getVectorSearch();
    await vectorSearch.loadVectorDB();

    // Step 2: Load embedding model
    if (onProgress) onProgress(60);
    const embedder = getEmbedder();
    await embedder.initialize();

    isInitialized = true;
    if (onProgress) onProgress(100);
  } catch (error) {
    console.error('Search initialization failed:', error);
    throw error;
  }
}

/**
 * Query the search system
 */
export async function queryRAG(
  query: string,
  options: { topK?: number } = {}
): Promise<RAGResponse> {
  if (!isInitialized) {
    throw new Error('Search system not initialized');
  }

  const k = options.topK || topK;

  try {
    // Step 1: Embed the query
    const embedder = getEmbedder();
    const queryEmbedding = await embedder.embed(query);

    // Step 2: Search for relevant chunks
    const vectorSearch = getVectorSearch();
    const searchResults = await vectorSearch.search(queryEmbedding, k);

    // Step 3: Format results as a conversational response
    const answer = formatSearchResults(query, searchResults);

    // Step 4: Extract sources with deep links
    const sources = searchResults.map((result) => {
      const { metadata } = result.chunk;
      let url = metadata.url;

      // Add anchor for deep linking if heading exists
      if (metadata.headingId) {
        url += `#${metadata.headingId}`;
      }

      return {
        title: metadata.heading
          ? `${metadata.title} → ${metadata.heading}`
          : metadata.title,
        url,
      };
    });

    // Remove duplicates from sources
    const uniqueSources = Array.from(
      new Map(sources.map((s) => [s.url, s])).values()
    );

    return {
      answer,
      sources: uniqueSources,
    };
  } catch (error) {
    console.error('Search query error:', error);
    throw error;
  }
}

/**
 * Format search results as a conversational response
 */
function formatSearchResults(query: string, results: any[]): string {
  if (results.length === 0) {
    return "I couldn't find anything about that in the documentation. Try rephrasing your question or browse the navigation menu to explore available topics.";
  }

  // Analyze query intent for better conversational tone
  const isHowTo = /^how (to|do|can)/i.test(query);
  const isWhat = /^what (is|are)/i.test(query);
  const isWhy = /^why/i.test(query);
  const isWhere = /^where/i.test(query);

  // Build a natural, conversational response
  const topResults = results.slice(0, 3);
  let response = '';

  // Add contextual intro
  if (isHowTo) {
    response += "Here's how you can do that:\n\n";
  } else if (isWhat) {
    response += "Let me explain:\n\n";
  } else if (isWhy) {
    response += "Here's what the docs say about that:\n\n";
  } else if (results.length === 1) {
    response += "I found this relevant section:\n\n";
  } else {
    response += `I found ${topResults.length} relevant sections:\n\n`;
  }

  // Format each result beautifully
  topResults.forEach((result, index) => {
    const { chunk, score } = result;
    const heading = chunk.metadata.heading || chunk.metadata.title;
    const text = chunk.text.trim();

    // Create deep link
    let link = chunk.metadata.url;
    if (chunk.metadata.headingId) {
      link += `#${chunk.metadata.headingId}`;
    }

    // Add visual separation between results
    if (index > 0) {
      response += '\n\n---\n\n';
    }

    // Format with heading, content preview, and link
    response += `**${heading}**\n\n`;
    response += formatTextPreview(text);
    response += `\n\n→ [View full section](${link})`;

    // Add relevance indicator for highly relevant matches
    if (score > 0.7) {
      response += ' *(highly relevant)*';
    }
  });

  // Add helpful footer
  if (results.length > 3) {
    const moreCount = results.length - 3;
    response += `\n\n---\n\n💡 **Found ${moreCount} more related section${
      moreCount > 1 ? 's' : ''
    }** — check the sources below for more details.`;
  } else if (results.length === 1) {
    response += '\n\n*Have a follow-up question? Just ask!*';
  }

  return response;
}

/**
 * Format text content with smart truncation and code block handling
 */
function formatTextPreview(text: string): string {
  // If text is short enough, return as-is
  if (text.length <= 400) {
    return text;
  }

  // Check if it contains code blocks
  const hasCodeBlock = text.includes('```');

  if (hasCodeBlock) {
    // Keep code blocks intact, but truncate surrounding text if needed
    const codeBlockMatch = text.match(/([\s\S]*?)(```[\s\S]*?```)([\s\S]*)/);
    if (codeBlockMatch) {
      const [, before, code, after] = codeBlockMatch;
      const beforeTrimmed = before.trim().slice(0, 150);
      const afterTrimmed = after.trim().slice(0, 150);
      return `${beforeTrimmed}\n\n${code}\n\n${afterTrimmed}...`;
    }
  }

  // Standard truncation for plain text
  return text.slice(0, 400) + '...';
}

/**
 * Check if search is ready
 */
export function isRAGReady(): boolean {
  return isInitialized;
}

/**
 * Set number of documents to retrieve
 */
export function setTopK(k: number): void {
  topK = k;
}
