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

// Shared across the processFile tests below so Shiki's highlighter and
// grammars load once rather than per test.
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

test('processFile syntax-highlights fenced code in a known language', async () => {
  const doc = await sharedProcessor.processFile('/docs/a.md', '/docs', '```go\nfunc main() {}\n```');

  assert.match(doc.html, /class="shiki/);
  assert.match(doc.html, /func/);
});

test('processFile highlights a different language in a later file', async () => {
  const doc = await sharedProcessor.processFile('/docs/b.md', '/docs', '```rust\nfn main() {}\n```');

  assert.match(doc.html, /class="shiki/);
});

test('processFile renders an unknown fence language as escaped plain code', async () => {
  const doc = await sharedProcessor.processFile('/docs/c.md', '/docs', '```nosuchlang\n<b>x</b>\n```');

  assert.doesNotMatch(doc.html, /<b>x/);
});

test('processFile highlights correctly when files are processed concurrently', async () => {
  const processor = new MarkdownProcessor();
  const docs = await Promise.all([
    processor.processFile('/docs/d.md', '/docs', '```python\nprint(1)\n```'),
    processor.processFile('/docs/e.md', '/docs', '```bash\necho hi\n```'),
  ]);

  for (const doc of docs) assert.match(doc.html, /class="shiki/);
});

test('processFile derives a description from the first prose paragraph', async () => {
  const content = '# Guide\n\n[![badge](https://x/y.svg)](https://x)\n\nBotdocs turns [markdown](https://m.d) into **fast** static sites with `search`.\n\nSecond paragraph.';
  const doc = await sharedProcessor.processFile('/docs/guide.md', '/docs', content);

  assert.equal(doc.metadata.description, 'Botdocs turns markdown into fast static sites with search.');
});

test('processFile keeps a front matter description over derived prose', async () => {
  const content = '---\ndescription: Explicit\n---\n# Guide\n\nThis paragraph is long enough to be a description.';
  const doc = await sharedProcessor.processFile('/docs/guide.md', '/docs', content);

  assert.equal(doc.metadata.description, 'Explicit');
});

test('processFile truncates derived descriptions to 160 characters on a word boundary', async () => {
  const content = `# Guide\n\n${'word '.repeat(60)}`;
  const doc = await sharedProcessor.processFile('/docs/guide.md', '/docs', content);

  assert.ok(doc.metadata.description.length <= 160);
  assert.match(doc.metadata.description, /word…$/);
});

test('processFile leaves description empty when there is no prose', async () => {
  const doc = await sharedProcessor.processFile('/docs/guide.md', '/docs', '# Guide\n\n- a\n- b\n');

  assert.equal(doc.metadata.description, undefined);
});
