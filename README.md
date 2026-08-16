# Botdocs

[![Read about the commits](https://img.shields.io/badge/commits-code%20blog-1a1a1a?style=flat-square)](https://wwel.sh/digest.html?repo=botdocs)

[![npm version](https://img.shields.io/npm/v/botdocs.svg)](https://www.npmjs.com/package/botdocs)

Convert markdown documentation into beautiful static sites with AI-powered semantic search — no backend required.

## Features

- **Markdown to HTML** - Converts `.md` files into polished static sites
- **Semantic Search** - Client-side vector search using Transformers.js
- **Dark Mode** - Built-in theme switching
- **Deep Links** - Search results link directly to sections
- **No Backend** - Everything runs in the browser
- **Fast** - Syntax highlighting with Shiki

## Installation

Install globally via npm:

```bash
npm install -g botdocs
```

## Usage

```bash
# Generate site from markdown
botdocs ./docs

# Disable chatbot
botdocs ./docs --no-chat

# Custom output directory
botdocs ./docs -o ./public

# Verbose logging
botdocs ./docs -v

# Use a specific theme
botdocs ./docs -t material

# Custom config file
botdocs ./docs -c ./my-config.json

# Combine multiple options
botdocs ./docs -o ./public -t slate -v
```

### CLI Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--output <dir>` | `-o` | Output directory for generated site | `output` |
| `--no-chat` | | Disable AI chatbot functionality | `false` |
| `--config <file>` | `-c` | Path to config file | `botdocs.config.json` |
| `--theme <theme>` | `-t` | Theme to use | `classic` |
| `--verbose` | `-v` | Enable verbose logging | `false` |

### Available Themes

- **classic** - Clean, professional theme (default)
- **material** - Material Design theme
- **minimal** - Clean, minimalist theme
- **slate** - Dark slate theme
- **modern** - Modern documentation theme

## Configuration

Create `botdocs.config.json` in your docs directory:

```json
{
  "title": "My Documentation",
  "description": "Project docs",
  "theme": "classic",
  "customCss": "custom.css",
  "attribution": true,
  "chat": { "enabled": true },
  "build": {
    "chunkSize": 500,
    "chunkOverlap": 50,
    "minChunkSize": 15,
    "topK": 3,
    "minScore": 0.75
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | `"Documentation"` | Site title |
| `description` | string | `"Project documentation"` | Site description |
| `theme` | string | `"classic"` | Theme to use (classic, material, minimal, slate, modern) |
| `customCss` | string | none | Path to a CSS file, resolved relative to the config file's directory. Appended after theme CSS in `bundle.css`, so same-specificity selectors override the theme without `!important` |
| `attribution` | boolean | `true` | Show "Built with Botdocs" footer link |
| `chat.enabled` | boolean | `true` | Enable AI chatbot |
| `chat.welcomeMessage` | string | `"Ask me anything about the docs!"` | Chatbot welcome message |
| `build.chunkSize` | number | `500` | Text chunk size for embeddings |
| `build.chunkOverlap` | number | `50` | Overlap between chunks |
| `build.minChunkSize` | number | `15` | Chunks smaller than this (estimated tokens) get folded into a neighboring chunk instead of becoming a standalone, low-signal search result |
| `build.topK` | number | `3` | Number of results to return |
| `build.minScore` | number | `0.75` | Minimum vector similarity (0-1) a result must reach to be returned at all, regardless of `topK` — filters out weak/off-topic matches instead of always padding results. The e5 embedding model has a fairly high similarity floor even for unrelated text, so this needs to sit well above 0.5 to actually gate anything |

## Front Matter

```markdown
---
title: Getting Started
description: Quick start guide
---

# Your content here
```

## How It Works

1. **Build**: Parses markdown → generates embeddings → creates `vector-db.json`
2. **Runtime**: User query → embed → search vector DB → return relevant chunks
3. **No LLM**: Pure semantic search, not AI text generation
4. **Consent**: On first use, visitors are asked before the embedding model downloads to their browser, with a disclosure of what runs locally

## Architecture

- **Embedding Model**: `e5-small-v2` (384-dim vectors, 2.2x faster than all-MiniLM-L6-v2)
- **Search**: Hybrid — vector cosine similarity fused with BM25 keyword scoring (Reciprocal Rank Fusion), gated by a minimum similarity threshold, client-side only
- **Browser Bundle**: ~825KB (includes Transformers.js)
- **Deployment**: Fully static, works on any host

## Development

Building from source:

```bash
git clone https://github.com/usr-wwelsh/botdocs.git
cd botdocs
npm install
npm run build && npm run build:client
botdocs ./test-docs
```

## License

MIT © [usr-wwelsh](https://github.com/usr-wwelsh)
