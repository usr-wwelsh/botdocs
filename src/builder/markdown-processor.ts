import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import toc from 'markdown-it-toc-done-right';
import alerts from 'markdown-it-github-alerts';
import taskLists from 'markdown-it-task-lists';
import footnote from 'markdown-it-footnote';
import { full as emoji } from 'markdown-it-emoji';
import sub from 'markdown-it-sub';
import sup from 'markdown-it-sup';
import { fromHighlighter } from '@shikijs/markdown-it/core';
import { bundledLanguages, getHighlighter } from 'shiki';
import matter from 'gray-matter';
import { ProcessedDocument, DocumentMetadata } from '../types/document.js';
import { relative, basename, dirname } from 'path';

export class MarkdownProcessor {
  private md: MarkdownIt;
  private shikiInitialized: boolean = false;

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: false,
      highlight: (code, lang, attrs) => {
        // Fallback for when Shiki isn't initialized or lang not found
        if (!lang) {
          return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
        }
        return `<pre><code class="language-${lang}">${this.escapeHtml(code)}</code></pre>`;
      },
    })
      // Enable strikethrough (built-in feature)
      .enable('strikethrough');

    // Add anchor plugin for heading links
    this.md.use(anchor, {
      permalink: anchor.permalink.linkInsideHeader({
        symbol: '#',
        placement: 'before',
      }),
    });

    // Add table of contents plugin
    this.md.use(toc, {
      containerClass: 'toc',
      listType: 'ul',
    });

    // Add GitHub alerts plugin for [!NOTE], [!WARNING], etc.
    this.md.use(alerts);

    // Add task lists plugin for - [ ] and - [x]
    this.md.use(taskLists, {
      enabled: true,
      label: true,
      labelAfter: true,
    });

    // Add footnotes plugin for [^1] style references
    this.md.use(footnote);

    // Add emoji shortcuts plugin for :smile: → 😄
    this.md.use(emoji);

    // Add subscript and superscript support
    this.md.use(sub);
    this.md.use(sup);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'");
  }

  private async setupShiki() {
    if (this.shikiInitialized) return;

    try {
      const highlighter = await getHighlighter({
        themes: ['github-light', 'github-dark'],
        langs: Object.keys(bundledLanguages),
      });

      // Override markdown-it highlight with Shiki, but with error handling
      const originalHighlight = this.md.options.highlight!;
      this.md.options.highlight = (code, lang, attrs) => {
        try {
          if (!lang) return originalHighlight(code, lang, attrs);

          // Try to get the language, fall back to txt if not found
          const languages = highlighter.getLoadedLanguages();
          const safeLang = languages.includes(lang) ? lang : 'txt';

          return highlighter.codeToHtml(code, {
            lang: safeLang,
            themes: {
              light: 'github-light',
              dark: 'github-dark',
            },
          });
        } catch (error) {
          // Fall back to default highlighting if Shiki fails
          return originalHighlight(code, lang, attrs);
        }
      };

      this.shikiInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize Shiki, falling back to default code rendering');
    }
  }

  /**
   * Process a markdown file and extract front matter
   */
  async processFile(
    filePath: string,
    inputDir: string,
    content: string
  ): Promise<ProcessedDocument> {
    // Ensure Shiki is initialized
    await this.setupShiki();

    // Parse front matter
    const { data: metadata, content: markdownContent } = matter(content);

    // Convert markdown to HTML
    const html = this.md.render(markdownContent);

    // Generate relative path and URL
    const relativePath = relative(inputDir, filePath);
    const url = this.generateUrl(relativePath);

    // Extract title from metadata or first h1
    const title = metadata.title || this.extractTitle(markdownContent, relativePath);

    return {
      filePath,
      relativePath,
      content: markdownContent,
      html,
      metadata: {
        ...metadata,
        title,
      },
      url,
    };
  }

  /**
   * Extract title from markdown content (first h1) or filename.
   *
   * Checks, in order: a markdown `# ` heading, an HTML `<h1>` tag (common
   * when the heading wraps a logo image), and a lone banner image's alt
   * text (READMEs that open with `![Project Name](banner.svg)` instead of
   * a text heading). All matching skips fenced code blocks so shell
   * comments like `# Start the server:` aren't mistaken for headings.
   */
  private extractTitle(content: string, relativePath: string): string {
    const withoutCodeFences = content.replace(/^```[\s\S]*?^```/gm, '');

    const h1Match = withoutCodeFences.match(/^#\s+(.+)$/m);
    if (h1Match) {
      return h1Match[1].trim();
    }

    const htmlH1Match = withoutCodeFences.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (htmlH1Match) {
      const text = this.decodeHtmlEntities(htmlH1Match[1].replace(/<[^>]+>/g, ''))
        .replace(/\s+/g, ' ')
        .trim();
      if (text) {
        return text;
      }
    }

    const bannerImageMatch = withoutCodeFences.match(/^!\[([^\]]+)\]\([^)]*\)\s*$/m);
    if (bannerImageMatch) {
      return bannerImageMatch[1].trim();
    }

    // Fallback to filename, or the parent directory name for README/index
    // files where the filename itself carries no useful title.
    const base = basename(relativePath, '.md');
    const parentDir = basename(dirname(relativePath));
    const name = /^(readme|index)$/i.test(base) && parentDir !== '.' ? parentDir : base;

    return name
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Generate URL from relative file path
   * e.g., "getting-started.md" -> "/getting-started.html"
   * e.g., "api/overview.md" -> "/api/overview.html"
   */
  private generateUrl(relativePath: string): string {
    const url = relativePath
      .replace(/\.md$/, '.html')
      .replace(/\\/g, '/');

    return url === 'index.html' ? '/' : `/${url}`;
  }

  /**
   * Render markdown string to HTML
   */
  render(markdown: string): string {
    return this.md.render(markdown);
  }
}
