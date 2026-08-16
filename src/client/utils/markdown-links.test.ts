import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripInlineLinks } from './markdown-links.js';

test('leaves plain text untouched', () => {
  assert.equal(stripInlineLinks('just a normal sentence'), 'just a normal sentence');
});

test('collapses a markdown link down to its visible text', () => {
  assert.equal(
    stripInlineLinks('[View on GitHub](https://github.com/usr-wwelsh/Blopple) for more'),
    'View on GitHub for more'
  );
});

test('collapses a markdown image down to its alt text', () => {
  assert.equal(
    stripInlineLinks('![npm version](https://img.shields.io/npm/v/botdocs.svg)'),
    'npm version'
  );
});

test('collapses a badge-style image-inside-link without leaving stray brackets', () => {
  assert.equal(
    stripInlineLinks(
      '[![npm version](https://img.shields.io/npm/v/botdocs.svg)](https://www.npmjs.com/package/botdocs)'
    ),
    'npm version'
  );
});
