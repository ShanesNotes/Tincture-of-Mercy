# Slice 10 — Source → Runtime Asset Pipeline

Status: active asset-pipeline canon
Owner lane: art direction + production + Godot integration
Authority level: active for all v0.9 sprite-asset production. Required as a gate before any runtime sprite enters `art/characters/*/sheets/`.
Dependencies: `09-naming-conventions.md`, `01-kalev-runtime-sprite-plan-v0_1.md`, `tools/sprites/`, `design_system/colors_and_type.css`
Maximum intended scope: source-vs-runtime distinction + automated conversion + manual cleanup workflow. Not a Godot tutorial, not a character authoring guide.
Validation gate: every PNG under `art/characters/*/sheets/` passes `tools/sprites/validate_sprite.py` against its character's palette and target dimensions.

## Why this exists

Three v0.9 attempts at producing a Kalev locomotion sheet through general-purpose AI image models confirmed an empirical pattern: these tools render *pixel-art-styled illustrations* (high resolution, baked backgrounds, thousands of unique colors, no transparency, no palette discipline) and not *runtime sprite sheets*. No amount of prompt phrasing fixes the structural mismatch.

The active answer is to stop pretending image models can produce drop-in Godot assets. Instead:

```text
AI / artist → high-res source sheet (any size, any colors)
                    ↓
       make_runtime_sprite.py (deterministic)
                    ↓
       runtime sheet — 64×96 frames, RGBA, ≤48 colors, palette-pinned
                    ↓
       (optional) Aseprite / LibreSprite manual cleanup pass
                    ↓
       Godot SpriteFrames import
```

The Python step is deterministic and reproducible. Source sheets can fail in any way that doesn't destroy the silhouette and we can still extract a runtime sheet. The optional Aseprite pass is where a human pixel artist polishes hands, faces, feet, and outline detail that the downscale step necessarily loses.

## Source vs runtime — definitions

| Layer | Where | Authority | Examples |
|---|---|---|---|
| **Concept reference** | `art/characters/<name>/<name>_design_asset.png` | Tone / silhouette guide. Not Godot-droppable. | The 1122×1402 v0.8.1 design assets. |
| **Source sheet** | `art/characters/<name>/source/<name>_<purpose>_source.png` | Pre-pipeline raw input. Any dimensions, any colors, any background. May come from AI image models, human concept artists, photo references — anything with the right silhouette. Not Godot-droppable. | A 2048×768 AI output with baked checkerboard background. |
| **Runtime sheet** | `art/characters/<name>/sheets/<name>_<purpose>_<canvas>.png` | Godot-droppable. Native frame size, palette-pinned, transparent background, single-pixel outlines. Output of `make_runtime_sprite.py`. | `kalev_locomotion_64x96.png` 320×768. |
| **Aseprite project** | `art/characters/<name>/aseprite/<name>_<purpose>.aseprite` | Working file for manual pixel-art cleanup. Layered, palette-locked, animation-tagged. | `kalev_locomotion.aseprite`. |

Each layer answers a different question:
- **Concept reference:** *what does this character look like?*
- **Source sheet:** *what does this animation look like in motion, at any fidelity?*
- **Runtime sheet:** *what gets imported into Godot's `SpriteFrames`?*
- **Aseprite project:** *what does the artist edit between source and runtime?*

The conversion script eats source sheets and produces runtime sheets. The Aseprite project is optional — it's where manual cleanup polishes runtime sheets that need it.

## Folder layout

```
art/characters/<name>/
├── <name>_design_asset.png              # concept reference (do not edit)
├── source/                              # pre-pipeline inputs (any format)
│   └── <name>_<purpose>_source.png
├── sheets/                              # runtime outputs (Godot-droppable)
│   └── <name>_<purpose>_<canvas>.png
├── aseprite/                            # manual cleanup working files
│   └── <name>_<purpose>.aseprite
└── animations/                          # v0.8.1 provenance only
    └── ...

tools/sprites/                           # the pipeline
├── README.md
├── palette.py
├── make_runtime_sprite.py
├── validate_sprite.py
└── palettes/                            # .gpl files for Aseprite/LibreSprite
    ├── project.gpl
    ├── kalev.gpl
    ├── lena.gpl
    ├── mother.gpl
    ├── boy.gpl
    └── wolf.gpl
```

The `09-naming-conventions.md` filesystem table is amended in this slice to include the `source/` and `aseprite/` subfolders.

## Acceptance — every runtime sheet must pass

`tools/sprites/validate_sprite.py` enforces:

1. File exists and is PNG format.
2. Dimensions match the spec exactly (e.g., 320×768 for `kalev_locomotion_64x96.png`).
3. Mode is RGBA with explicit alpha channel.
4. ≤ 48 unique colors over the whole sheet.
5. Every opaque pixel is in the character's palette (exact RGB match).
6. ≥ 20% of pixels have alpha = 0 (genuinely transparent background and gutters).
7. No semi-transparent pixels (alpha ∈ {0, 255} only).
8. Each non-empty cell's bottom-most opaque pixel sits at `baseline-y` (default 84). Up to 2 cells per sheet may deviate — `sit`, `kneel`, and `downed` rows have authored alternate baselines per the Pass 2 / Pass 4 prompts.

Failure on any criterion blocks commit of the runtime sheet. The source sheet remains in `source/` regardless — it is reference, not deliverable.

## Workflow — three paths

### Path A — AI source, then pipeline

For sprites where an AI image model gives a usable silhouette but cannot meet the runtime container constraints:

```bash
# 1. Stage the source
cp ~/Downloads/some_ai_output.png \
   art/characters/kalev/source/kalev_idle_front_source.png

# 2. Run the pipeline
python3 tools/sprites/make_runtime_sprite.py \
    --source art/characters/kalev/source/kalev_idle_front_source.png \
    --output art/characters/kalev/sheets/kalev_idle_front_64x96.png \
    --palette kalev \
    --source-frames 4 --source-cols 4 --source-rows 1 \
    --target-cols 4 --target-rows 1 \
    --baseline-y 84

# 3. Validation runs automatically; output ends with PASS or FAIL.
# 4. If PASS, optionally open the runtime sheet in Aseprite for cleanup.
# 5. Commit source/ and sheets/ together so the conversion is reproducible.
```

### Path B — Aseprite native authoring

For sprites where a human pixel artist works directly at native canvas size:

```text
1. Load the character palette: File → Import → Palette → tools/sprites/palettes/kalev.gpl
2. Set sprite mode: Sprite → Properties → Color Mode → Indexed (locks palette)
3. Author at exactly 64×96 per frame on a sheet sized to the spec
4. Tag animations using Aseprite's animation tags (e.g., idle_down, walk_left)
5. Export: File → Export Sprite Sheet → PNG, target dimensions, no padding
6. Validate: python3 tools/sprites/validate_sprite.py --path ... --palette kalev ...
7. Save the .aseprite working file to art/characters/kalev/aseprite/
```

### Path C — Pipeline output, then Aseprite cleanup

For mixed workflow — let the pipeline do bulk work, then polish:

```text
1. Path A produces a passing runtime sheet
2. Open the runtime sheet in Aseprite
3. File → New from Pasted... or open directly; load the kalev.gpl palette
4. Switch to Indexed mode to lock the palette
5. Polish edges, hands, faces, micro-detail at native pixel size
6. Re-export to the same path as the runtime sheet
7. Re-validate to confirm color count and palette pinning held
```

This is the highest-fidelity path for hero assets like Kalev. Path A alone produces *correct* sheets but not always *beautiful* ones — the 8:1 downscale loses sub-pixel detail that an artist must restore.

### Path D — PixelLab / extension / manual-frame source intake

PixelLab REST output, the PixelLab Aseprite extension, future PixelLab MCP output,
and hand-curated frame folders are all treated as **source intake**. They are not
canonical runtime sheets until the same validator passes.

```text
PixelLab REST / PixelLab Aseprite extension / future MCP / manual PNG frames
                    ↓
 art/characters/<name>/_drafts/source_intake/<run_id>/
   ├── manifest.json       # sanitized provenance, prompt hash, job IDs, status
   ├── raw/                # downloaded/exported frames
   ├── normalized/         # spec-fitted 64×96 cells
   └── reports/            # assembly + validation evidence
                    ↓
       tools/sprites/runtime_sheet.py
                    ↓
       tools/sprites/validate_sprite.py
                    ↓
       art/characters/<name>/sheets/<name>_<pass>_<canvas>.png
```

Operational rules:

- Run `./tools/sprite pixellab generate <char> <pass> --dry-run` before a paid
  generation. Dry-run reports supported keys, unsupported keys, and job count
  without REST, download, or polling calls.
- Paid PixelLab create/generate paths write a pending source-intake manifest
  before the first paid POST. If the manifest cannot be written, the API call
  does not proceed.
- Manifests may store local artifact paths, request fingerprints, job IDs, prompt
  hashes, assembly reports, and validation evidence. They must not store
  `PIXELLAB_SECRET`, bearer/auth headers, full prompts, raw base64 images, or
  private frame URLs.
- The current PixelLab catalog maps idle/walk directions. Kalev care, tincture,
  and combat keys are explicit manual/template-TBD entries; they fail safely
  before paid/network calls until exact templates are chosen.
- Extension or web-UI frames should be named
  `<animation_key>_<frame_index>.png` and assembled via:

```bash
./tools/sprite pixellab assemble kalev locomotion /path/to/frames
./tools/sprite pixellab assemble kalev locomotion /path/to/extension-frames --adapter aseprite_extension
```

## Aseprite vs LibreSprite

Both work for this project. Recommendation:

| Tool | Cost | Recommendation |
|---|---|---|
| **Aseprite** | $20 USD one-time | Recommended for this project. Better animation tag system, native CLI for batch operations, GIF export, more polished UX, regular updates, mature scripting. The CLI alone (`aseprite -b --script`) is worth the price for automation. |
| **LibreSprite** | free | Adequate substitute. Fork from when Aseprite went closed-source (2016). Has most core features. Lags on newer animation/palette tooling and CLI maturity. |

If the project ships only a handful of sprite sheets, LibreSprite is fine. If the project needs scripted batch operations (export every animation tag as PNG, apply a palette across many files, generate GIF previews from .aseprite working files), Aseprite's CLI is worth $20.

Either tool reads the .gpl palette files in `tools/sprites/palettes/` directly.

## Aseprite CLI — useful commands

```bash
# Export a sprite sheet from an .aseprite file
aseprite -b art/characters/kalev/aseprite/kalev_locomotion.aseprite \
         --save-as art/characters/kalev/sheets/kalev_locomotion_64x96.png

# Export each animation tag as its own PNG
aseprite -b --split-tags \
         art/characters/kalev/aseprite/kalev_locomotion.aseprite \
         --save-as "art/characters/kalev/sheets/{tag}.png"

# Apply a palette and export
aseprite -b --palette tools/sprites/palettes/kalev.gpl \
         art/characters/kalev/aseprite/kalev_locomotion.aseprite \
         --save-as art/characters/kalev/sheets/kalev_locomotion_64x96.png

# Run a Lua script on a file (full automation)
aseprite -b --script tools/sprites/scripts/some_pass.lua input.aseprite
```

LibreSprite CLI exists but supports a smaller subset of these flags.

## What this slice changes about prior canon

- `09-naming-conventions.md` filesystem section is amended: `art/characters/<name>/` now includes `source/`, `sheets/`, and `aseprite/` subfolders. The `<character>_<purpose>_<canvas>.png` pattern lives under `sheets/`, not the character root.
- `01-kalev-runtime-sprite-plan-v0_1.md` Pass 1–4 outputs now explicitly target `art/characters/kalev/sheets/`. The Pass 1a smallest-viable-test target file is the AI-source output staged in `source/` and converted via `make_runtime_sprite.py`.
- The prompts under `prompts/01a-pass1*.md`, `prompts/02-lena-*.md`, etc. continue to specify runtime constraints. They are now understood as the **target** of the pipeline, not a guarantee that any single tool will hit them.
- Prior absolute language about "the model must produce a 320×768 RGBA PNG" is now scoped: the *runtime sheet* must hit those constraints; the *source sheet* may not, and that's why the pipeline exists.

## Project-spec amendment

```md
Generated character art may be accepted as a high-resolution source sheet.
Source sheets are not runtime assets; they live under art/characters/<name>/source/.

Every source sheet must pass through tools/sprites/make_runtime_sprite.py
before its output PNG enters art/characters/<name>/sheets/.

Runtime character sheets must:
- be PNG with RGBA mode
- have alpha=0 outside character pixels (genuinely transparent)
- contain ≤ 48 unique colors, all in the character's palette subset
- use 64×96 frames (or the character-specific canvas in 09-naming-conventions.md)
- anchor feet at y = 84 within each cell (or character-specific baseline)
- pass tools/sprites/validate_sprite.py
```

## CLI toolbelt — `./sprite`

The pipeline ships with a single CLI entrypoint at `tools/sprite` (project-root executable). All commands resolve dimensions, palette, baseline, and grid shape from `tools/sprites/specs/<character>.json` — no flags needed for routine use.

| Command | Purpose |
|---|---|
| `./tools/sprite list` | Show every character × pass and which sheets exist. |
| `./tools/sprite diagnose` | Check Python / Pillow / Aseprite locations. |
| `./tools/sprite watch` | Auto-route `~/Downloads/<character>_<pass>.png` drops through the pipeline. Polls; Ctrl+C to stop. |
| `./tools/sprite ingest <file> <char> <pass>` | Manual ingest — copy any file into `source/`. |
| `./tools/sprite convert <char> <pass>` | Source → runtime; auto-runs preview on PASS. |
| `./tools/sprite validate <char> <pass>` | Standalone acceptance check. |
| `./tools/sprite preview <char> <pass>` | GIF per animation row + 4× nearest-neighbor zoom PNG under `art/characters/<char>/preview/`. |
| `./tools/sprite compare <char> <pass>` | Side-by-side source/runtime polish board. |
| `./tools/sprite polish <char> <pass>` | Open the runtime sheet in Aseprite with the character palette pre-loaded. |
| `./tools/sprite aseprite-watch` | Auto-export + validate when an `.aseprite` working file is saved. |
| `./tools/sprite health` | Project-wide validation summary table. |
| `./tools/sprite catalog` | Generate `art/characters/index.html` visual dashboard. |
| `./tools/sprite path <char> <pass> <kind>` | Print spec-backed canonical paths for scripts/hooks. |
| `./tools/sprite metadata <char> <pass>` | Print spec-backed JSON for Aseprite automation. |
| `./tools/sprite aseprite-run <script> <char> <pass>` | Run a project Lua script through `aseprite -b --script ...` with script params. |
| `./tools/sprite scaffold <new-char>` | Bootstrap folders + spec stub for a new character. |

The Aseprite-side automation lives in `tools/sprites/aseprite_scripts/` (`load_palette.lua`, `export_with_validation.lua`, `baseline_overlay.lua`, `add_hair_canopy.lua`, `mirror_left_to_right.lua`, `shrink_or_lift_cell.lua`, `auto_tag_animations.lua`, and shared `tom_sprite_lib.lua`). Install per `tools/sprites/aseprite_scripts/INSTALL.md` and bind hotkeys for in-editor polish/export/validate without leaving Aseprite.

## Per-character spec format

`tools/sprites/specs/<name>.json` declares each character's pipeline:

```json
{
  "name": "kalev",
  "palette": "kalev",
  "default_frame_w": 64,
  "default_frame_h": 96,
  "default_baseline_y": 84,
  "passes": {
    "idle_front": {
      "description": "Pass 1a — 4-frame idle_down breath cycle.",
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

Each pass is a runtime-sheet target. Source layout (`source_cols × source_rows × source_frames`) and target layout (`target_cols × target_rows`) may differ — the conversion handles re-layout. Per-pass overrides for `frame_w`, `frame_h`, `baseline_y` work where animations need different anchors (e.g., Pass 4's `downed` row).

## Filename conventions for the watcher

Drop a PNG in `~/Downloads` whose filename starts with `<character>_<pass>`:

| Filename | Routes to |
|---|---|
| `kalev_idle_front.png` | kalev / idle_front |
| `kalev_idle_front_attempt3.png` | kalev / idle_front (suffix ignored) |
| `kalev_locomotion_64x96.png` | kalev / locomotion |
| `wolf_full_sheet.png` | wolf / full_sheet |
| `unknown_thing.png` | skipped (logged) |

The watcher also archives a timestamped copy under `art/characters/<name>/source/attempts/` for iteration history before staging the canonical source filename.

## Palette discipline note

When introducing a new character or canvas, the per-character palette subset in `tools/sprites/palette.py` must include skin / face mid-tones if the character is human. RGB nearest-neighbor quantization will otherwise snap warm skin pixels to whatever's closest — and ember-red is closer to warm tan than damp-ash is. The Kalev palette includes `old-ochre #B08A4A` for this reason; Lena, Mother, Boy palettes follow the same rule.

To verify a palette is sufficient: convert a source, view the 4× zoom preview, and check whether faces / hands quantize to a palette token that reads as skin.

## Acceptance

This slice is accepted when:

1. `tools/sprites/{palette.py, make_runtime_sprite.py, validate_sprite.py, cli.py, _common.py}` exist and are runnable.
2. `tools/sprites/palettes/*.gpl` cover project + Kalev/Lena/Mother/Boy/Wolf with skin mid-tones included for human characters.
3. `tools/sprite` CLI wrapper is executable from the project root.
4. Per-character specs at `tools/sprites/specs/*.json` cover every character whose runtime sheets are scoped.
5. At least one runtime sheet has been produced via the pipeline and passes validation. (Verified: `art/characters/kalev/sheets/kalev_idle_front_64x96.png` produced from a 2048×768 AI source, 10 unique colors, 64% transparent, baseline y=84 across all 4 cells, palette pinned to kalev.)
6. Folder structure under `art/characters/<name>/` follows the `source / sheets / aseprite / preview` split.
7. `09-naming-conventions.md` amended to reflect the subfolder split.
8. Aseprite Lua scripts (`load_palette.lua`, `export_with_validation.lua`, baseline overlay, hair canopy, row mirror, cell nudge/scale, timeline tagging) are installable and documented in `tools/sprites/aseprite_scripts/INSTALL.md`.
9. `./sprite health` and `./sprite catalog` produce useful output without errors.
10. Contributors and AI agents introducing new sprite art use this pipeline rather than expecting any single tool to produce drop-in runtime PNGs.
