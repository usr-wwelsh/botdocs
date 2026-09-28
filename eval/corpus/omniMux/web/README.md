# omniMux — web

SvelteKit 5 + TypeScript PWA frontend for [omniMux](../README.md). Talks to the FastAPI backend in `../api` and to Navidrome's Subsonic API for playback.

## Structure

```
src/
├── routes/       # pages (search, library, artist, album, playlists, browse)
├── components/   # Player, MiniPlayer, AlbumCard, TrackList, …
└── lib/          # subsonic.ts, api.ts, player store
```

## Developing

```sh
npm install
npm run dev -- --open
```

## Building

```sh
npm run build
npm run preview   # preview the production build
```

## Checks

```sh
npm run check   # svelte-check
npm run lint    # eslint
npm test        # vitest
```

See the root [README](../README.md) for running the full stack via Docker Compose.
