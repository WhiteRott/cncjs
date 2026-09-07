# SmartPendant reference sources

Read-only reference material. **Nothing here is built, imported, or executed by cncjs** —
these are C++ firmware sources kept alongside the JS codebase purely as a cross-reference
for grblHAL protocol details and probe-cycle behaviour.

## Provenance

Copied from [`WhiteRott/SmartPendant`](https://github.com/WhiteRott/SmartPendant), an
STM32F411 touchscreen MPG/DRO pendant firmware for grblHAL. Original authorship and
copyright belong to Devtronic & Nicolai Shlapunov (2023) — see each file's header.
Upstream project: https://github.com/nickshl/SmartPendant

These particular copies were recovered from the 2026-08-23 session backup at
`~/Documents/claude/backup/cncjs-fork/2026-08-23-cncjs-fork/tmp/`. Consult the upstream
repo for current versions; these are a point-in-time snapshot.

## Why these four files

| File | Why it's useful here |
|---|---|
| `GrblComm.cpp` / `.h` | A complete, working grblHAL protocol implementation: real-time status reports `<...>`, parameter messages `[...]` (`PRB:`, `TLO:`, `AXS:`), `$`-settings parsing, alarm/state enums. Good ground truth when cncjs's own parsing is in question. |
| `ProbeScr.cpp` / `.h` | `CenterFinderTab` / `EdgeFinderTab` / `ToolOffsetTab` — directly comparable to this fork's Corner/Edge probe cycles and TLO tool-change flow. |

## Specific open lead

grblHAL emits a real-time `[TLO:...]` message reporting the *actually applied* tool length
offset, separate from `[PRB:...]`. SmartPendant reads it back after every `G43.1` via `$#`
(see `GrblComm.cpp`, the `TLO:` branch around line 1800).

cncjs already parses `[TLO:...]` in `GrblLineParserResultParameters.js`, but `GrblRunner.js`
only re-emits it as an event — it never stores it in state. That's a close-the-loop
opportunity for this fork's TLO tool-change: verify the offset the controller actually
applied, rather than assuming the commanded value took.
