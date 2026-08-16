/**
 * BM25 keyword scoring, used alongside vector cosine similarity for hybrid
 * retrieval. Dense embeddings alone tend to miss exact identifiers (flag
 * names, config keys, function names) that documentation is full of; BM25
 * catches those term-for-term matches that a semantically-similar-but-wrong
 * passage would otherwise outrank.
 */

const K1 = 1.5;
const B = 0.75;

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has',
  'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was',
  'were', 'will', 'with',
]);

export interface BM25Document {
  id: string;
  text: string;
}

function tokenize(text: string): string[] {
  const raw = text.toLowerCase().match(/[a-z0-9][\w.-]*/g) ?? [];
  // Strip trailing '.'/'-' picked up from sentence punctuation (e.g. the
  // period ending "...in botdocs.config.json.") while keeping internal
  // dots/dashes that are part of an identifier.
  return raw
    .map((token) => token.replace(/[.-]+$/, ''))
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));
}

export class BM25Index {
  private termFreqs = new Map<string, Map<string, number>>();
  private docFreq = new Map<string, number>();
  private docLength = new Map<string, number>();
  private avgDocLength = 0;
  private docIds: string[] = [];

  constructor(docs: BM25Document[]) {
    let totalLength = 0;

    for (const doc of docs) {
      const tokens = tokenize(doc.text);
      this.docIds.push(doc.id);
      this.docLength.set(doc.id, tokens.length);
      totalLength += tokens.length;

      const freqs = new Map<string, number>();
      for (const token of tokens) {
        freqs.set(token, (freqs.get(token) ?? 0) + 1);
      }
      this.termFreqs.set(doc.id, freqs);

      for (const term of freqs.keys()) {
        this.docFreq.set(term, (this.docFreq.get(term) ?? 0) + 1);
      }
    }

    this.avgDocLength = docs.length > 0 ? totalLength / docs.length : 0;
  }

  private idf(term: string): number {
    const df = this.docFreq.get(term) ?? 0;
    return Math.log(1 + (this.docIds.length - df + 0.5) / (df + 0.5));
  }

  private score(queryTerms: string[], docId: string): number {
    const freqs = this.termFreqs.get(docId);
    if (!freqs) return 0;

    const docLength = this.docLength.get(docId) ?? 0;
    let score = 0;

    for (const term of queryTerms) {
      const freq = freqs.get(term);
      if (!freq) continue;

      const numerator = freq * (K1 + 1);
      const denominator =
        freq + K1 * (1 - B + (B * docLength) / (this.avgDocLength || 1));
      score += this.idf(term) * (numerator / denominator);
    }

    return score;
  }

  /**
   * Score every document in the index against a query, keyed by doc id.
   */
  scoreAll(query: string): Map<string, number> {
    const queryTerms = tokenize(query);
    const scores = new Map<string, number>();

    for (const docId of this.docIds) {
      scores.set(docId, this.score(queryTerms, docId));
    }

    return scores;
  }
}
