import { createHash } from 'crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { defaultConfig } from '../src/types/config.js';
import { DocumentChunk, VectorDatabase } from '../src/types/vector-db.js';
import { ClientEmbedder } from '../src/client/chat/embedder.js';
import { VectorSearch } from '../src/client/chat/vector-search.js';
import { DEFAULT_MIN_SCORE } from '../src/client/chat/rag-engine.js';
import { BM25Index } from '../src/client/utils/bm25.js';
import { bm25Rank, denseRank, grepRank, hybridRank } from './retrievers.js';
import { matches, reciprocalRank, summarize, Target } from './metrics.js';

const K = 5;
const SPLITS = ['tune', 'holdout'] as const;
const root = dirname(fileURLToPath(import.meta.url));
const corpusDir = join(root, 'corpus');

interface GoldenQuery {
  id: string;
  query: string;
  split: (typeof SPLITS)[number];
  expect: string[];
}

function loadGolden(chunks: DocumentChunk[]): GoldenQuery[] {
  const raw: unknown = JSON.parse(readFileSync(join(root, 'golden.json'), 'utf-8'));
  if (!Array.isArray(raw)) throw new Error('golden.json must be an array');

  const ids = new Set<string>();
  return raw.map((entry, i) => {
    const q = entry as GoldenQuery;
    const where = `golden.json[${i}]`;
    if (typeof q.id !== 'string' || !/^[a-z0-9-]+$/.test(q.id)) throw new Error(`${where}: bad id`);
    if (ids.has(q.id)) throw new Error(`${where}: duplicate id ${q.id}`);
    ids.add(q.id);
    if (typeof q.query !== 'string' || q.query.trim() === '') throw new Error(`${where}: empty query`);
    if (!SPLITS.includes(q.split)) throw new Error(`${where}: split must be one of ${SPLITS.join(', ')}`);
    if (!Array.isArray(q.expect) || q.expect.some((label) => typeof label !== 'string')) {
      throw new Error(`${where}: expect must be an array of labels`);
    }
    for (const label of q.expect) {
      if (!chunks.some((c) => matches(label, c.metadata))) throw new Error(`${where}: no chunk matches ${label}`);
    }
    return q;
  });
}

const corpusFiles = readdirSync(corpusDir, { recursive: true, withFileTypes: true })
  .filter((d) => d.isFile() && d.name.endsWith('.md'))
  .map((d) => join(d.parentPath, d.name))
  .sort();

async function loadDocuments() {
  const { MarkdownProcessor } = await import('../src/builder/markdown-processor.js');
  const processor = new MarkdownProcessor();
  const documents = [];
  for (const f of corpusFiles) documents.push(await processor.processFile(f, corpusDir, readFileSync(f, 'utf-8')));
  return documents;
}

function cacheDir(): string {
  const src = join(root, '..', 'src', 'builder');
  const hash = createHash('sha256').update(JSON.stringify(defaultConfig.build));
  for (const f of corpusFiles) hash.update(relative(corpusDir, f)).update(readFileSync(f));
  const key = hash
    .update(readFileSync(join(src, 'chunker.ts')))
    .update(readFileSync(join(src, 'embedder.ts')))
    .digest('hex')
    .slice(0, 12);
  return join(root, '.cache', key);
}

async function loadDatabase(): Promise<VectorDatabase> {
  const dir = cacheDir();
  const cached = join(dir, 'vector-db.json');
  if (existsSync(cached)) return JSON.parse(readFileSync(cached, 'utf-8')) as VectorDatabase;

  const documents = await loadDocuments();
  const { VectorDBBuilder } = await import('../src/builder/vector-db-builder.js');
  const builder = new VectorDBBuilder({
    chunkSize: defaultConfig.build?.chunkSize,
    chunkOverlap: defaultConfig.build?.chunkOverlap,
    minChunkSize: defaultConfig.build?.minChunkSize,
  });
  mkdirSync(dir, { recursive: true });
  return builder.build(documents, dir);
}

const fmt = (n: number) => n.toFixed(2).padStart(6);

async function main() {
  const db = await loadDatabase();
  const chunks = db.chunks;
  const golden = loadGolden(chunks);

  const embedder = new ClientEmbedder(db.model);
  const index = new BM25Index(chunks.map((c) => ({ id: c.id, text: c.text })));
  const shipped = new VectorSearch();
  shipped.setDatabase(db);

  const arms: Record<string, (query: string, embedding: number[]) => Promise<DocumentChunk[]>> = {
    grep: async (q) => grepRank(chunks, q),
    bm25: async (q) => bm25Rank(chunks, index, q),
    dense: async (_q, e) => denseRank(chunks, e),
    hybrid: async (q, e) => hybridRank(chunks, index, q, e),
    shipped: async (q, e) => (await shipped.search(e, q, K, DEFAULT_MIN_SCORE)).map((r) => r.chunk),
  };

  const results: Record<string, Target[][]> = Object.fromEntries(Object.keys(arms).map((a) => [a, []]));
  for (const q of golden) {
    const embedding = await embedder.embed(q.query);
    for (const [arm, rank] of Object.entries(arms)) {
      results[arm].push((await rank(q.query, embedding)).slice(0, K).map((c) => c.metadata));
    }
  }

  console.log(`\n${chunks.length} chunks, ${golden.length} queries, k=${K}\n`);
  console.log(`${'arm'.padEnd(8)} ${'split'.padEnd(8)} ${'R@k'.padStart(6)} ${'MRR'.padStart(6)} ${'FP'.padStart(6)}`);
  for (const arm of Object.keys(arms)) {
    for (const split of [...SPLITS, 'all'] as const) {
      const picked = golden.flatMap((q, i) => (split === 'all' || q.split === split ? [i] : []));
      const s = summarize(picked.map((i) => golden[i]), picked.map((i) => results[arm][i]), K);
      console.log(`${arm.padEnd(8)} ${split.padEnd(8)} ${fmt(s.recall)} ${fmt(s.mrr)} ${fmt(s.falsePositiveRate)}`);
    }
  }

  const kinds = [...new Set(golden.filter((q) => q.expect.length > 0).map((q) => q.id.split('-')[0]))];
  console.log(`\nanswerable by kind (all splits): R@k / MRR\n`);
  console.log(`${'kind'.padEnd(14)} ${Object.keys(arms).map((a) => a.padStart(13)).join('')}`);
  for (const kind of kinds) {
    const picked = golden.flatMap((q, i) => (q.id.startsWith(`${kind}-`) ? [i] : []));
    const cells = Object.keys(arms).map((arm) => {
      const s = summarize(picked.map((i) => golden[i]), picked.map((i) => results[arm][i]), K);
      return `${s.recall.toFixed(2)} / ${s.mrr.toFixed(2)}`.padStart(13);
    });
    console.log(`${`${kind} (${picked.length})`.padEnd(14)} ${cells.join('')}`);
  }

  console.log(`\nper query: first relevant rank (answerable) or result count (negative)\n`);
  console.log(`${'id'.padEnd(28)} ${Object.keys(arms).map((a) => a.padStart(8)).join('')}`);
  golden.forEach((q, i) => {
    const cells = Object.keys(arms).map((arm) => {
      const ranked = results[arm][i];
      if (q.expect.length === 0) return (ranked.length === 0 ? 'ok' : `n=${ranked.length}`).padStart(8);
      const rr = reciprocalRank(q.expect, ranked, K);
      return (rr === 0 ? '-' : String(Math.round(1 / rr))).padStart(8);
    });
    console.log(`${q.id.padEnd(28)} ${cells.join('')}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
