import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontMatter } from './front-matter.js';

test('splits a leading yaml block from the body', () => {
  const { data, content } = parseFrontMatter('---\ntitle: Hello\ntags: [a, b]\n---\n# Body\n');
  assert.deepEqual(data, { title: 'Hello', tags: ['a', 'b'] });
  assert.equal(content, '# Body\n');
});

test('returns the input untouched when there is no front matter', () => {
  const { data, content } = parseFrontMatter('# Just a doc\n');
  assert.deepEqual(data, {});
  assert.equal(content, '# Just a doc\n');
});

test('handles windows line endings', () => {
  const { data, content } = parseFrontMatter('---\r\ntitle: Hello\r\n---\r\nBody\r\n');
  assert.equal(data.title, 'Hello');
  assert.equal(content, 'Body\r\n');
});

test('handles a leading byte order mark', () => {
  const { data, content } = parseFrontMatter('﻿---\ntitle: Hello\n---\nBody');
  assert.equal(data.title, 'Hello');
  assert.equal(content, 'Body');
});

test('an empty block yields empty data', () => {
  const { data, content } = parseFrontMatter('---\n---\nBody');
  assert.deepEqual(data, {});
  assert.equal(content, 'Body');
});

test('a horizontal rule later in the body is not front matter', () => {
  const input = 'Intro\n\n---\n\nMore\n---\n';
  const { data, content } = parseFrontMatter(input);
  assert.deepEqual(data, {});
  assert.equal(content, input);
});

test('an unterminated block is treated as body', () => {
  const input = '---\ntitle: Hello\n\nBody';
  const { data, content } = parseFrontMatter(input);
  assert.deepEqual(data, {});
  assert.equal(content, input);
});

test('a closing delimiter must be a whole line', () => {
  const { data, content } = parseFrontMatter('---\ntitle: a---b\n---\nBody');
  assert.equal(data.title, 'a---b');
  assert.equal(content, 'Body');
});

test('a non-mapping block yields empty data', () => {
  const { data, content } = parseFrontMatter('---\n- one\n- two\n---\nBody');
  assert.deepEqual(data, {});
  assert.equal(content, 'Body');
});

test('invalid yaml throws instead of being silently dropped', () => {
  assert.throws(() => parseFrontMatter('---\ntitle: [unclosed\n---\nBody'));
});

test('yaml tags never produce executable values', () => {
  const { data } = parseFrontMatter('---\nx: !!js/function "function(){}"\n---\nBody');
  assert.notEqual(typeof data.x, 'function');
});
