---
name: botdocs-config
description: Configure a botdocs site — botdocs.config.json fields, CLI flags, picking or customizing one of the five bundled themes (classic, material, minimal, modern, slate). Use when the user wants to set up, tweak, or theme a botdocs-generated docs site, or asks "how do I configure botdocs" / "how do I change the theme".
---

# botdocs-config

`botdocs` (this repo) turns a directory of markdown into a static site with an
optional in-browser semantic-search chatbot. This skill covers the two things
people configure: `botdocs.config.json` and the theme CSS.

## Config file

Put `botdocs.config.json` in the docs directory being built (or point `-c` at
it). Every field is optional — `defaultConfig` in `src/types/config.ts` fills
the rest in.

```json
{
  "title": "My Documentation",
  "description": "Project documentation",
  "theme": "classic",
  "customCss": "custom.css",
  "attribution": true,
  "chat": {
    "enabled": true,
    "welcomeMessage": "Ask me anything about the docs!"
  },
  "build": {
    "chunkSize": 500,
    "chunkOverlap": 50,
    "topK": 3
  }
}
```

- `theme` — one of `classic | material | minimal | slate | modern` (see below).
- `customCss` — path to a CSS file, resolved relative to the directory the
  config file lives in (not `inputDir`, which is often a regenerated staging
  dir). Its contents are appended after the theme CSS in `bundle.css`
  (`src/builder/index.ts`), so same-specificity selectors (e.g. `.site-title`,
  `:root` variables) override the theme without `!important`.
- `attribution` — shows/hides the "Built with Botdocs" footer link.
- `chat.enabled` — turns the chatbot widget on/off for the build.
- `build.chunkSize` / `chunkOverlap` — how markdown is split before embedding
  (`src/builder/chunker.ts`). Bigger chunks = more context per search result,
  fewer distinct hits.
- `build.topK` — how many chunks the client-side search returns per query.

Per-page overrides: front matter `title` in a `.md` file wins over the
auto-detected first-`h1` title (`src/builder/markdown-processor.ts`).

## CLI flags

```bash
botdocs <input> [options]
  -o, --output <dir>     output dir (default: output)
  -c, --config <file>    path to botdocs.config.json
  -t, --theme <theme>    classic|material|minimal|slate|modern (default: classic)
  --no-chat              disable the chatbot for this build
  -v, --verbose          log the resolved config and build steps
```

CLI flags override the config file (`src/builder/index.ts`, `loadConfig` +
the override block right after it) — `-t modern` wins even if
`botdocs.config.json` says `"theme": "classic"`.

## Themes — how they actually work

**Each theme file in `src/styles/themes/*.css` is a full, standalone
stylesheet** — layout, sidebar, typography, everything — not a thin palette
override on top of a shared base. `src/styles/main.css` looks like it should
be that shared base but it is dead: `site-generator.ts` never includes it in
the bundle. Don't edit `main.css` expecting it to show up in generated sites —
it won't. The real bundle is always:

```
themes.css (dark-mode variable overrides, theme-agnostic)
  + chat.css (chat widget, footer banner — theme-agnostic, always shipped)
  + themes/<selected>.css (the full theme)
```

(`src/builder/site-generator.ts`, `cssFiles` + the theme-copy block right
after it.)

So:
- **Anything that must render regardless of theme** (chat widget, footer
  disclosure banner, etc.) belongs in `chat.css` or `themes.css`, not
  `main.css`.
- **Theme-specific look** (colors, spacing, sidebar style) lives in that
  theme's own file under its own `:root` block:
  ```css
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --bg-tertiary: #e9ecef;
    --text-primary: #212529;
    --text-secondary: #6c757d;
    --border-color: #dee2e6;
    --link-color: #3b82f6;
    --link-hover: #2563eb;
    --code-bg: #f8f9fa;
    --sidebar-width: 280px;
    --content-max-width: 800px;
  }
  ```
  Changing a theme's palette means editing these variables in *that* theme's
  file. There is no cross-theme variable-override mechanism today — a new
  theme is a new full CSS file, and a palette tweak to one theme doesn't
  touch the other four.
- Dark mode is `themes.css`'s `[data-theme='dark'] { --bg-primary: ...; }` —
  same variable names, dark values, applied on top of whichever theme is
  selected. If you add a new CSS variable to a theme's `:root`, also add its
  dark counterpart in `themes.css` or it'll stay light-mode-colored at night.

### The five themes

| Theme | Character |
|---|---|
| `classic` (default) | Clean, corporate, professional |
| `material` | Colorful, card-based, Material Design inspired |
| `minimal` | Centered, no sidebar, academic paper/essay style |
| `modern` | Gradient accents, bold typography (VitePress/Docusaurus inspired) |
| `slate` | Dark sidebar, code-focused, API documentation style |

## Workflow for a theming change

1. Edit the target file(s) — `src/styles/themes/<theme>.css` for a
   theme-specific look, `chat.css`/`themes.css` for something that must
   apply everywhere.
2. `npm run build` (server/CLI) and, if client code changed, `npm run
   build:client`.
3. `botdocs <input> -o <output> -t <theme> -v` to regenerate a real site.
4. Check `<output>/assets/css/bundle.css` directly if unsure whether a rule
   actually shipped — `grep` for the selector. This is the fastest way to
   catch the "I edited a dead file" mistake described above.

## Don't

- Don't add config fields without updating both `BotdocsConfig` and
  `defaultConfig` in `src/types/config.ts` — the builder reads through that
  type, and an undocumented field silently does nothing.
- Don't assume a CSS edit shipped because it compiles — verify against the
  generated `bundle.css`, since `main.css` compiling cleanly told nobody it
  was unused.
- Don't invent a sixth theme name in config/CLI without adding the matching
  `src/styles/themes/<name>.css` file — `site-generator.ts` falls back to
  `classic` silently if the file doesn't exist.
