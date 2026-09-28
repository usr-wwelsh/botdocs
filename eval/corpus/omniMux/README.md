[View on GitHub](https://github.com/usr-wwelsh/omniMux)

<div align="center"><img src="banner.svg" width="860" alt="omniMux banner" /></div>

# omniMux

[![omnimux status](https://vitals.wwel.sh/badge/proxmox/omnimux/status.svg)](https://github.com/usr-wwelsh/vitalSVG) [![omnimux cpu](https://vitals.wwel.sh/badge/proxmox/omnimux/cpu.svg)](https://github.com/usr-wwelsh/vitalSVG) [![omnimux ram](https://vitals.wwel.sh/badge/proxmox/omnimux/ram.svg)](https://github.com/usr-wwelsh/vitalSVG) [![omnimux uptime](https://vitals.wwel.sh/badge/proxmox/omnimux/uptime.svg)](https://github.com/usr-wwelsh/vitalSVG)
[![omnimux cpu trend](https://vitals.wwel.sh/badge/proxmox/omnimux/sparkline.svg?metric=cpu)](https://github.com/usr-wwelsh/vitalSVG) [![omnimux ram trend](https://vitals.wwel.sh/badge/proxmox/omnimux/sparkline.svg?metric=ram)](https://github.com/usr-wwelsh/vitalSVG)

A self-hosted music server that lets you search YouTube, cache tracks to your library, and stream everything through a Spotify-like PWA. Built on top of [Navidrome](https://www.navidrome.org/) with a FastAPI middleware layer and a SvelteKit frontend.

> **Your music. Your server. No middlemen.**

**[Live demo → omnimux.wwel.sh](https://omnimux.wwel.sh)** (guest access, read-only library)

![omniMux demo](demo.gif)

## Table of contents

- [Why omniMux?](#why-omnimux)
- [Features](#features)
- [Stack](#stack)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [FAQ](#faq)
- [Project structure](#project-structure)
- [License](#license)

## Why omniMux?

Streaming services rent you access to music you'll never own, lock your library behind monthly fees, and vanish the moment licensing deals fall through. omniMux flips that: search YouTube, keep the files on your own hardware, and stream them from anywhere over a PWA you install once. No cloud. No subscription. No gatekeepers. Just your music, on your server.

## Features

<table>
<tr>
<td width="33%" valign="top">

### 🎧 AutoDJ
Beat-locked crossfades, tempo matching, and realistic pitch/speed slop — plus 10+ music visualizers driven by high-res iTunes album art.

</td>
<td width="33%" valign="top">

### 🔎 YouTube Search
Find any track and cache it locally. Topic channel results rank first for clean, official-quality audio.

</td>
<td width="33%" valign="top">

### 💿 Album Detection
Open any album and see missing tracks found on YouTube — one-click import fills the gaps.

</td>
</tr>
<tr>
<td valign="top">

### 🎤 Artist Pages
Browse an artist's local albums alongside their full YouTube discography in one unified view.

</td>
<td valign="top">

### 📋 Playlist Import
Paste a YouTube playlist URL — omniMux queues all tracks and builds a matching Navidrome playlist automatically.

</td>
<td valign="top">

### 🧠 Mood Analysis
Every download is analysed for mood, BPM, energy, and key via [mood-detector](https://github.com/usr-wwelsh/mood-detector).

</td>
</tr>
<tr>
<td valign="top">

### 📱 PWA
Installable on desktop and mobile with a responsive mobile mini-player. Works offline once tracks are cached.

</td>
<td valign="top">

### ⚡ Instant Search
Server-side cache (1 h for tracks, 2 h for albums) makes repeated YouTube searches feel instant.

</td>
<td valign="top">

### 🔁 Shuffle & Loop
Shuffle the queue, loop all, or loop one — the basics, done right.

</td>
</tr>
</table>

## Stack

| Layer | Tech |
|---|---|
| Music server | Navidrome (Subsonic API) |
| API | Python · FastAPI · yt-dlp · ytmusicapi · mutagen |
| Frontend | SvelteKit 5 · TypeScript |
| Audio analysis | mood-detector |
| Infrastructure | Docker Compose |

## Quick start

<div style="border-left: 4px solid #1982C4; padding: 12px 16px; margin: 16px 0; background: #0d1117;">

**Prerequisites:** Docker and Docker Compose.

```bash
git clone https://github.com/usr-wwelsh/omnimux.git
cd omniMux
```

Copy `.env.example` to `.env` and set a real value for `JWT_SECRET`:

```bash
cp .env.example .env
openssl rand -hex 32   # copy the output into JWT_SECRET below
nano .env
docker compose up -d --build
```

| Service | URL |
|---|---|
| Web app | http://localhost:8801 |
| API | http://localhost:8800 |
| Navidrome | http://localhost:4533 |

On first run, open Navidrome at `:4533`, create an admin account, then log into the omniMux web app with those same credentials.

**Optional — auto-update:** the web UI can show a changelog banner with a one-click update button once you opt in:

```bash
sudo ./deploy/install.sh
docker compose up -d
```

See [`deploy/README.md`](deploy/README.md) for what that installs and why.

</div>

<details id="configuration">
<summary><strong>Configuration</strong></summary>

Most configuration is fixed in `docker-compose.yml`. Secrets are the
exception — they're read from `.env` (copy from `.env.example`, gitignored)
so a `git pull` never conflicts with values you've set locally:

| Variable | Where | Default | Description |
|---|---|---|---|
| `NAVIDROME_URL` | `docker-compose.yml` | `http://navidrome:4533` | Internal URL of the Navidrome service |
| `MUSIC_DIR` | `docker-compose.yml` | `/music` | Where downloaded audio files are stored |
| `DATA_DIR` | `docker-compose.yml` | `/data` | Where the SQLite database is stored |
| `JWT_SECRET` | `.env` | `change-me-in-production` | Secret used to sign auth tokens — **change this** |
| `UPDATER_TOKEN` | `.env` | *(blank)* | Auth for the opt-in auto-update helper (see Quick start above) — set for you by `deploy/install.sh` |

</details>

## FAQ

**Why the heck an AutoDJ?**
Real DJs are great — but who doesn't want a personal robot DJ running on their own hardware? AutoDJ analyses every track for BPM, key, mood, and energy using deterministic DSP (no AI, no cloud), then crossfades between them with beat-locked transitions. It's just math, and it slaps.

**Why YouTube?**
It's the largest music catalogue on the planet and the only one without a paywall. Topic channels are officially uploaded by labels and provide near-CD-quality audio for most releases.

**Can I use my existing music library?**
Yes — drop your files into the `MUSIC_DIR` volume and Navidrome will scan them. omniMux treats YouTube as an *augmentation* to your library, not a replacement.

**Does it work on iOS?**
Yes, via the PWA. Safari → Share → Add to Home Screen. Requires HTTPS, so expose it through a reverse proxy or a Cloudflare Tunnel.

**Why not just use Spotify?**
Because you don't own anything on Spotify. The day they drop a track, raise prices, or go under, your library is gone. omniMux tracks live as files on your disk.

<details id="project-structure">
<summary><strong>Project structure</strong></summary>

```
music-server/
├── api/                  # FastAPI backend
│   ├── routers/          # auth, search, download endpoints
│   ├── services/         # youtube, navidrome, download worker, cache
│   └── db/               # SQLAlchemy models + async SQLite
├── web/                  # SvelteKit PWA
│   └── src/
│       ├── routes/       # pages (search, library, artist, album, playlists, browse)
│       ├── components/   # Player, MiniPlayer, AlbumCard, TrackList, …
│       └── lib/          # subsonic.ts, api.ts, player store
└── docker-compose.yml
```

</details>

## License

[MIT](LICENSE) © usr-wwelsh
