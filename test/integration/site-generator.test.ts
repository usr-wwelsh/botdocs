// Runs against the built dist/ output rather than src/ directly: the site
// generator resolves src/templates/ relative to its own compiled location
// (dist/src/builder -> project root), so this exercises the real shipped
// code path. Requires `npm run build` first — see the test:integration script.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SiteGenerator } from '../../dist/src/builder/site-generator.js';
import { defaultConfig } from '../../dist/src/types/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputDir = resolve(__dirname, '../../test-docs');

test('generate renders every markdown fixture into HTML with navigation and index.html', async () => {
  const outputDir = mkdtempSync(join(tmpdir(), 'botdocs-site-generator-'));

  try {
    const generator = new SiteGenerator();
    const documents = await generator.generate(inputDir, outputDir, defaultConfig);

    assert.ok(documents.length > 0);

    for (const doc of documents) {
      const outPath = join(outputDir, doc.relativePath.replace(/\.md$/, '.html'));
      assert.ok(existsSync(outPath), `expected ${outPath} to be generated`);

      const html = readFileSync(outPath, 'utf-8');
      assert.match(html, /<nav/);
      assert.match(html, new RegExp(doc.metadata.title as string));
    }

    // index.md/README.md is copied to /index.html
    assert.ok(existsSync(join(outputDir, 'index.html')));
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
});

test('generate throws when the input directory has no markdown files', async () => {
  const emptyInput = mkdtempSync(join(tmpdir(), 'botdocs-empty-input-'));
  const outputDir = mkdtempSync(join(tmpdir(), 'botdocs-empty-output-'));

  try {
    const generator = new SiteGenerator();
    await assert.rejects(() => generator.generate(emptyInput, outputDir, defaultConfig));
  } finally {
    rmSync(emptyInput, { recursive: true, force: true });
    rmSync(outputDir, { recursive: true, force: true });
  }
});
