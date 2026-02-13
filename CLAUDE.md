# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Botdocs is an npm CLI tool that converts markdown documentation into static websites with optional client-side semantic search chatbots. The chatbot uses vector embeddings and cosine similarity search with Transformers.js running entirely in the browser.

## Development Commands

### Building
```bash
# Build TypeScript (CLI and builder code)
npm run build

# Build client-side code (browser bundle)
npm run build:client

# Watch mode for development
npm run dev
```

### Testing Locally
```bash
# Link package globally for testing
npm link

# Run the CLI
botdocs ./test-docs

# Run with verbose output for debugging
botdocs ./test-docs -v

# Disable chatbot
botdocs ./test-docs --no-chat
```

### Publishing
```bash
# Prepublish hook automatically runs npm run build
npm publish
```

## Architecture

### Dual Build System

The project has **two separate build configurations** that must both be executed:

1. **Server/CLI Build** (`npm run build`):
   - Uses TypeScript compiler (tsc)
   - Config: `tsconfig.json`
   - Input: `src/` (excludes `src/client/`)
   - Output: `dist/`
   - Builds Node.js CLI and builder code

2. **Client Build** (`npm run build:client`):
   - Uses Vite bundler
   - Config: `tsconfig.client.json` + `vite.config.ts`
   - Input: `src/client/`
   - Output: `dist-client/`
   - Creates browser-ready `bundle.js` with Transformers.js

### Code Organization

```
src/
├── cli/           # CLI entry point (Commander.js)
├── builder/       # Build pipeline (runs at build-time)
│   ├── index.ts              # Build orchestrator
│   ├── markdown-processor.ts # Parses markdown → HTML
│   ├── chunker.ts            # Splits docs into chunks
│   ├── embedder.ts           # Generates embeddings (build-time)
│   ├── vector-db-builder.ts  # Creates vector-db.json
│   ├── site-generator.ts     # Generates HTML pages
│   └── template-engine.ts    # HTML templating
├── client/        # Browser code (runs at runtime)
│   ├── main.ts               # Entry point
│   ├── navigation.ts         # Site navigation
│   ├── theme/                # Dark mode, etc.
│   └── chat/                 # Semantic search chatbot
│       ├── embedder.ts       # Client-side query embeddings
│       ├── vector-search.ts  # Cosine similarity search
│       ├── rag-engine.ts     # Search orchestration and result formatting
│       └── chatbox.ts        # UI component
├── types/         # TypeScript type definitions
├── templates/     # HTML templates
└── styles/        # CSS files (bundled at build time)
```

### Build Pipeline (4 Phases)

When a user runs `botdocs ./docs`, the build process executes:

1. **Scan & Parse**: `markdown-processor.ts` finds `.md` files, parses front matter, converts to HTML with markdown-it
2. **Chunk & Embed**: `chunker.ts` splits by headings, `embedder.ts` generates 384-dim embeddings, `vector-db-builder.ts` creates `vector-db.json`
3. **Generate Site**: `site-generator.ts` applies templates, builds navigation, writes HTML files
4. **Bundle Assets**: Copies `dist-client/bundle.js` and CSS to `output/assets/`

### Client-side Search Flow

When a user opens the generated site and uses the chatbot:

1. Initialization: `embedder.ts` loads e5-small-v2 embedding model via Transformers.js (cached after first load)
2. User asks question → `embedder.ts` embeds query into 384-dim vector
3. `vector-search.ts` searches `vector-db.json` via cosine similarity → retrieves top K most relevant chunks
4. `rag-engine.ts` formats results into a conversational response → `chatbox.ts` displays with citations

**Note**: The system uses semantic search only - no text generation. Results are presented in a natural format but are direct excerpts from the documentation.

### Key Architectural Decisions

- **ES Modules**: Package uses `"type": "module"` - all imports require `.js` extensions even for `.ts` files
- **Path Resolution**: Builder code uses `fileURLToPath(import.meta.url)` and `resolve(__dirname, '../../..')` to navigate from `dist/` back to project root
- **No Backend**: Generated sites are fully static - vector DB and embedding model run in browser
- **Semantic Search Only**: No LLM text generation - the chatbot retrieves and formats relevant documentation chunks
- **Build-time vs Runtime**: Embeddings generated twice - once at build time (Node.js, for all chunks), once at runtime (browser, for user queries only)
- **Two tsconfigs**: `tsconfig.json` for Node.js (no DOM), `tsconfig.client.json` for browser (DOM, no emit)

### Configuration

Users can create `botdocs.config.json` in their docs directory:
```json
{
  "title": "My Documentation",
  "chat": { "enabled": true },
  "build": { "chunkSize": 500, "chunkOverlap": 50, "topK": 5 }
}
```

CLI options (`--no-chat`, `-v`, `-o`) override config file settings.

## Common Development Workflows

### Adding a New CLI Option
1. Update `src/cli/options.ts` with new option type
2. Add option to Commander program in `src/cli/index.ts`
3. Pass through to `build()` in `src/builder/index.ts`
4. Update `BuildOptions` type in `src/types/config.ts`

### Modifying the Build Pipeline
1. Edit relevant builder in `src/builder/` (markdown-processor, chunker, embedder, etc.)
2. Run `npm run build` to recompile
3. Test with `botdocs ./test-docs -v` to see verbose output
4. Check generated files in `output/`

### Updating Client Code (Chatbot, UI, etc.)
1. Edit files in `src/client/`
2. Run `npm run build:client` to rebuild browser bundle
3. Run full build: `botdocs ./test-docs`
4. Open `output/index.html` in browser to test

### Debugging Build Issues
- Use `-v` flag for verbose logging
- Check that both builds succeeded: `ls dist/` and `ls dist-client/`
- Inspect generated `output/vector-db.json` to verify embeddings
- Use browser DevTools to debug client-side code (sourcemaps enabled)

## Dependencies

### Build-time (Node.js)
- `@xenova/transformers`: Embedding generation during build
- `markdown-it` + plugins: Markdown parsing, syntax highlighting (Shiki)
- `gray-matter`: Front matter parsing
- `commander`: CLI argument parsing
- `fs-extra`, `glob`: File operations

### Client-side (Browser)
- Transformers.js: Loads e5-small-v2 embedding model (384-dim, 2.2x faster than all-MiniLM-L6-v2)
- Bundled into single `bundle.js` via Vite

Note: `@mlc-ai/web-llm` is listed in dependencies but may not be actively used - check `model-loader.ts` for current implementation.
