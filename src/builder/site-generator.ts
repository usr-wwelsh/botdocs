import { readFileSync, writeFileSync, readdirSync, mkdirSync, cpSync } from 'fs';
import { join, dirname, relative, resolve, basename } from 'path';
import { MarkdownProcessor } from './markdown-processor.js';
import { TemplateEngine } from './template-engine.js';
import { ProcessedDocument, NavigationItem } from '../types/document.js';
import { BotdocsConfig } from '../types/config.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

export class SiteGenerator {
  private processor: MarkdownProcessor;
  private templateEngine: TemplateEngine;
  private documents: ProcessedDocument[] = [];

  constructor() {
    this.processor = new MarkdownProcessor();
    this.templateEngine = new TemplateEngine();
  }

  /**
   * Generate the complete site
   */
  async generate(
    inputDir: string,
    outputDir: string,
    config: BotdocsConfig
  ): Promise<ProcessedDocument[]> {
    console.log('Processing markdown files...');

    // Find all markdown files using native Node.js readdir
    const allFiles = readdirSync(inputDir, {
      recursive: true,
      withFileTypes: true
    });

    const markdownFiles = allFiles
      .filter(dirent =>
        dirent.isFile() &&
        dirent.name.endsWith('.md') &&
        !dirent.parentPath.includes('node_modules')
      )
      .map(dirent => join(dirent.parentPath || dirent.path, dirent.name));

    if (markdownFiles.length === 0) {
      throw new Error(`No markdown files found in ${inputDir}`);
    }

    console.log(`Found ${markdownFiles.length} markdown files`);

    // Process all markdown files
    for (const filePath of markdownFiles) {
      const content = readFileSync(filePath, 'utf-8');
      const doc = await this.processor.processFile(filePath, inputDir, content);
      this.documents.push(doc);
    }

    // Sort documents by path for consistent ordering
    this.documents.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

    // Generate navigation
    const navigation = this.buildNavigation(this.documents);
    const pageSequence = this.buildPageSequence(navigation);

    // Load templates from source directory (not dist)
    // From dist/src/builder, go to project root, then to src/templates
    const templatesDir = resolve(__dirname, '../../../src/templates');
    const layoutTemplate = readFileSync(
      join(templatesDir, 'layout.html'),
      'utf-8'
    );
    const docPageTemplate = readFileSync(
      join(templatesDir, 'doc-page.html'),
      'utf-8'
    );
    const indexTemplate = readFileSync(
      join(templatesDir, 'index.html'),
      'utf-8'
    );

    // Generate HTML pages
    console.log('Generating HTML pages...');

    for (let i = 0; i < this.documents.length; i++) {
      const doc = this.documents[i];
      const isIndex = doc.relativePath === 'README.md' || doc.relativePath === 'index.md';

      // Prepare navigation data
      const adjacent = pageSequence.get(doc.url);

      // Render document content
      const contentTemplate = isIndex ? indexTemplate : docPageTemplate;
      const content = this.templateEngine.renderWithLoops(contentTemplate, {
        html: doc.html,
        metadata: doc.metadata,
        title: doc.metadata.title,
        description: doc.metadata.description,
        pages: isIndex
          ? this.documents.filter(d => d !== doc).map(d => ({
              title: d.metadata.title,
              description: d.metadata.description,
              url: d.url,
            }))
          : undefined,
        prevPage: adjacent?.prev,
        nextPage: adjacent?.next,
      });

      // Render full page with layout
      const html = this.templateEngine.renderWithLoops(layoutTemplate, {
        title: doc.metadata.title || 'Documentation',
        // The template engine doesn't escape interpolated values, so
        // config.description may contain markup (e.g. a hotlink) meant
        // for the visible siteDescription below — strip it here since
        // this one lands inside a <meta content="..."> attribute.
        description: stripHtml(doc.metadata.description || config.description || ''),
        siteTitle: config.title || 'Documentation',
        siteDescription: config.description || '',
        content,
        navigation: this.renderNavigation(navigation, doc.url),
        chatEnabled: config.chat?.enabled,
        searchConfigJson: JSON.stringify({
          topK: config.build?.topK ?? 3,
          minScore: config.build?.minScore ?? 0.5,
        }),
        attribution: config.attribution !== false, // defaults to true
      });

      // Write HTML file
      const outputPath = join(
        outputDir,
        doc.relativePath.replace(/\.md$/, '.html')
      );
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, html, 'utf-8');
    }

    // Copy index.html if README.md exists
    const readmeDoc = this.documents.find(
      (d) => d.relativePath === 'README.md' || d.relativePath === 'index.md'
    );
    if (readmeDoc) {
      const readmePath = join(
        outputDir,
        readmeDoc.relativePath.replace(/\.md$/, '.html')
      );
      const indexPath = join(outputDir, 'index.html');
      if (readmePath !== indexPath) {
        cpSync(readmePath, indexPath);
      }
    }

    console.log(`Generated ${this.documents.length} HTML pages`);

    return this.documents;
  }

  /**
   * Build navigation structure from documents, grouping by top-level
   * folder so e.g. every doc under `path-of-python/` (its README plus
   * anything in `path-of-python/docs/`) nests under one "Path of Python"
   * entry instead of interleaving flat with every other folder's pages.
   * Files at the root (no folder) stay flat, top-level entries.
   */
  private buildNavigation(documents: ProcessedDocument[]): NavigationItem[] {
    const nav: NavigationItem[] = [];
    const groups = new Map<string, NavigationItem>();

    for (const doc of documents) {
      const parts = doc.relativePath.split('/');
      const title = doc.metadata.title || basename(doc.relativePath, '.md');
      const isRootIndex = doc.relativePath === 'README.md' || doc.relativePath === 'index.md';

      if (parts.length === 1) {
        if (!isRootIndex) {
          nav.push({ title, url: doc.url });
        }
        continue;
      }

      const folder = parts[0];
      const restOfPath = parts.slice(1).join('/');
      const isFolderIndex = restOfPath === 'README.md' || restOfPath === 'index.md';

      let group = groups.get(folder);
      if (!group) {
        group = {
          title: folder.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
          url: doc.url,
          children: [],
        };
        groups.set(folder, group);
        nav.push(group);
      }

      if (isFolderIndex) {
        group.url = doc.url;
      } else {
        group.children!.push({ title, url: doc.url });
      }
    }

    return nav;
  }

  /**
   * Render navigation HTML. Folder groups only expand their children when
   * the current page is the group's root or one of its children — every
   * other page sees the group collapsed to a single link that leads to
   * its root README.
   */
  private renderNavigation(items: NavigationItem[], currentUrl?: string): string {
    if (items.length === 0) return '';

    let html = '<ul class="nav-list">';

    for (const item of items) {
      const isActive = item.url === currentUrl;
      const hasChildren = !!item.children && item.children.length > 0;
      const isExpanded =
        hasChildren && (isActive || item.children!.some((child) => child.url === currentUrl));

      const liClasses = [isActive && 'active', hasChildren && 'nav-group']
        .filter(Boolean)
        .join(' ');

      html += `<li${liClasses ? ` class="${liClasses}"` : ''}>`;
      html += `<a href="${item.url}"${isActive ? ' class="active"' : ''}>${item.title}</a>`;

      if (isExpanded) {
        html += this.renderNavigation(item.children!, currentUrl);
      }

      html += '</li>';
    }

    html += '</ul>';

    return html;
  }

  /**
   * Compute prev/next page links that walk the top-level navigation
   * (root README to root README) rather than the flat, alphabetical
   * document list — so paging from a folder's root never dips into that
   * folder's children. Paging from within a group's children walks those
   * siblings first, then rolls into the next top-level entry.
   */
  private buildPageSequence(
    navigation: NavigationItem[]
  ): Map<string, { prev?: { title: string; url: string }; next?: { title: string; url: string } }> {
    const positions = new Map<
      string,
      { prev?: { title: string; url: string }; next?: { title: string; url: string } }
    >();

    const asLink = (item: NavigationItem) => ({ title: item.title, url: item.url });

    for (let i = 0; i < navigation.length; i++) {
      const item = navigation[i];
      const prevTop = i > 0 ? asLink(navigation[i - 1]) : undefined;
      const nextTop = i < navigation.length - 1 ? asLink(navigation[i + 1]) : undefined;

      positions.set(item.url, { prev: prevTop, next: nextTop });

      const children = item.children ?? [];
      for (let j = 0; j < children.length; j++) {
        const prev = j === 0 ? asLink(item) : asLink(children[j - 1]);
        const next = j < children.length - 1 ? asLink(children[j + 1]) : nextTop;
        positions.set(children[j].url, { prev, next });
      }
    }

    return positions;
  }

  /**
   * Get all processed documents
   */
  getDocuments(): ProcessedDocument[] {
    return this.documents;
  }
}
