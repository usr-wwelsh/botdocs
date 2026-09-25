import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rootPrefix, relativeUrl } from './site-root.js';

test('pages at the site root reach the root through ./', () => {
  assert.equal(rootPrefix('/'), './');
  assert.equal(rootPrefix('/about.html'), './');
});

test('nested pages climb one ../ per folder', () => {
  assert.equal(rootPrefix('/guides/setup.html'), '../');
  assert.equal(rootPrefix('/guides/deep/setup.html'), '../../');
});

test('root-absolute urls become relative to the page', () => {
  assert.equal(relativeUrl('../', '/about.html'), '../about.html');
  assert.equal(relativeUrl('./', '/guides/setup.html#install'), './guides/setup.html#install');
});

test('the bare root url points at index.html so it also resolves from disk', () => {
  assert.equal(relativeUrl('../../', '/'), '../../index.html');
});

test('urls that are already relative or external pass through unchanged', () => {
  assert.equal(relativeUrl('../', 'https://example.com/x'), 'https://example.com/x');
  assert.equal(relativeUrl('../', '#section'), '#section');
});

test('protocol-relative urls are left alone rather than treated as site paths', () => {
  assert.equal(relativeUrl('../', '//cdn.example.com/x.js'), '//cdn.example.com/x.js');
});
