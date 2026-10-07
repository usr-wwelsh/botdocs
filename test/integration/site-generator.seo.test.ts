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
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
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

test('generate ships the botdocs logo as favicon on every page', async () => {
  const site = makeDocsSite();
  try {
    await new SiteGenerator().generate(site.inputDir, site.outputDir, defaultConfig);
    assert.ok(existsSync(join(site.outputDir, 'assets', 'logo.svg')));
    const root = readFileSync(join(site.outputDir, 'README.html'), 'utf-8');
    const nested = readFileSync(join(site.outputDir, 'guides', 'setup.html'), 'utf-8');
    assert.match(root, /<link rel="icon" type="image\/svg\+xml" href="\.\/assets\/logo\.svg">/);
    assert.match(nested, /<link rel="icon" type="image\/svg\+xml" href="\.\.\/assets\/logo\.svg">/);
  } finally {
    site.cleanup();
  }
});

test('attribution footer shows the logo and disappears with attribution:false', async () => {
  const site = makeDocsSite();
  try {
    await new SiteGenerator().generate(site.inputDir, site.outputDir, defaultConfig);
    const on = readFileSync(join(site.outputDir, 'README.html'), 'utf-8');
    assert.match(on, /<footer class="botdocs-attribution">[\s\S]*<img class="botdocs-logo" src="\.\/assets\/logo\.svg"/);
    await new SiteGenerator().generate(site.inputDir, site.outputDir, { ...defaultConfig, attribution: false });
    const off = readFileSync(join(site.outputDir, 'README.html'), 'utf-8');
    assert.doesNotMatch(off, /botdocs-logo/);
  } finally {
    site.cleanup();
  }
});

test('baseUrl enables a logo-based social card image', async () => {
  const site = makeDocsSite();
  try {
    await new SiteGenerator().generate(site.inputDir, site.outputDir, {
      ...defaultConfig,
      title: 'My Docs',
      baseUrl: 'https://example.com/docs/',
    });
    assert.ok(existsSync(join(site.outputDir, 'assets', 'og.png')));
    const html = readFileSync(join(site.outputDir, 'guides', 'setup.html'), 'utf-8');
    assert.match(html, /<meta property="og:image" content="https:\/\/example\.com\/docs\/assets\/og\.png">/);
    assert.match(html, /<meta name="twitter:image" content="https:\/\/example\.com\/docs\/assets\/og\.png">/);
    assert.match(html, /<meta property="og:image:width" content="1200">/);
    assert.match(html, /<meta property="og:site_name" content="My Docs">/);
  } finally {
    site.cleanup();
  }
});

test('without baseUrl there is no og:image and the card stays summary', async () => {
  const site = makeDocsSite();
  try {
    await new SiteGenerator().generate(site.inputDir, site.outputDir, defaultConfig);
    const html = readFileSync(join(site.outputDir, 'README.html'), 'utf-8');
    assert.doesNotMatch(html, /og:image/);
    assert.doesNotMatch(html, /twitter:image/);
  } finally {
    site.cleanup();
  }
});

test('page title is not repeated when it equals the site title', async () => {
  const site = makeDocsSite();
  try {
    await new SiteGenerator().generate(site.inputDir, site.outputDir, { ...defaultConfig, title: 'Home' });
    const html = readFileSync(join(site.outputDir, 'README.html'), 'utf-8');
    assert.match(html, /<title>Home<\/title>/);
    assert.match(html, /<meta property="og:title" content="Home">/);
  } finally {
    site.cleanup();
  }
});

test('meta attributes escape quotes in descriptions', async () => {
  const site = makeDocsSite();
  try {
    writeFileSync(join(site.inputDir, 'q.md'), '---\ndescription: say "hi" & <go>\n---\n# Q\n');
    await new SiteGenerator().generate(site.inputDir, site.outputDir, defaultConfig);
    const html = readFileSync(join(site.outputDir, 'q.html'), 'utf-8');
    assert.match(html, /<meta name="description" content="say &quot;hi&quot; &amp;">/);
  } finally {
    site.cleanup();
  }
});

test('baseUrl adds JSON-LD structured data with the canonical url', async () => {
  const site = makeDocsSite();
  try {
    await new SiteGenerator().generate(site.inputDir, site.outputDir, {
      ...defaultConfig,
      title: 'My Docs',
      baseUrl: 'https://example.com/docs/',
    });
    const html = readFileSync(join(site.outputDir, 'guides', 'setup.html'), 'utf-8');
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(match);
    const data = JSON.parse(match[1]);
    assert.equal(data['@type'], 'TechArticle');
    assert.equal(data.headline, 'Setup');
    assert.equal(data.description, 'How to install');
    assert.equal(data.url, 'https://example.com/docs/guides/setup.html');
    assert.equal(data.image, 'https://example.com/docs/assets/og.png');
  } finally {
    site.cleanup();
  }
});

test('an og.png in the input folder replaces the default social card', async () => {
  const site = makeDocsSite();
  try {
    writeFileSync(join(site.inputDir, 'og.png'), 'custom-card');
    await new SiteGenerator().generate(site.inputDir, site.outputDir, {
      ...defaultConfig,
      baseUrl: 'https://example.com/',
    });
    assert.equal(readFileSync(join(site.outputDir, 'assets', 'og.png'), 'utf-8'), 'custom-card');
  } finally {
    site.cleanup();
  }
});
