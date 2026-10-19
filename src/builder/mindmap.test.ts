import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMindmapSVG } from './mindmap.js';

const source = `mindmap
  root((Docs))
    Guides
      Install
      Configure
    Reference
      CLI`;

test('renderMindmapSVG draws every node label', () => {
  const svg = renderMindmapSVG(source);
  for (const label of ['Docs', 'Guides', 'Install', 'Configure', 'Reference', 'CLI']) {
    assert.match(svg, new RegExp(`>${label}<`));
  }
});

test('renderMindmapSVG draws one edge per non-root node', () => {
  const svg = renderMindmapSVG(source);
  assert.equal(svg.match(/<path /g)?.length, 5);
});

test('renderMindmapSVG strips shape delimiters from labels', () => {
  const svg = renderMindmapSVG('mindmap\n  a[Square]\n    b(Round)\n    c))Bang((\n    d{{Hex}}');
  for (const label of ['Square', 'Round', 'Bang', 'Hex']) assert.match(svg, new RegExp(`>${label}<`));
});

test('renderMindmapSVG escapes label markup', () => {
  const svg = renderMindmapSVG('mindmap\n  root\n    <img src=x onerror=alert(1)>');
  assert.doesNotMatch(svg, /<img/);
  assert.match(svg, /&lt;img/);
});

test('renderMindmapSVG ignores icon and class directives', () => {
  const svg = renderMindmapSVG('mindmap\n  root\n    child\n    ::icon(fa fa-book)\n    :::urgent');
  assert.doesNotMatch(svg, /icon|urgent/);
});

test('renderMindmapSVG uses theme CSS variables, not fixed colors for text', () => {
  assert.match(renderMindmapSVG(source), /var\(--text-primary\)/);
});

test('renderMindmapSVG rejects a mindmap with no nodes', () => {
  assert.throws(() => renderMindmapSVG('mindmap'));
});

test('renderMindmapSVG rejects multiple roots', () => {
  assert.throws(() => renderMindmapSVG('mindmap\n  a\n  b'));
});

test('renderMindmapSVG centers the root horizontally in the viewBox', () => {
  const svg = renderMindmapSVG('mindmap\n  root((Docs))\n    A\n      a very long leaf label that widens the right side\n    B');
  const [minX, , width] = svg.match(/viewBox="([^"]+)"/)![1].split(' ').map(Number);
  assert.equal(minX + width / 2, 0);
});
