/**
 * Smart Search engine (RAG without generation)
 * Uses vector search to find relevant documentation and presents it conversationally
 */

import { getEmbedder } from './embedder.js';
import { getVectorSearch, SearchResult } from './vector-search.js';
import { extractSnippet, SnippetExtraction } from './sentence-extractor.js';
import { stripInlineLinks } from '../utils/markdown-links.js';
import { ChunkMetadata } from '../../types/vector-db.js';

export interface RAGMessage {
  content: string;
  citations?: Array<{ title: string; url: string }>;
}

export interface RAGResponse {
  messages: RAGMessage[];
}

let isInitialized = false;
let topK = 5;
let minScore = 0.75;

// Must stay above the default minScore, or every result that clears the
// relevance floor would also count as "highly relevant," making the label
// meaningless.
const HIGHLY_RELEVANT_SCORE = 0.85;

/**
 * Check whether the embedding model is already cached in the browser
 * (i.e. initializing won't require a network download).
 */
export async function isModelCached(): Promise<boolean> {
  return getEmbedder().isModelCached();
}

/**
 * Initialize search system (load vector DB and embeddings)
 */
export async function initializeRAG(
  onProgress?: (progress: number) => void
): Promise<void> {
  if (isInitialized) return;

  try {
    // Vector DB is small and bundled with the site; weight it lightly.
    const vectorSearch = getVectorSearch();
    await vectorSearch.loadVectorDB();
    if (onProgress) onProgress(5);

    // Embedding model download dominates total time; report real byte progress.
    const embedder = getEmbedder();
    await embedder.initialize((modelProgress) => {
      if (onProgress) onProgress(5 + modelProgress * 0.95);
    });

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
  options: { topK?: number; minScore?: number } = {}
): Promise<RAGResponse> {
  if (!isInitialized) {
    throw new Error('Search system not initialized');
  }

  const k = options.topK ?? topK;
  const threshold = options.minScore ?? minScore;

  try {
    // Step 1: Embed the query
    const embedder = getEmbedder();
    const queryEmbedding = await embedder.embed(query);

    // Step 2: Search for relevant chunks (hybrid vector + keyword, gated on
    // a minimum similarity score so weak/off-topic matches don't pad topK)
    const vectorSearch = getVectorSearch();
    const searchResults = await vectorSearch.search(queryEmbedding, query, k, threshold);

    // Step 3: Re-rank sentences/segments within the top chunks against the
    // query so snippets are extracted, not char-sliced.
    const topResults = searchResults.slice(0, 3);
    const extracted = await Promise.all(
      topResults.map((result) =>
        extractSnippet(result.chunk.text, queryEmbedding, (texts) =>
          embedder.embedBatch(texts)
        )
      )
    );

    // Step 4: Format results as a series of separate, conversational bubbles
    const messages = buildResponseMessages(query, searchResults, topResults, extracted);

    return { messages };
  } catch (error) {
    console.error('Search query error:', error);
    throw error;
  }
}

function buildLink(metadata: ChunkMetadata): string {
  let link = metadata.url;
  if (metadata.headingId) {
    link += `#${metadata.headingId}`;
  }
  return link;
}

function sourceLabel(metadata: ChunkMetadata): string {
  return metadata.heading ? `${metadata.title} → ${metadata.heading}` : metadata.title;
}

/**
 * Build a series of separate, conversational chat bubbles from search
 * results — one bubble per idea (quick answer, intro, each section, the
 * "more results" note) rather than one long message, so multiple answers
 * don't run together.
 */
function buildResponseMessages(
  query: string,
  allResults: SearchResult[],
  topResults: SearchResult[],
  extracted: SnippetExtraction[]
): RAGMessage[] {
  if (allResults.length === 0) {
    return [
      {
        content:
          "I couldn't find anything about that in the documentation. Try rephrasing your question or browse the navigation menu to explore available topics.",
      },
    ];
  }

  const isHowTo = /^how (to|do|can)/i.test(query);
  const isWhat = /^what (is|are)/i.test(query);
  const isWhy = /^why/i.test(query);

  const messages: RAGMessage[] = [];

  // Quick answer: when multiple sources strongly agree, lead with the
  // single best-matching sentence from each — a synthesized, extractive
  // answer instead of just a list of chunks.
  const quickAnswerItems = topResults
    .map((result, index) => ({ result, extract: extracted[index] }))
    .filter(
      ({ result, extract }) =>
        result.score > HIGHLY_RELEVANT_SCORE && extract.topScore > HIGHLY_RELEVANT_SCORE
    );

  if (quickAnswerItems.length > 1) {
    let quickAnswer = '**Quick answer**\n\n';
    for (const { result, extract } of quickAnswerItems) {
      const link = buildLink(result.chunk.metadata);
      // The extracted sentence is pulled verbatim from doc prose, which may
      // itself contain a markdown link or badge image — strip that before
      // nesting it inside the citation link this bullet already wraps it
      // in, or the two links garble each other when rendered.
      const segment = stripInlineLinks(extract.topSegment);
      quickAnswer += `- ${segment} ([${sourceLabel(result.chunk.metadata)}](${link}))\n`;
    }
    messages.push({ content: quickAnswer.trim() });
  }

  // Contextual intro, its own bubble
  let intro: string;
  if (isHowTo) {
    intro = "Here's how you can do that:";
  } else if (isWhat) {
    intro = 'Let me explain:';
  } else if (isWhy) {
    intro = "Here's what the docs say about that:";
  } else if (allResults.length === 1) {
    intro = 'I found this relevant section:';
  } else {
    intro = `I found ${topResults.length} relevant sections:`;
  }
  messages.push({ content: intro });

  // One bubble per result
  topResults.forEach((result, index) => {
    const { chunk, score } = result;
    const heading = chunk.metadata.heading || chunk.metadata.title;
    const link = buildLink(chunk.metadata);
    const snippet = extracted[index].snippet;

    let content = `### ${heading}\n\n${snippet}\n\n→ [View full section](${link})`;

    // Add relevance indicator for highly relevant matches
    if (score > HIGHLY_RELEVANT_SCORE) {
      content += ' *(highly relevant)*';
    }

    // Fold the single-result follow-up nudge into that same bubble rather
    // than spawning a bubble for one line of flourish text.
    if (allResults.length === 1) {
      content += '\n\n*Have a follow-up question? Just ask!*';
    }

    messages.push({ content });
  });

  // Note about additional results as its own bubble
  if (allResults.length > 3) {
    const moreCount = allResults.length - 3;
    messages.push({
      content: `💡 **Found ${moreCount} more related section${
        moreCount > 1 ? 's' : ''
      }** — check the sources below for more details.`,
    });
  }

  // Deduped citations attach to the final bubble only, so the source list
  // shows once instead of repeating across every bubble.
  const sources = allResults.map((result) => ({
    title: sourceLabel(result.chunk.metadata),
    url: buildLink(result.chunk.metadata),
  }));
  const uniqueSources = Array.from(new Map(sources.map((s) => [s.url, s])).values());
  messages[messages.length - 1].citations = uniqueSources;

  return messages;
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

/**
 * Set the minimum cosine similarity a chunk must reach to be returned at
 * all, regardless of topK.
 */
export function setMinScore(score: number): void {
  minScore = score;
}
