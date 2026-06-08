# tools/sprites — runtime sprite asset pipeline + CLI toolbelt

Status: active build tooling
Owner lane: art direction + production + Godot integration
Authority level: active for source-sheet → runtime-sheet conversion. Required to gate any runtime sprite under `art/characters/*/sheets/`.
Dependencies: Python 3.10+, [Pillow](https://pillow.readthedocs.io/) (`pip install pillow`). Optional: [Aseprite](https://www.aseprite.org/) ($20 — strongly recommended; LibreSprite also works).
Project canon: `design_system/v0_9_mercy_rpg_substrate/10-asset-pipeline.md` and `09-naming-conventions.md`.

## What this does

General-purpose AI image models reliably produce *pixel-art-styled illustrations* and not *runtime sprite sheets*. The fix is to stop pretending image models can produce drop-in Godot assets. Instead:

```text
AI / artist → high-res master/source sheet (any size, any colors, any background)
                    ↓
       retarget.py / make_runtime_sprite.py (deterministic downconversion)
                    ↓
       runtime sheet — 64×96 frames, RGBA, ≤48 colors, palette-pinned
                    ↓
       (optional) Aseprite manual cleanup pass
                    ↓
       Godot SpriteFrames import
```

The Python step is deterministic. Aseprite handles polish. The CLI wrapper hides every flag behind one-word commands.

High-res AI outputs now have a separate **master lane**:

```text
art/characters/<char>/masters/<char>_<pass>_master.png
        ↓
./tools/sprite retarget <char> <pass> --method all
        ↓
art/characters/<char>/preview/candidates/<run>/*_{box,nearest,lanczos}_64x96.png
        ↓
promote one passing candidate, then polish in Aseprite
```

Use `box` as the default for AI pseudo-pixel masters, `nearest` for true
hand-authored pixel art, and `lanczos` only as a review candidate when the
source is painterly enough that box loses too much shape information.

PixelLab, the PixelLab Aseprite extension, future PixelLab MCP output, and loose
manual frame folders use the same rule: they are **source intake**, not runtime
assets. Their raw frames are copied into a source-intake run, assembled through
the shared runtime-sheet seam, and only become canonical if the normal validator
passes.

## Quick reference — `./sprite` commands

```bash
./tools/sprite <command> [args]

# discovery
./tools/sprite list                          # show every character × pass and which sheets exist
./tools/sprite diagnose                      # check Python / Pillow / Aseprite

# routine workflow
./tools/sprite watch                         # auto-route ~/Downloads/<character>_<pass>.png drops
./tools/sprite ingest <file> <char> <pass>   # manual ingest (alternative to watch)
./tools/sprite ingest <file> <char> <pass> --as master
                                             # store high-res master without replacing source
./tools/sprite convert <char> <pass>         # source → runtime; auto-runs preview on PASS
./tools/sprite convert <char> <pass> --from master --resize-method box
                                             # master → runtime; overwrites canonical only when intended
./tools/sprite retarget <char> <pass> --method all
                                             # master/source → safe candidate sheets for review
./tools/sprite validate <char> <pass>        # re-run acceptance check standalone
./tools/sprite preview <char> <pass>         # generate GIFs + 4× zoom PNG for visual review
./tools/sprite compare <char> <pass>         # side-by-side source/runtime polish board
./tools/sprite polish <char> <pass>          # open runtime sheet in Aseprite with palette pre-loaded
./tools/sprite aseprite-watch                # auto-export + validate when an .aseprite is saved

# project-wide
./tools/sprite health                        # validate every runtime sheet across the project
./tools/sprite catalog                       # build art/characters/index.html visual dashboard
./tools/sprite path <char> <pass> runtime    # print canonical paths for scripts/hooks
./tools/sprite metadata <char> <pass>        # print JSON spec context for automation
./tools/sprite aseprite-run <script> <char> <pass> --output /tmp/out.png --param key=value

# PixelLab source intake (offline-safe dry-run first)
./tools/sprite pixellab balance              # verify PIXELLAB_SECRET + show quota
./tools/sprite pixellab status               # back-compat alias for balance
./tools/sprite pixellab character create kalev idle_front --dry-run
./tools/sprite pixellab character refresh kalev
./tools/sprite pixellab generate kalev locomotion --dry-run
./tools/sprite pixellab assemble kalev locomotion /path/to/frames
./tools/sprite pixellab assemble kalev locomotion /path/to/extension-frames --adapter aseprite_extension

# adding new content
./tools/sprite scaffold <new-character>      # bootstrap folders + spec stub
```

All commands resolve dimensions, palette, baseline, and grid shape from `tools/sprites/specs/<character>.json`. No flags needed for routine use.

## The full happy path

```bash
# 1. (one-time) install Aseprite Lua scripts for in-editor export+validate
#    — see tools/sprites/aseprite_scripts/INSTALL.md

# 2. Start the watcher in the background of your terminal
./tools/sprite watch &

# 3. Generate a sprite anywhere; save it to ~/Downloads as kalev_locomotion.png
#    The watcher auto-detects, archives a timestamped copy, stages the source,
#    runs the conversion, validates, and produces GIF previews.

# 3b. For AI pseudo-pixel art, prefer a high-res master first:
./tools/sprite ingest /path/to/kalev_locomotion_4x.png kalev locomotion --as master
./tools/sprite retarget kalev locomotion --method all
#    Review preview/candidates/<run>/..._retarget_compare_zoom2x.png.
#    Promote only the best single-method candidate:
./tools/sprite retarget kalev locomotion --method box --promote

# 4. Polish in Aseprite (palette pre-loaded)
./tools/sprite polish kalev locomotion

# 5. Save in Aseprite. If aseprite-watch is running OR you bound the
#    export_with_validation Lua script to a hotkey, the runtime PNG re-exports
#    and re-validates automatically.

# 6. Refresh the project dashboard
./tools/sprite catalog
```

## Files

| File | Purpose |
|---|---|
| `cli.py` | Main subcommand dispatcher. Every `./sprite <cmd>` lands here. |
| `_common.py` | Shared helpers: spec loading, path resolution, Aseprite discovery, terminal colors. |
| `make_runtime_sprite.py` | Deterministic source/master → runtime conversion. Detects + removes background, crops, resizes with selectable filter (`nearest`, `box`, `lanczos`, etc.), quantizes to palette, anchors feet. Standalone CLI also works. |
| `retarget.py` | Safe high-res master/source → reviewable runtime candidates. Writes candidate PNGs, a contact sheet, validation report, and optionally promotes one passing candidate. |
| `validate_sprite.py` | Acceptance check (format / dims / mode / colors / transparency / palette pin / baseline). Exit 0 = PASS. |
| `palette.py` | Project palette + per-character subsets. Mirrors `design_system/colors_and_type.css`. Run directly to regenerate `palettes/*.gpl`. |
| `source_intake.py` | Sanitized source-intake manifests under `art/characters/<char>/_drafts/source_intake/<run_id>/`; no secrets, bearer headers, full prompts, raw base64, or private URLs. |
| `runtime_sheet.py` | Shared local frame-folder/frame-path → runtime PNG assembly used by PixelLab REST, manual frames, extension exports, and future MCP output. |
| `animation_catalog.py` | Data-backed PixelLab animation-key support map. Idle/walk are supported; care/tincture/combat rows are explicit manual/template-TBD entries until mapped. |
| `preview.py` | GIF per animation row + 4× zoom PNG. |
| `compare.py` | Side-by-side source/runtime comparison board for polish decisions. |
| `watch.py` | Polling watcher for `~/Downloads/`. Routes `<character>_<pass>*.png` files into the pipeline. |
| `polish.py` | Spawns Aseprite with the right palette pre-loaded. |
| `aseprite_watch.py` | Watches `art/characters/*/aseprite/*.aseprite` saves; auto-exports to `sheets/` and validates. |
| `health.py` | Project-wide validation summary. |
| `catalog.py` | Generates `art/characters/index.html` with thumbnails, GIFs, and full-validator acceptance status. |
| `scaffold.py` | Creates folder structure + spec stub for a new character. |
| `path` CLI command | Prints canonical `source`, `master`, `runtime`, `aseprite`, or `preview` paths from the spec; used by Aseprite scripts to avoid guessing canvas suffixes. |
| `metadata` CLI command | Prints frame/grid/baseline/path JSON for headless Aseprite scripts. |
| `aseprite-run` CLI command | Runs any project Lua script via `aseprite -b --script ... --script-param ...`, with optional `--output`/`--in-place`. |
| `specs/*.json` | Per-character pipeline declarations: passes, source/target grid, frame size, baseline, palette name. |
| `palettes/*.gpl` | GIMP Palette files for direct import into Aseprite/LibreSprite/GIMP/Krita. |
| `aseprite_scripts/*.lua` | Aseprite-side automation: load palette, export-with-validation, baseline overlay, mirroring, nudging/scaling cells, hair canopy fill, and timeline tagging. |

## Current hardening notes

- `health` and `catalog` use the same validator as `./tools/sprite validate`, so dashboard PASS means the sheet met palette, alpha, dimension, and baseline gates.
- PixelLab paid paths write a pending source-intake manifest before the first paid API POST. If provenance cannot be written, generation fails closed before spending credits.
- Source-intake manifests store prompt hashes, request fingerprints, local artifact paths, job IDs, assembly reports, and validation evidence; they do not store `PIXELLAB_SECRET`, auth headers, bearer tokens, raw base64 images, or private frame URLs.
- `pixellab generate --dry-run` is non-generative and reports supported/unsupported animation keys plus job count without REST, download, or polling calls.
- `retarget` never overwrites canonical runtime sheets unless `--promote` is passed with one passing method.
- Non-nearest master downsampling re-binarizes alpha after resize so runtime sheets still obey alpha `{0,255}`.
- `ingest --then-convert` is regression-tested and uses the canonical staged source when no explicit source override is present.
- Watchers wait for a stable mtime before marking a drop/save as handled, avoiding lost events on slower writes.
- Aseprite export automation resolves runtime paths through `./tools/sprite path`, so pass names with underscores (for example `idle_front`) and canvas suffixes stay spec-driven.
- `export_with_validation.lua` hides `TOM ...` helper layers before export, so baseline overlays never leak into runtime PNGs.

## Aseprite polish automation

Install the scripts in `tools/sprites/aseprite_scripts/` once, then use them from
**File → Scripts** or bind hotkeys.

| Script | Use |
|---|---|
| `baseline_overlay.lua` | Toggle a temporary grid + baseline guide layer (`TOM baseline overlay`). |
| `add_hair_canopy.lua` | Add 1-keystroke hair volume above the top silhouette of selected rows/cells. |
| `mirror_left_to_right.lua` | Copy a left-facing row into a right-facing row with per-cell horizontal flip. |
| `shrink_or_lift_cell.lua` | Shift selected cells by `dx`/`dy`, optionally with nearest-neighbor `scale`. |
| `auto_tag_animations.lua` | Set grid/frame timing and create timeline tags when the document is frame-based. |
| `export_with_validation.lua` | Export the runtime PNG and run `./tools/sprite validate`. Hides `TOM ...` helper layers first. |

All scripts read `tools/sprites/specs/<character>.json` through the Python CLI, so
frame size, row names, baseline, and output paths stay declarative.

Headless example:

```bash
./tools/sprite aseprite-run add_hair_canopy kalev idle_front \
  --output /tmp/kalev_hair_pass.png \
  --param rows=idle_down \
  --param height=4 \
  --param color=#1A1612
```

## PixelLab source-intake workflow

Use PixelLab as a generator upstream of the canonical runtime pipeline:

```text
PixelLab REST / PixelLab Aseprite extension / future PixelLab MCP / manual PNGs
        ↓
art/characters/<char>/_drafts/source_intake/<run_id>/
        ├── manifest.json      # sanitized provenance + pending/completed status
        ├── raw/               # downloaded or exported source frames
        ├── normalized/        # spec-fitted runtime cells
        └── reports/           # assembly + validation evidence
        ↓
runtime_sheet.py
        ↓
validate_sprite.py
        ↓
art/characters/<char>/sheets/<char>_<pass>_<canvas>.png
```

Recommended loop:

```bash
export PIXELLAB_SECRET=...                 # env-only; never commit it
./tools/sprite pixellab status
./tools/sprite pixellab generate kalev locomotion --dry-run
./tools/sprite pixellab generate kalev locomotion
./tools/sprite validate kalev locomotion
./tools/sprite preview kalev locomotion
./tools/sprite polish kalev locomotion
```

Manual or extension-generated frames should be named
`<animation_key>_<frame_index>.png` (`idle_down_0.png`, `walk_left_3.png`, …) and
fed through:

```bash
./tools/sprite pixellab assemble kalev locomotion /path/to/frames
./tools/sprite pixellab assemble kalev locomotion /path/to/extension-frames --adapter aseprite_extension
```

Idle/walk rows are mapped for PixelLab generation. Care, tincture, and combat
rows are intentionally cataloged as unsupported/manual/template-TBD until we
choose exact PixelLab templates; unsupported keys fail safely before network or
paid calls.

## Per-character spec format

`tools/sprites/specs/kalev.json`:

```json
{
  "name": "kalev",
  "palette": "kalev",
  "default_frame_w": 64,
  "default_frame_h": 96,
  "default_baseline_y": 84,
  "passes": {
    "idle_front": {
      "description": "Pass 1a — smallest viable test; 4-frame idle_down breath cycle.",
      "source_frames": 4,
      "source_cols": 4,
      "source_rows": 1,
      "target_cols": 4,
      "target_rows": 1,
      "animation_keys": ["idle_down"]
    }
  }
}
```

Edit specs to add new passes or override per-pass dimensions (`frame_w`, `frame_h`, `baseline_y`).

## Aseprite vs LibreSprite

For this project specifically, **buy Aseprite ($20)**. Decisive factor is the CLI:

| Capability | Aseprite | LibreSprite |
|---|---|---|
| Indexed-mode palette lock | mature | functional, rougher |
| `aseprite -b --script` Lua | full API | subset; some scripts incompatible |
| `aseprite -b --save-as` headless export | reliable | works, format quirks |
| Animation tags + per-tag export | complete | partial |
| Updates / community / Steam Workshop | active since 2014 | limited maintenance since 2016 |

The CLI alone is the buy — the bundled `aseprite-watch` and `export_with_validation.lua` script depend on it.

If LibreSprite is enough for now, every command in this toolbelt still works (we use the same CLI shape; LibreSprite implements most of it). The Lua scripts in `aseprite_scripts/` may need light edits.

## What the pipeline can and cannot fix

**Can fix automatically:**
- Wrong source dimensions (any size scales down nearest-neighbor)
- Baked checkerboard or solid-fill backgrounds (border-sample heuristic)
- Anti-aliased edges (alpha threshold binarizes to opaque/transparent)
- Off-palette colors (every opaque pixel snaps to the nearest project token)
- Semi-transparent silhouette pixels (binarized at alpha=128)
- Center-of-cell positioning (feet aligned to baseline, x-centered)

**Needs Aseprite cleanup:**
- Sub-pixel detail lost in the 8:1 downscale (notebook spine, vial glint, eye position)
- Cross-frame anatomical jitter (if source frames disagree by 5 px, runtime frames will too)
- Hand readability at native scale
- Outline cleanup where the threshold left rough edges

## Recommended source format

For best results from any tool:

- 4–8× larger than the runtime cell (256×384, 512×768, 1024×1536 for a 64×96 output)
- Frames laid out matching the runtime grid (4 frames in source = 4 cells in target)
- Each source frame is roughly the same size
- Background can be anything (transparent, checkerboard, solid color)
- File saved as PNG (preferred) — JPEG is rejected by the validator regardless of content

## Editing the palette

Source of truth: `design_system/colors_and_type.css` and `tools/sprites/palette.py`. To add a new project token:

1. Add the hex to `colors_and_type.css` under the appropriate group.
2. Add the name and `_hex(...)` entry to `PROJECT_PALETTE` in `palette.py`.
3. Add the name to any character subset that should accept the new color.
4. Re-run `python3 tools/sprites/palette.py` to regenerate `palettes/*.gpl`.
5. Re-import the `.gpl` file into Aseprite/LibreSprite if running.
6. Re-run conversions for affected characters: `./sprite convert <char> <pass>`.

The pipeline never invents new colors — it only quantizes to what's already declared.

## Filename conventions for the watcher

Drop a PNG in `~/Downloads` whose stem starts with `<character>_<pass>`:

| Filename | Routes to |
|---|---|
| `kalev_idle_front.png` | kalev / idle_front |
| `kalev_idle_front_attempt3.png` | kalev / idle_front |
| `kalev_locomotion_64x96.png` | kalev / locomotion |
| `wolf_full_sheet.png` | wolf / full_sheet |
| `unknown_thing.png` | (skipped — logged) |

Rename your AI tool's outputs to match, or use `./sprite ingest <file> <char> <pass>` for manual routing.

## Troubleshooting

**`./tools/sprite` says permission denied** → `chmod +x tools/sprite` once after cloning.

**`Pillow not found`** → `pip install pillow` (or `pip3 install pillow` depending on your env).

**`aseprite not found`** → set `ASEPRITE_BIN=/path/to/your/binary` in your shell, or symlink the binary into `~/.local/bin/aseprite`.

**Palette matching looks wrong (e.g., face turned bright red)** → the character's palette subset is missing a needed mid-tone. Add it in `palette.py`, regenerate `.gpl`, re-run convert.

**Source has 5 cols × 8 rows but my spec says 4 × 1** → you're trying to convert a full locomotion sheet using the `idle_front` spec. Use `./sprite list` to see passes; rename the source file to match the right pass (e.g., `kalev_locomotion.png`).
