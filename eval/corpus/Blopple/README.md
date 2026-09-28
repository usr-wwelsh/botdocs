[View on GitHub](https://github.com/usr-wwelsh/Blopple)

<img src="assets/logo/blopple.svg" alt="Blopple" width="96">

# Blopple

A no-code, browser-based Doom-style map/enemy/music editor that exports standalone playable web games small enough for itch.io. Maps are grid-based with three discrete height steps rather than free-form sectors, keeping both the editor and the exported runtime simple; the editor targets ~10MB and every exported game targets ~1MB. It's a `bun` workspace monorepo: `packages/editor` (Vite + Svelte 5 + three.js) is the tool you build games in, `packages/runtime` (vanilla TypeScript, hand-rolled Canvas2D raycaster) is the engine that ships inside exported games, and `packages/shared` holds the map/enemy/weapon/music schemas both packages read from.

## Progress

- **Map editor** — paint walls/floors/ceilings/doors, three height levels, brush sizes, zoom/pan, live three.js 3D preview, in-editor playtest, JSON export/import, standalone HTML export (bundles map + runtime into one playable `.html`).
- **Textures** — pixel-art tool for authoring wall/floor textures.
- **Music/SFX** — tracker-style song editor, synth/instrument controls, one-shot SFX editor.
- **Keys/doors + exit** — 4 colored keys, matching locked doors, and an exit trigger to complete a map.
- **Weapons** — weapon editor (behavior template, damage/fire-rate/range stats, idle/fire sprite refs into the texture editor, fire sfx), map pickups, player equip/switch (1-4 keys) and cooldown-gated firing with real SFX and a viewmodel.
- **Enemies** — enemy editor (chase/stationary/ranged AI behavior templates, health/damage/speed/attack-range/detection-range stats, billboard sprite ref into the texture editor), live per-instance runtime state, chase/kite AI with line-of-sight gating, and weapons' melee/hitscan/projectile behaviors resolve real hits against them. Death/respawn flow with input-locked respawn.

## Known limitations (deliberately deferred, not bugs)

- **Height is a single-value heightfield per cell** (0/1/2). It can't represent a second story you walk *under* — that needs multiple floor/ceiling spans per cell plus a portal/sector-based renderer instead of the current single-hit-per-column raycaster.
- **No windows in walls** — the runtime raycaster stops at the first wall hit per ray, so seeing through a window requires the ray to continue past it and composite. Not started.
- **Single map only** — no concept of chaining multiple maps into one game yet; exported games are one standalone map. Future multilevel compatibility would need the schema and export pipeline to handle map transitions.
