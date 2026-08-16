import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chunker } from './chunker.js';
import { ProcessedDocument } from '../types/document.js';

function makeDoc(content: string): ProcessedDocument {
  return {
    filePath: '/docs/guide.md',
    relativePath: 'guide.md',
    content,
    html: '',
    metadata: { title: 'Guide' },
    url: '/guide.html',
  };
}

test('splits a document into one chunk per heading', () => {
  const chunker = new Chunker();
  const doc = makeDoc('# Intro\nHello there.\n\n## Setup\nInstall the thing.\n');

  const chunks = chunker.chunkDocument(doc);

  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].metadata.heading, 'Intro');
  assert.match(chunks[0].text, /Hello there/);
  assert.equal(chunks[1].metadata.heading, 'Setup');
  assert.match(chunks[1].text, /Install the thing/);
});

test('carries source metadata onto every chunk', () => {
  const chunker = new Chunker();
  const doc = makeDoc('# Intro\nHello there.\n');

  const [chunk] = chunker.chunkDocument(doc, 'abc123');

  assert.equal(chunk.metadata.sourceFile, 'guide.md');
  assert.equal(chunk.metadata.title, 'Guide');
  assert.equal(chunk.metadata.url, '/guide.html');
  assert.equal(chunk.metadata.fileHash, 'abc123');
  assert.equal(chunk.metadata.headingId, 'intro');
});

test('keeps fenced code blocks intact even when they contain heading-like lines', () => {
  const chunker = new Chunker();
  const doc = makeDoc('# Intro\n```md\n# not a real heading\n```\n');

  const chunks = chunker.chunkDocument(doc);

  assert.equal(chunks.length, 1);
  assert.match(chunks[0].text, /```md\n# not a real heading\n```/);
});

test('splits an oversized section into multiple overlapping chunks', () => {
  const chunker = new Chunker({ maxChunkSize: 20, chunkOverlap: 5 });
  const longBody = Array.from({ length: 20 }, (_, i) => `line ${i} of filler text`).join('\n');
  const doc = makeDoc(`# Big Section\n${longBody}\n`);

  const chunks = chunker.chunkDocument(doc);

  assert.ok(chunks.length > 1, 'expected the section to split into multiple chunks');
  for (const chunk of chunks) {
    assert.equal(chunk.metadata.heading, 'Big Section');
  }
});

test('drops chunks that are empty after trimming', () => {
  const chunker = new Chunker();
  const doc = makeDoc('# Intro\n\n\n## Setup\nInstall the thing.\n');

  const chunks = chunker.chunkDocument(doc);

  assert.ok(chunks.every((chunk) => chunk.text.trim().length > 0));
});
