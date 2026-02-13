import { glob } from 'glob';
import { readFileSync, writeFileSync } from 'fs';
import fs from 'fs-extra';
import { join, dirname, relative, resolve } from 'path';
import { MarkdownProcessor } from './markdown-processor.js';
import { TemplateEngine } from './template-engine.js';
import { ProcessedDocument, NavigationItem } from '../types/document.js';
import { BotdocsConfig } from '../types/config.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

    // Find all markdown files
    const markdownFiles = await glob('**/*.md', {
      cwd: inputDir,
      absolute: true,
      ignore: ['node_modules/**', '**/node_modules/**'],
    });

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
      const prevDoc = i > 0 ? this.documents[i - 1] : null;
      const nextDoc = i < this.documents.length - 1 ? this.documents[i + 1] : null;

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
        prevPage: prevDoc
          ? {
              title: prevDoc.metadata.title,
              url: prevDoc.url,
            }
          : undefined,
        nextPage: nextDoc
          ? {
              title: nextDoc.metadata.title,
              url: nextDoc.url,
            }
          : undefined,
      });

      // Render full page with layout
      const html = this.templateEngine.renderWithLoops(layoutTemplate, {
        title: doc.metadata.title || 'Documentation',
        description: doc.metadata.description || config.description || '',
        siteTitle: config.title || 'Documentation',
        siteDescription: config.description || '',
        content,
        navigation: this.renderNavigation(navigation, doc.url),
        chatEnabled: config.chat?.enabled,
      });

      // Write HTML file
      const outputPath = join(
        outputDir,
        doc.relativePath.replace(/\.md$/, '.html')
      );
      fs.ensureDirSync(dirname(outputPath));
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
        fs.copySync(readmePath, indexPath);
      }
    }

    console.log(`Generated ${this.documents.length} HTML pages`);

    return this.documents;
  }

  /**
   * Build navigation structure from documents
   */
  private buildNavigation(documents: ProcessedDocument[]): NavigationItem[] {
    const nav: NavigationItem[] = [];

    for (const doc of documents) {
      const parts = doc.relativePath.split('/');
      const title = doc.metadata.title || parts[parts.length - 1].replace(/\.md$/, '');

      nav.push({
        title,
        url: doc.url,
      });
    }

    return nav;
  }

  /**
   * Render navigation HTML
   */
  private renderNavigation(items: NavigationItem[], currentUrl?: string): string {
    if (items.length === 0) return '';

    let html = '<ul class="nav-list">';

    for (const item of items) {
      const isActive = item.url === currentUrl;
      const activeClass = isActive ? ' class="active"' : '';

      html += `<li${activeClass}>`;
      html += `<a href="${item.url}"${activeClass}>${item.title}</a>`;

      if (item.children && item.children.length > 0) {
        html += this.renderNavigation(item.children, currentUrl);
      }

      html += '</li>';
    }

    html += '</ul>';

    return html;
  }

  /**
   * Get all processed documents
   */
  getDocuments(): ProcessedDocument[] {
    return this.documents;
  }
}
