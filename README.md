# Botdocs

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
```

## Configuration

Create `botdocs.config.json` in your docs directory:

```json
{
  "title": "My Documentation",
  "description": "Project docs",
  "chat": { "enabled": true },
  "build": {
    "chunkSize": 500,
    "chunkOverlap": 50,
    "topK": 5
  }
}
```

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

## Architecture

- **Embedding Model**: `e5-small-v2` (384-dim vectors, 2.2x faster than all-MiniLM-L6-v2)
- **Search**: Cosine similarity, client-side only
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
