// Runs against the built dist/ output. Requires `npm run build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { SiteGenerator } from '../../dist/src/builder/site-generator.js';
import { defaultConfig } from '../../dist/src/types/config.js';

const setupSource = '---\ntitle: Setup\ndescription: How to install\n---\n# Setup\n\nRun it.\n';

function makeDocsSite(): { inputDir: string; outputDir: string; cleanup(): void } {
  const base = mkdtempSync(join(tmpdir(), 'botdocs-agents-'));
  const inputDir = join(base, 'input');
  const outputDir = join(base, 'output');
  mkdirSync(join(inputDir, 'guides'), { recursive: true });
  writeFileSync(join(inputDir, 'README.md'), '---\ntitle: Home\ndescription: Site home\n---\n# Home\n');
  writeFileSync(join(inputDir, 'guides', 'setup.md'), setupSource);
  return {
    inputDir,
    outputDir,
    cleanup: () => rmSync(base, { recursive: true, force: true }),
  };
}

async function build(config = defaultConfig) {
  const site = makeDocsSite();
  await new SiteGenerator().generate(site.inputDir, site.outputDir, config);
  return site;
}

test('raw markdown source is published next to each page', async () => {
  const site = await build();
  try {
    assert.equal(readFileSync(join(site.outputDir, 'guides', 'setup.md'), 'utf-8'), setupSource);
    assert.ok(existsSync(join(site.outputDir, 'README.md')));
  } finally {
    site.cleanup();
  }
});

test('llms.txt indexes every page with relative markdown links when no baseUrl', async () => {
  const site = await build({
    ...defaultConfig,
    title: 'My Docs',
    description: '<a href="https://x.test">Great</a> docs',
  });
  try {
    const llms = readFileSync(join(site.outputDir, 'llms.txt'), 'utf-8');
    assert.equal(
      llms,
      '# My Docs\n\n> Great docs\n\n## Docs\n\n' +
        '- [Home](README.md): Site home\n' +
        '- [Setup](guides/setup.md): How to install\n'
    );
  } finally {
    site.cleanup();
  }
});

test('llms.txt links are absolute when baseUrl is configured', async () => {
  const site = await build({ ...defaultConfig, baseUrl: 'https://example.com/docs/' });
  try {
    const llms = readFileSync(join(site.outputDir, 'llms.txt'), 'utf-8');
    assert.match(llms, /- \[Setup\]\(https:\/\/example\.com\/docs\/guides\/setup\.md\): How to install/);
  } finally {
    site.cleanup();
  }
});

test('robots.txt allows all and points at the sitemap when baseUrl is configured', async () => {
  const site = await build({ ...defaultConfig, baseUrl: 'https://example.com/' });
  try {
    assert.equal(
      readFileSync(join(site.outputDir, 'robots.txt'), 'utf-8'),
      'User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml\n'
    );
  } finally {
    site.cleanup();
  }
});

test('robots.txt is skipped when no baseUrl is configured', async () => {
  const site = await build();
  try {
    assert.equal(existsSync(join(site.outputDir, 'robots.txt')), false);
  } finally {
    site.cleanup();
  }
});
