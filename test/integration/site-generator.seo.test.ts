// Runs against the built dist/ output: the site generator resolves
// src/templates/ relative to its compiled location, so this exercises the
// real shipped code path. Requires `npm run build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { SiteGenerator } from '../../dist/src/builder/site-generator.js';
import { defaultConfig, BotdocsConfig } from '../../dist/src/types/config.js';

function makeDocsSite(): { inputDir: string; outputDir: string; cleanup(): void } {
  const base = mkdtempSync(join(tmpdir(), 'botdocs-seo-'));
  const inputDir = join(base, 'input');
  const outputDir = join(base, 'output');
  const docs = join(inputDir, 'guides');
  mkdirSync(docs, { recursive: true });
  writeFileSync(
    join(inputDir, 'README.md'),
    '---\ntitle: Home\ndescription: Site home\n---\n# Home\n'
  );
  writeFileSync(
    join(docs, 'setup.md'),
    '---\ntitle: Setup\ndescription: How to install\n---\n# Setup\n'
  );
  return {
    inputDir,
    outputDir,
    cleanup: () => rmSync(base, { recursive: true, force: true }),
  };
}

test('generate emits sitemap.xml with absolute URLs when baseUrl is configured', async () => {
  const site = makeDocsSite();
  try {
    const generator = new SiteGenerator();
    await generator.generate(site.inputDir, site.outputDir, {
      ...defaultConfig,
      baseUrl: 'https://example.com/docs/',
    });

    const sitemapPath = join(site.outputDir, 'sitemap.xml');
    assert.ok(existsSync(sitemapPath));
    const sitemap = readFileSync(sitemapPath, 'utf-8');
    assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    assert.match(sitemap, /<loc>https:\/\/example\.com\/docs\/<\/loc>/);
    assert.match(sitemap, /<loc>https:\/\/example\.com\/docs\/guides\/setup\.html<\/loc>/);
  } finally {
    site.cleanup();
  }
});

test('generate skips sitemap.xml when no baseUrl is configured', async () => {
  const site = makeDocsSite();
  try {
    const generator = new SiteGenerator();
    await generator.generate(site.inputDir, site.outputDir, defaultConfig);

    assert.equal(existsSync(join(site.outputDir, 'sitemap.xml')), false);
  } finally {
    site.cleanup();
  }
});

test('generated pages carry Open Graph and twitter card tags', async () => {
  const site = makeDocsSite();
  try {
    const generator = new SiteGenerator();
    await generator.generate(site.inputDir, site.outputDir, {
      ...defaultConfig,
      title: 'My Docs',
      description: 'Great docs',
      baseUrl: 'https://example.com/docs/',
    });

    const html = readFileSync(join(site.outputDir, 'index.html'), 'utf-8');
    assert.match(html, /<meta property="og:title" content="Home - My Docs">/);
    assert.match(html, /<meta property="og:description" content="Site home">/);
    assert.match(html, /<meta property="og:type" content="website">/);
    assert.match(html, /<meta property="og:url" content="https:\/\/example\.com\/docs\/">/);
    assert.match(html, /<meta name="twitter:card" content="summary">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/example\.com\/docs\/">/);
  } finally {
    site.cleanup();
  }
});

test('pages without a configured baseUrl omit og:url and canonical', async () => {
  const site = makeDocsSite();
  try {
    const generator = new SiteGenerator();
    const config: BotdocsConfig = { ...defaultConfig, title: 'My Docs' };
    await generator.generate(site.inputDir, site.outputDir, config);

    const html = readFileSync(join(site.outputDir, 'index.html'), 'utf-8');
    assert.doesNotMatch(html, /og:url/);
    assert.doesNotMatch(html, /rel="canonical"/);
    assert.match(html, /<meta name="twitter:card" content="summary">/);
  } finally {
    site.cleanup();
  }
});
