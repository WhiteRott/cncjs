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
`https://github.com/WhiteRott/cncjs/pull/1` (draft — description is stale, still only
describes the probe-length piece; needs a rewrite before marking ready for review).

1. **Tool library** — a data model + UI for managing a table of tools. **Done.**
   `src/server/api/api.toolLibrary.js` (CRUD + paging, `configstore` key `'toolLibrary'`),
   client wrapper in `app/api`, and the `ToolLibrary` widget
   (`src/app/widgets/ToolLibrary/{index,ToolLibrary,AddTool,EditTool,constants}.jsx`).
   Record fields: `id`, `mtime`, `number`, `name`, `type` (shape taxonomy — see below),
   `diameter`, `fluteLength`, `length`, `flutes`, `notes`, `active` (single active-tool
   selection, one record flagged at a time).
2. **Tool length offsets** — hook into GRBL/grblHAL's tool length offset workflow (relevant
   G-codes: G43.1, G49), store a per-tool Z offset, apply it on tool change.
   **Partially done, unchanged since last update — this is the piece still open.** Added a
   `toolProbeLength` field (global, alongside the pre-existing `touchPlateHeight`)
   representing the touch probe's stylus/stickout length below the tool tip — confirmed via
   user's hardware that it ADDS to `touchPlateHeight` in the offset math. Wired into
   `src/server/api/api.tool.js` (allow-list), `src/server/controllers/Grbl/GrblController.js`
   (WCS/TLO offset math), and the Tool widget (`src/app/widgets/Tool/index.jsx` + `Tool.jsx`,
   UI field + G-code preview for all 4 controller branches). Marlin/Smoothie/TinyG
   *controllers* were deliberately left untouched (only their UI preview text was updated) —
   this machine only runs Grbl/grblHAL. **Still needed**: the actual per-tool Z offset — this
   only added probe-length compensation to the existing single global tool-change config.
   The tool library (item 1) now exists, so the blocker for per-tool offsets is gone; this is
   the natural next slice of work. Not yet dry-run tested on real hardware.
3. **Probing cycles** — extend probing beyond simple Z-touch-off. **Substantially done.**
   Built as a new `ProbingCycles` widget (`src/app/widgets/ProbingCycles/`) rather than
   extending Autolevel — Autolevel stayed a separate grid/height-mapping tool since the new
   cycles are single-shot geometry probes (edge/corner), not surface compensation. Backend
   math lives in `src/server/lib/edgeprobe.js` (line fit for edge/skew) and
   `src/server/lib/probecycles.js` (circle fit for corner/bore/boss, shared by future cycles).
   Existing `Probe` widget was renamed to **Zero Probe** (`src/app/widgets/Probe/`) to
   disambiguate from Probing Cycles — it's still the simple single-axis G38.2–G38.5 touch-off,
   unchanged in behavior.
   - **Edge / Skew Probe**: probes N points along an edge, least-squares line fit reports
     skew angle. Reworked into a 2-touch cycle (fast find, back off, settle, slow confirm
     touch feeds the fit) for repeatability.
   - **Corner Probe**: probes both edges of a corner using the same 2-touch technique;
     approach moves always go one axis at a time (line axis, then probe axis) so the final
     approach leg is a straight line and can't cut diagonally across the corner.
   - **Probe tip diameter compensation**: ball-tip stylus contact points are at the ball
     center, not the true surface — each point is corrected by stylus radius along its probe
     axis before fitting.
   - **Safety limits**: global "Max Probe Deflection" setting (alongside Probe Length) —
     Probing Cycles warns/blocks a run whose configured Probe Distance would exceed it.
   - **Retry-on-miss**: a G38.2 that reaches its target without triggering hard-alarms
     grblHAL. Failed touches now retry the whole point (unlock, requeue, feeder queue
     explicitly cleared first) at increasing search distance (+1mm, +2mm... up to +5mm total)
     before giving up and leaving it alarmed as before.
   - **Z-lift on edge transitions**: the move from the last X-edge point to the first Y-edge
     point now lifts Z first, since that's the one point-to-point travel that crosses real
     stock rather than open air.
   - Underlying bug fixed along the way: cncjs's periodic `$G` parser-state poll writes to
     the serial port on its own timer, independent of the feeder's send/wait-for-ok
     sequencing — an in-flight `$G` query's reply could land mid-cycle and get consumed by
     flag-matching instead of content, swallowing the probe's own `ok` and stalling the feed
     queue. Fixed via pendingAcks-based `ok` priority handling.

### Widget map (Probe / Zero Probe / ProbingCycles / Autolevel / Tool / ToolLibrary)
- `src/app/widgets/Probe/` (**Zero Probe**) — simple manual single-axis touch-off
  (G38.2–G38.5), builds either a TLO (`G43.1`) or WCS (`G10 L20`) sequence client-side, no
  server persistence of results. Local component state only.
- `src/app/widgets/ProbingCycles/` — Edge/Skew and Corner probe cycles, see item 3 above.
- `src/app/widgets/Autolevel/` — a full grid-based height-mapping/surface-compensation
  wizard (probe area → grid probe → bilinear-interpolated Z-compensation applied to loaded
  G-code). Real engine at `src/server/lib/autolevel.js` + per-controller probe-result capture
  in each `*Controller.js`. Left as-is — kept separate from Probing Cycles (see item 3).
- `src/app/widgets/Tool/` — **not the tool library** (that's `ToolLibrary`, item 1). A single
  global tool-change policy panel (one machine-wide config): 5 policy modes (ignore M6 / send
  M6 / WCS offset / TLO offset / custom macro), server-persisted at `GET/POST /api/tool` →
  `configstore` key `'tool'`. Actual M6 interception + macro execution lives in
  `GrblController.js`'s `tool:change` handler (~line 1656), using cncjs's bracket-macro
  engine (`[tool_probe_z]` etc.), not raw string concatenation. This is what item 2's
  per-tool offset work will extend, now that `ToolLibrary` supplies the multi-tool data model
  it was missing.
- `src/app/widgets/ToolLibrary/` — the tool library (item 1): table UI + add/edit modals over
  `api.toolLibrary`.

### grblHAL capability notes (from `~/cncjs-docker/backups/himill-grbl-settings-<date>.txt`)
- `$6=0` — probe pin present, functional, not inverted.
- `$341=0` ("Normal/Basic" tool-change mode) — grblHAL's own native tool-change probing
  (`$341`–`$346`, modes 1–3) is NOT active; this machine relies entirely on cncjs's
  application-level M6 interception instead. No conflict as long as cncjs's policy comments
  out the M6 line before grblHAL sees it (confirmed true for the WCS/TLO/Custom policies).
- G43.1/G49 are standard in grblHAL's core dialect, not gated behind a `$` setting or the
  `NEWOPT:ATC` build flag — nothing in the current machine config blocks any of the three
  planned features.

### Subroutines/macros are NOT available on this firmware — settled, don't re-litigate
This machine reports `[VER:1.1f.20230129:]` — grblHAL build **2023-01-29**. Every
subroutine/macro feature postdates it (verified 2026-09-07 against `grblHAL/core`'s
`changelog.md`):

| Feature | grblHAL build | vs. this machine |
|---|---|---|
| `G65` + `M99` macro call/return (experimental) | 20230507 | ~3 months too late |
| Expressions & flow control — `#vars`, `IF`, `WHILE` (experimental) | 20230529 | ~4 months too late |
| LinuxCNC-style subroutines (experimental) | 20240526 | ~16 months too late |
| Named `o-sub`/`o-call` from SD/littlefs | 20241116 | ~22 months too late |
| `M98` subroutines + `$700` | 20260202 | ~3 years too late |

Two further constraints even on newer firmware: expressions/flow control must be enabled at
**compile time**, and from build 20230607 the changelog states macros "has to be stored on a
SD card or in littlefs" — i.e. file-resident, which doesn't fit cncjs's line-streaming sender
model. This board *does* have SD compiled in (`[NEWOPT:ENUMS,RT+,HOME,ATC,SED,SD,YM]`), so a
firmware update would make that path viable; the blocker is firmware age, not hardware.

#### Recompiling the firmware won't fix this — the F103 is out of flash
Checked 2026-09-07 against `grblHAL/STM32F1xx`. Building is easy (there's a
[Web Builder](https://svn.io-engineering.com:8443/?driver=STM32F1xx), no local toolchain
needed) but it can't deliver macros on this board:
- **The driver's 128K-F103 support is frozen at release `20250514`** "due to lack of memory"
  (per the driver README). `M98` needs core `20260202` — ~9 months *after* the freeze. Not a
  config toggle.
- Direction of travel is *removing* features to fit: builds after `20250116` dropped `G5`,
  `G5.1` and all canned cycles from the 128K pills to save flash.
- The C8 build target is `bluepill_f103c8_128k` — i.e. it already relies on the undocumented
  extra flash on C8 chips, and is still out of room.
- `NGC_EXPRESSIONS_ENABLE=On` would in principle give `#vars`, `IF`/`WHILE` and O-word subs
  (`ngc_flowctrl.c` is gated behind that one flag — note core `config.h`'s comment claiming
  "conditionals and subroutines are not" supported is **stale**, predating the flow-control
  work). But flash exhaustion is exactly why the target is frozen, so enabling it is unlikely
  to link.
- `SDCARD_ENABLE` exists for F1xx but the plugin remaps SPI1 and **disables the JTAG/SWD
  programming interface** on first mount (recoverable only via `$PGM` + power cycle). F1xx has
  no `LITTLEFS_ENABLE` at all, unlike F4xx.

If controller-side macros are ever genuinely wanted, it's a **hardware** change, not a build
change: the driver README suggests STM32F3xx Blackpill as a near drop-in for F103 pills, and
F4xx (F401/F411/F446) is where SD + littlefs + expressions comfortably fit.

**This is why the probing cycles compute points in JS server-side and stream plain
`G0`/`G38.2`, reacting to `PRB:` reports** — not an oversight. Note the user's reference doc
`~/Documents/cnc/Probing cycles` confidently describes all of the above as available; its
7-cycle taxonomy is sound and drives the roadmap, but its grblHAL subroutine sections do not
apply here. (An earlier session recorded `M98` as landing in build `20250202`, "~2 years" —
that was off by a year; it's `20260202`, ~3 years.)

## Branch inventory
`feature/tool-library` is the trunk for this effort (PR #1). Three branches sit on top of it
with work that is **pushed but NOT yet physically verified on the machine** — per the standing
rule, controller code that emits G-code doesn't get merged on passing tests alone. Each already
carries an UNVERIFIED marker in its own in-branch CLAUDE.md.

| Branch | Own commits | Scope | Status |
|---|---|---|---|
| `feature/per-tool-z-offsets` | `c3f7fc9f` (+ CLAUDE.md marker) | Extracts `src/server/lib/toolLibrary.js` (`getSanitizedRecords`, `updateToolZOffsetByNumber`, `toRecordFields`) out of `api.toolLibrary.js`, and has `GrblController`'s TLO tool-change persist the probed Z back onto the tool record. Adds `toolLibrary.test.js`. | UNVERIFIED |
| `fix/probing-cycle-x-to-y-transition` | `60589ec5` (+ marker) | Fixes the corner/edge probe stalling at the last X-edge touch — no retract, no error, widget stuck until Stop. Adds `GrblController.probingCycles.test.js` (189 lines) driving a full cycle through a fake serial harness. | UNVERIFIED |
| `fix/probe-deflection-labeling` | `ec7acb24` | **Contains the X-to-Y fix** (branched from it, not from trunk). Splits the misnamed `toolProbeMaxDeflection` setting into `toolProbeMaxTravel` + `toolProbeMaxStylusDeflection`, since the check only ever measured travel distance. Touches Tool widget, ProbingCycles, `api.tool.js`, i18n. | UNVERIFIED |

Note the stacking: `fix/probe-deflection-labeling` already includes
`fix/probing-cycle-x-to-y-transition`, so verifying and merging the former brings the latter
with it — don't merge both independently. `feature/per-tool-z-offsets` is independent of both.

The corresponding worktrees live under `.claude/worktrees/` (untracked). Note these have no
`node_modules` of their own, so the `pre-push` lint hook fails there — symlink the main
checkout's `node_modules` in rather than pushing with `--no-verify`.

## Reference branches (not part of the feature work)
- **`smart-pendant`** — branched off `master`, holds `reference/SmartPendant/`: read-only
  copies of `GrblComm.cpp`/`.h` and `ProbeScr.cpp`/`.h` from
  [`WhiteRott/SmartPendant`](https://github.com/WhiteRott/SmartPendant) (STM32F411 grblHAL
  pendant firmware; copyright Devtronic & Nicolai Shlapunov). Nothing here is built or
  imported by cncjs — it's a cross-reference for grblHAL protocol details (real-time status,
  `[PRB:]`/`[TLO:]`/`[AXS:]` parameter messages, alarm/state enums) and for its
  `CenterFinderTab`/`EdgeFinderTab`/`ToolOffsetTab`, the closest existing analogue to this
  fork's probe cycles and TLO tool-change. Open lead noted in its README: grblHAL reports the
  *actually applied* tool length offset via `[TLO:...]`, which SmartPendant reads back after
  every `G43.1`; cncjs parses that message in `GrblLineParserResultParameters.js` but
  `GrblRunner.js` only re-emits it and never stores it — a close-the-loop opportunity for the
  per-tool offset work.

## Working style notes
- Prefers batched multi-step commands over one-at-a-time once things are stable, but wants
  step-by-step + explicit output pasted back when debugging something that could fail.
- Wants real git branches / proper fork workflow (not just local hacking) — commit and push
  work to `origin` (WhiteRott/cncjs) as it progresses.
