import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grepRank } from './retrievers.js';

const chunk = (id: string, text: string) => ({
  id,
  text,
  embedding: [],
  metadata: { sourceFile: `${id}.md`, title: id, url: `/${id}.html` },
});

test('grep ranks chunks by how many distinct query words they contain', () => {
  const chunks = [chunk('one', 'install the binary'), chunk('two', 'install the static binary release')];
  assert.deepEqual(
    grepRank(chunks, 'static binary install').map((c) => c.id),
    ['two', 'one']
  );
});

test('grep matches case-insensitively', () => {
  assert.equal(grepRank([chunk('one', 'Proxmox LXC')], 'proxmox').length, 1);
});

test('grep returns nothing when no query word appears', () => {
  assert.deepEqual(grepRank([chunk('one', 'install the binary')], 'kubernetes'), []);
});
