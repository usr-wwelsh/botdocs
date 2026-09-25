// Runs against the built dist/ output. Requires `npm run build` first.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { SiteGenerator } from '../../dist/src/builder/site-generator.js';
import { defaultConfig } from '../../dist/src/types/config.js';

async function buildSite(): Promise<{ read(path: string): string; cleanup(): void }> {
  const base = mkdtempSync(join(tmpdir(), 'botdocs-relative-'));
  const inputDir = join(base, 'input');
  const outputDir = join(base, 'output');
  mkdirSync(join(inputDir, 'guides', 'deep'), { recursive: true });
  writeFileSync(join(inputDir, 'README.md'), '# Home\n');
  writeFileSync(join(inputDir, 'about.md'), '# About\n');
  writeFileSync(join(inputDir, 'guides', 'README.md'), '# Guides\n');
  writeFileSync(join(inputDir, 'guides', 'deep', 'setup.md'), '# Setup\n');
  await new SiteGenerator().generate(inputDir, outputDir, defaultConfig);
  return {
    read: (path) => readFileSync(join(outputDir, path), 'utf-8'),
    cleanup: () => rmSync(base, { recursive: true, force: true }),
  };
}

let site: Awaited<ReturnType<typeof buildSite>>;
before(async () => {
  site = await buildSite();
});
after(() => site.cleanup());

function hrefsAndSrcs(html: string): string[] {
  return [...html.matchAll(/(?:href|src)="([^"]*)"/g)].map((m) => m[1]);
}

test('generated pages contain no root-absolute links so the site works under any subpath', async () => {
  for (const page of ['index.html', 'about.html', 'guides/README.html', 'guides/deep/setup.html']) {
    const rootAbsolute = hrefsAndSrcs(site.read(page)).filter((url) => url.startsWith('/'));
    assert.deepEqual(rootAbsolute, [], page);
  }
});

test('nested pages reach assets and sibling pages through parent-relative paths', async () => {
  const urls = hrefsAndSrcs(site.read('guides/deep/setup.html'));
  assert.ok(urls.includes('../../assets/css/bundle.css'));
  assert.ok(urls.includes('../../assets/js/bundle.js'));
  assert.ok(urls.includes('../../about.html'));
  assert.ok(urls.includes('../../guides/README.html'));
});

test('pages expose their path to the site root for client-side fetches', async () => {
  assert.match(site.read('index.html'), /<meta name="botdocs-root" content="\.\/">/);
  assert.match(site.read('guides/deep/setup.html'), /<meta name="botdocs-root" content="\.\.\/\.\.\/">/);
});
