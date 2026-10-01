import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { VectorDBBuilder } from './vector-db-builder.js';
import { ProcessedDocument } from '../types/document.js';

test('build leaves pages with search: false front matter out of the index', async () => {
  const outputDir = mkdtempSync(join(tmpdir(), 'botdocs-vdb-'));
  const landing: ProcessedDocument = {
    filePath: '/docs/README.md',
    relativePath: 'README.md',
    content: '# Home\n\nTry searching for `run an LLM on my own machine without a GPU`.',
    html: '',
    metadata: { title: 'Home', search: false },
    url: '/index.html',
  };

  const db = await new VectorDBBuilder().build([landing], outputDir);

  assert.equal(db.chunks.length, 0);
});
