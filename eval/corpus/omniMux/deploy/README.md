# Auto-update (opt-in)

omniMux's web UI can show an "update available" banner with a one-line
changelog, and a button that pulls + rebuilds on your host. Running the
install step below is itself the opt-in — there's no second switch to flip
afterward. Skip it and nothing about your deployment changes.

## Why a separate host service

Applying an update means running `git pull` and `docker compose up -d
--build` on the host. The `omnimux-api` container can't do that itself
without either mounting `/var/run/docker.sock` into it (root-equivalent
access to your whole host from a container that also parses YouTube search
results) or a docker-socket-proxy sidecar. Instead, `omnimux_updater.py` runs
directly on the host as its own systemd service, and the api container talks
to it over a Unix socket that can only do two things: report the changelog,
and trigger an update. No docker API access, no host shell, ever reaches the
container.

## Install

```bash
sudo ./deploy/install.sh
docker compose up -d
```

That generates a token, writes `/etc/omnimux/updater.env` and
`/etc/systemd/system/omnimux-updater.service`, sets `UPDATER_TOKEN` in the
repo's `.env` (creating it from `.env.example` first if you don't have one
yet — everything else already in `.env`, like `JWT_SECRET`, is left alone),
and starts the service. `docker-compose.yml` itself is never edited, by the
script or by you — see below.

Re-running `install.sh` is safe — it reuses the existing token instead of
generating a new one.

### Manual install

If you'd rather not run a script as root, do the same things by hand: copy
`deploy/omnimux-updater.service` to `/etc/systemd/system/`, copy
`deploy/updater.env.example` to `/etc/omnimux/updater.env` (mode 600) and
fill in `OMNIMUX_REPO_DIR` / a token from `openssl rand -hex 32`, edit
`User=` / `WorkingDirectory=` / `ExecStart=` in the unit file to match your
checkout, then set that same token as `UPDATER_TOKEN` in the repo's `.env`
(copy `.env.example` first if you don't have one). Finish with `sudo
systemctl daemon-reload && sudo systemctl enable --now omnimux-updater`.

## Why `.env` instead of editing `docker-compose.yml`

`JWT_SECRET` and `UPDATER_TOKEN` are read from `.env` (gitignored, Compose
loads it automatically) rather than hardcoded in `docker-compose.yml`. If you
edit secrets directly into the tracked file instead, a future `git pull` —
including one the updater runs for you — has to reconcile your local changes
to that file with upstream's, which is exactly the kind of thing that turns
"click update" into a merge conflict. Keeping the tracked file identical to
upstream and putting everything host-specific in `.env` means `git pull`
never has anything of yours to conflict with.

## Updating the updater itself

`omnimux_updater.py` runs as a plain systemd service on the host, outside
docker compose, so it isn't restarted by the update it triggers. If a future
release changes this file, `sudo systemctl restart omnimux-updater` after
pulling picks up the change.

## Uninstall

```bash
sudo systemctl disable --now omnimux-updater
sudo rm /etc/systemd/system/omnimux-updater.service /etc/omnimux/updater.env
sudo systemctl daemon-reload
```

Optionally clear `UPDATER_TOKEN=` back out of `.env`. Either way the web UI
falls back to hiding the update banner entirely once the socket is gone.
