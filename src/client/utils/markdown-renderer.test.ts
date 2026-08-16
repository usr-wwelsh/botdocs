import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from './markdown-renderer.js';

test('escapes raw HTML in plain text', () => {
  assert.equal(renderMarkdown('<script>alert(1)</script>'), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
});

test('renders a heading as a distinct block, not inline text', () => {
  const html = renderMarkdown('### Section Title\n\nBody text.');
  assert.match(html, /<h3>Section Title<\/h3>/);
  assert.doesNotMatch(html, /<p>.*<h3>/);
});

test('renders a horizontal rule between two paragraphs', () => {
  const html = renderMarkdown('First section.\n\n---\n\nSecond section.');
  assert.match(html, /<hr \/>/);
});

test('renders consecutive "- " lines as a single bulleted list', () => {
  const html = renderMarkdown('- first item\n- second item\n- third item');
  assert.match(html, /<ul><li>first item<\/li><li>second item<\/li><li>third item<\/li><\/ul>/);
});

test('list items support inline formatting like links and bold', () => {
  const html = renderMarkdown('- see [the docs](https://example.com) for **details**');
  assert.match(html, /<li>see <a href="https:\/\/example.com" target="_blank">the docs<\/a> for <strong>details<\/strong><\/li>/);
});

test('a list is visually separated from surrounding paragraphs', () => {
  const html = renderMarkdown('Intro.\n\n- one\n- two\n\nOutro.');
  assert.match(html, /<p>Intro.<\/p><ul>/);
  assert.match(html, /<\/ul><p>Outro.<\/p>/);
});

test('still supports bold, italic, inline code, and links', () => {
  const html = renderMarkdown('**bold** *italic* `code` [link](https://example.com)');
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>italic<\/em>/);
  assert.match(html, /<code>code<\/code>/);
  assert.match(html, /<a href="https:\/\/example.com" target="_blank">link<\/a>/);
});
