import MarkdownIt, { type MarkdownIt as MarkdownItInstance } from 'markdown-it';
import anchor from 'markdown-it-anchor';
import toc from 'markdown-it-toc-done-right';
import alerts from 'markdown-it-github-alerts';
import taskLists from 'markdown-it-task-lists';
import footnote from 'markdown-it-footnote';
import { full as emoji } from 'markdown-it-emoji';
import sub from 'markdown-it-sub';
import sup from 'markdown-it-sup';
import { BundledLanguage, bundledLanguages, createHighlighter, Highlighter } from 'shiki';
import { parseFrontMatter } from './front-matter.js';
import { ProcessedDocument, DocumentMetadata } from '../types/document.js';
import { relative, basename, dirname } from 'path';

export class MarkdownProcessor {
  private md: MarkdownItInstance;
  private highlighter: Promise<Highlighter | null> | null = null;

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

  private setupShiki(): Promise<Highlighter | null> {
    this.highlighter ??= this.createShiki();
    return this.highlighter;
  }

  private async createShiki(): Promise<Highlighter | null> {
    try {
      const highlighter = await createHighlighter({
        themes: ['github-light', 'github-dark'],
        langs: [],
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

      return highlighter;
    } catch (error) {
      console.warn('Failed to initialize Shiki, falling back to default code rendering');
      return null;
    }
  }

  // Grammars are loaded on demand: loading every bundled language up front
  // costs tens of seconds, while a docs corpus uses only a handful.
  private async loadFenceLanguages(highlighter: Highlighter, markdown: string): Promise<void> {
    const loaded = highlighter.getLoadedLanguages();
    const langs = new Set(
      this.md
        .parse(markdown, {})
        .filter((token) => token.type === 'fence')
        .map((token) => token.info.trim().split(/\s+/)[0])
        .filter((lang): lang is BundledLanguage => lang in bundledLanguages && !loaded.includes(lang))
    );
    await Promise.all([...langs].map((lang) => highlighter.loadLanguage(lang)));
  }

  /**
   * Process a markdown file and extract front matter
   */
  async processFile(
    filePath: string,
    inputDir: string,
    content: string
  ): Promise<ProcessedDocument> {
    const highlighter = await this.setupShiki();

    // Parse front matter
    const { data: metadata, content: markdownContent } = parseFrontMatter(content);
    if (highlighter) await this.loadFenceLanguages(highlighter, markdownContent);

    // Convert markdown to HTML
    const html = this.md.render(markdownContent);

    // Generate relative path and URL
    const relativePath = relative(inputDir, filePath);
    const url = this.generateUrl(relativePath);

    // Extract title from metadata or first h1
    const title = metadata.title || this.extractTitle(markdownContent, relativePath);
    const description = metadata.description || this.extractDescription(markdownContent);

    return {
      filePath,
      relativePath,
      content: markdownContent,
      html,
      metadata: {
        ...metadata,
        title,
        ...(description ? { description } : {}),
      },
      url,
    };
  }

  /**
   * Derive a search-result description from the first prose paragraph,
   * skipping headings, badges, lists, tables, quotes, HTML and code, and
   * trimming to 160 characters on a word boundary.
   */
  private extractDescription(content: string): string {
    const withoutCodeFences = content.replace(/^```[\s\S]*?^```/gm, '');
    for (const block of withoutCodeFences.split(/\n\s*\n/)) {
      const trimmed = block.trim();
      if (
        !trimmed ||
        /^[#<|>\-*!]/.test(trimmed) ||
        trimmed.startsWith('[![') ||
        /^\d+\./.test(trimmed)
      ) {
        continue;
      }
      const text = trimmed
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*_`]/g, '')
        .replace(/\s+/g, ' ');
      if (text.length < 40) continue;
      if (text.length <= 160) return text;
      return `${text.slice(0, 159).replace(/\s+\S*$/, '').replace(/[\s,;:.-]+$/, '')}…`;
    }
    return '';
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
