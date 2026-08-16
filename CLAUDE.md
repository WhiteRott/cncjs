# CNCjs Fork — Project Context

## Repo
- Fork of https://github.com/cncjs/cncjs, forked to https://github.com/WhiteRott/cncjs
- Cloned locally at `~/cncjs-fork` on this machine (RGS — Fedora, X870/Ryzen 9900X)
- Remotes: `origin` = your fork, `upstream` = original cncjs/cncjs project

## Environment (already set up, don't redo this)
- **Node**: v22.23.2 (installed via nvm from nodejs.org), managed via `nvm`, set as default
  (`nvm alias default 22`). Node 16 (previously used) has been fully removed — no fallback
  version installed.
- **Yarn**: v3.3.1, installed via `npm install -g yarn` **under nvm's Node 22**
  (NOT the system `yarnpkg`/`yarn` from dnf).
  - IMPORTANT: Fedora's system yarn (`/usr/bin/yarn`) has shebang `#!/usr/bin/node`, which
    resolves to `/usr/bin/node-22` — but that's Fedora's OWN separate rpm package
    (`nodejs22-*.fc44`), NOT nvm's Node 22, despite the matching major version. This caused a
    multi-hour debugging session (backend hanging, wrong Node version in child processes) back
    when running Node 16, and reappeared identically when moving to Node 22 for the same
    reason — nvm's `npm install -g yarn` has to be redone for each new Node major version, since
    nvm's global installs aren't shared across versions. Fixed by installing yarn through
    npm/nvm under Node 22, so `which yarn` now resolves inside
    `~/.nvm/versions/node/v22.23.2/bin/yarn`. If yarn ever starts resolving to `/usr/bin/yarn`
    again (e.g. after installing a new Node version via nvm), redo: `npm install -g yarn` (with
    that new version active) and verify with `which yarn`.
  - Also fixed: nvm's own auto-use logic (in `~/.nvm/nvm.sh`) skips re-checking the `default`
    alias if a Node version is already resolvable on the shell's inherited `PATH` — so changing
    `nvm alias default` alone does NOT change what fresh shells resolve to if something already
    put an nvm version on `PATH` beforehand. Fixed by adding an explicit
    `nvm use default` call to `~/.bashrc` right after the nvm.sh sourcing lines, so every new
    shell forcibly re-resolves against the current default alias instead of trusting stale
    inherited state.
- Dependencies installed via `yarn install` (uses `--legacy-peer-deps`-style resolution
  automatically since this is Yarn Berry with an old React 15.6.2 tree — expect peer dependency
  warnings, they're not fatal). `serialport`'s native binding (`@serialport/bindings-cpp`) uses
  N-API v6 (ABI-stable) with prebuilt binaries — no rebuild needed across Node versions.
- **GitHub CLI (`gh`)**: installed and authenticated as `WhiteRott` (`gh auth status` to
  verify). `git push`/PR creation go through this. **Caution**: `gh pr create` without `--repo`
  defaults to the upstream parent repo (`cncjs/cncjs`) when run from a fork, not the fork
  itself — always pass `--repo WhiteRott/cncjs` explicitly (learned the hard way: an earlier PR
  was accidentally opened against upstream and had to be closed).

## Build & Run
- Dev mode: `yarn dev` (runs `concurrently`: `start-app-dev` = webpack dev server for
  frontend, `start-server-dev` = backend Node server)
- Backend server: **port 8000** (`./bin/cncjs --port 8000`)
- Frontend webpack dev server: **port 8081** (changed from default 8080 — port 8080 was
  occupied by a Docker container on this machine, `docker-proxy`, likely part of the OpenClaw
  stack. Changed via `package.json`'s `start-app-dev` script: added `--port 8081` flag to the
  `webpack serve` command.)
- **To actually use the app in dev mode: open `http://localhost:8000`** (NOT 8081 — 8081 only
  serves raw built assets/directory listing since it renders `index.hbs`, a Handlebars
  template the browser can't render directly; the backend on 8000 is what actually serves the
  rendered app and proxies everything correctly).
- Standalone build (if needed without dev server): `yarn build-dev` — outputs to
  `output/cncjs/` (NOT `dist/cncjs/` — `bin/cncjs` branches on `NODE_ENV`: dev mode requires
  `output/cncjs/server-cli`, production mode requires `dist/cncjs/server-cli`, built via
  `yarn build-prod`/`yarn build`).

## Separate Docker deployment (production use, NOT this dev fork)
- There's an unrelated, already-working Docker Compose setup for stock upstream cncjs at
  `~/cncjs-docker/` (Dockerfile + docker-compose.yml), used for actually running the machine
  day-to-day. It also binds host port 8000. **Stop it before running the fork's dev server**
  to avoid port conflicts:
  `docker compose -f ~/cncjs-docker/docker-compose.yml stop`
  Restart it after dev work if needed:
  `docker compose -f ~/cncjs-docker/docker-compose.yml start`

## Hardware context
- Machine: HiMill D1 CNC, controller firmware = **grblHAL 1.1f** (2023-01-29), STM32F103C8
  driver, 4-axis capable (XYZA), ATC support compiled in (not currently using ATC hardware).
- Connects via `/dev/ttyACM0` on the host, stabilized with a udev rule creating a
  `/dev/himill` symlink (vendor 0483, product 5740) so the device path survives replug/reboot.
- Full `$$`/`$I` GRBL settings backup saved at:
  `~/cncjs-docker/backups/himill-grbl-settings-<date>.txt`
- Machine travel: 280 x 200 x 80 mm (X/Y/Z). Max rate 1000 mm/min all axes. Soft + hard limits
  enabled. Homing enabled.

## Current task: three feature additions to this fork
Work happens on branch `feature/tool-library`, PR tracked at
`https://github.com/WhiteRott/cncjs/pull/1` (draft).

1. **Tool library** — a data model + UI for managing a table of tools (number, diameter,
   length, notes, etc.). This is foundational — the other two features build on it.
   **Not started yet.**
2. **Tool length offsets** — hook into GRBL/grblHAL's tool length offset workflow (relevant
   G-codes: G43.1, G49), store a per-tool Z offset, apply it on tool change.
   **Partially done**: added a `toolProbeLength` field (global, alongside the pre-existing
   `touchPlateHeight`) representing the touch probe's stylus/stickout length below the tool
   tip — confirmed via user's hardware that it ADDS to `touchPlateHeight` in the offset math.
   Wired into `src/server/api/api.tool.js` (allow-list), `src/server/controllers/Grbl/GrblController.js`
   (WCS/TLO offset math), and the Tool widget (`src/app/widgets/Tool/index.jsx` + `Tool.jsx`,
   UI field + G-code preview for all 4 controller branches). Marlin/Smoothie/TinyG
   *controllers* were deliberately left untouched (only their UI preview text was updated) —
   this machine only runs Grbl/grblHAL. **Still needed**: the actual per-tool Z offset (this
   only added probe-length compensation to the existing single global tool-change config —
   true per-tool offsets depend on the tool library from item 1 existing first). Not yet
   dry-run tested on real hardware.
3. **Probing cycles** — extend probing beyond simple Z-touch-off. **Not started yet.**
   Existing code reviewed in depth (see below) — extend Autolevel's backend rather than
   building parallel infrastructure.

### Widget review findings (Probe / Autolevel / Tool)
- `src/app/widgets/Probe/` — simple manual single-axis touch-off (G38.2–G38.5), builds
  either a TLO (`G43.1`) or WCS (`G10 L20`) sequence client-side, no server persistence of
  results. Local component state only.
- `src/app/widgets/Autolevel/` — a full grid-based height-mapping/surface-compensation
  wizard (probe area → grid probe → bilinear-interpolated Z-compensation applied to loaded
  G-code). Real engine at `src/server/lib/autolevel.js` + per-controller probe-result capture
  in each `*Controller.js`. This substantially overlaps with planned "probing cycles" (item
  3) — extend this rather than duplicate it.
- `src/app/widgets/Tool/` — **not a tool library**. A single global tool-change policy panel
  (one machine-wide config, not a table of tools): 5 policy modes (ignore M6 / send M6 / WCS
  offset / TLO offset / custom macro), server-persisted at `GET/POST /api/tool` →
  `configstore` key `'tool'`. Actual M6 interception + macro execution lives in
  `GrblController.js`'s `tool:change` handler (~line 1656), using cncjs's bracket-macro
  engine (`[tool_probe_z]` etc.), not raw string concatenation. Good foundation to extend for
  per-tool offsets once the tool library exists; has zero multi-tool data model today.

### grblHAL capability notes (from `~/cncjs-docker/backups/himill-grbl-settings-<date>.txt`)
- `$6=0` — probe pin present, functional, not inverted.
- `$341=0` ("Normal/Basic" tool-change mode) — grblHAL's own native tool-change probing
  (`$341`–`$346`, modes 1–3) is NOT active; this machine relies entirely on cncjs's
  application-level M6 interception instead. No conflict as long as cncjs's policy comments
  out the M6 line before grblHAL sees it (confirmed true for the WCS/TLO/Custom policies).
- G43.1/G49 are standard in grblHAL's core dialect, not gated behind a `$` setting or the
  `NEWOPT:ATC` build flag — nothing in the current machine config blocks any of the three
  planned features.

## Working style notes
- Prefers batched multi-step commands over one-at-a-time once things are stable, but wants
  step-by-step + explicit output pasted back when debugging something that could fail.
- Wants real git branches / proper fork workflow (not just local hacking) — commit and push
  work to `origin` (WhiteRott/cncjs) as it progresses.
