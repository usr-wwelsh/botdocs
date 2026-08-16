import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MarkdownProcessor } from './markdown-processor.js';

test('render converts basic markdown to HTML', () => {
  const processor = new MarkdownProcessor();
  const html = processor.render('# Title\n\nSome **bold** text.');
  assert.match(html, /<h1[^>]*>/);
  assert.match(html, /<strong>bold<\/strong>/);
});

test('render supports GitHub-style task lists', () => {
  const processor = new MarkdownProcessor();
  const html = processor.render('- [x] done\n- [ ] todo');
  assert.match(html, /checked/);
  assert.match(html, /type="checkbox"/);
});

test('render supports GitHub alert callouts', () => {
  const processor = new MarkdownProcessor();
  const html = processor.render('> [!NOTE]\n> Heads up.');
  assert.match(html, /markdown-alert-note/);
});

// Shared across the processFile tests below: setupShiki() loads every
// bundled language grammar on first call (~15s) and memoizes per instance,
// so a fresh MarkdownProcessor per test would pay that cost repeatedly.
const sharedProcessor = new MarkdownProcessor();

test('processFile parses front matter and title from an explicit heading', async () => {
  const doc = await sharedProcessor.processFile('/docs/guide.md', '/docs', '# My Guide\n\nBody text.');

  assert.equal(doc.metadata.title, 'My Guide');
  assert.equal(doc.relativePath, 'guide.md');
  assert.equal(doc.url, '/guide.html');
  assert.match(doc.html, /Body text/);
});

test('processFile prefers front matter title over an h1 heading', async () => {
  const content = '---\ntitle: Front Matter Title\n---\n# Heading Title\n';
  const doc = await sharedProcessor.processFile('/docs/guide.md', '/docs', content);

  assert.equal(doc.metadata.title, 'Front Matter Title');
});

test('processFile falls back to a banner image alt text for the title', async () => {
  const content = '![Project Banner](banner.svg)\n\nIntro text.';
  const doc = await sharedProcessor.processFile('/docs/README.md', '/docs', content);

  assert.equal(doc.metadata.title, 'Project Banner');
});

test('processFile ignores a "#" that appears inside a fenced code block', async () => {
  const content = '```bash\n# not a heading, a shell comment\n```\n\n# Real Heading\n';
  const doc = await sharedProcessor.processFile('/docs/guide.md', '/docs', content);

  assert.equal(doc.metadata.title, 'Real Heading');
});

test('processFile falls back to a title-cased filename when no title is found', async () => {
  const doc = await sharedProcessor.processFile('/docs/getting-started.md', '/docs', 'Just body text.');

  assert.equal(doc.metadata.title, 'Getting Started');
});

test('processFile derives the root URL for index.md', async () => {
  const doc = await sharedProcessor.processFile('/docs/index.md', '/docs', '# Home\n');

  assert.equal(doc.url, '/');
});
