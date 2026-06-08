# Aseprite scripts — installation

Project Lua scripts live here:

| Script | Purpose |
|---|---|
| `load_palette.lua` | Loads the right project palette (`kalev.gpl`, `lena.gpl`, etc.) into the active sprite based on its file path. |
| `export_with_validation.lua` | Resolves the spec-backed runtime path, hides `TOM ...` helper layers, saves/exports the runtime PNG, and runs `./tools/sprite validate` automatically. |
| `baseline_overlay.lua` | Toggles a temporary baseline/grid guide layer. |
| `add_hair_canopy.lua` | Adds conservative hair volume above the top silhouette for selected rows/cells. |
| `mirror_left_to_right.lua` | Mirrors a source row into a target row, one cell at a time. |
| `shrink_or_lift_cell.lua` | Nudges and optionally scales selected cells. |
| `auto_tag_animations.lua` | Creates timeline tags from `animation_keys` when the file is frame-based; sets grid/timing on flat sheets. |
| `tom_sprite_lib.lua` | Shared helper loaded by the scripts; install it too, but don't bind it to a hotkey. |

## Install

1. In Aseprite: **File → Scripts → Open Scripts Folder**. This opens your local Aseprite scripts directory.
2. Copy or symlink every top-level `.lua` file from `tools/sprites/aseprite_scripts/` into that folder.

   ```bash
   ASE_SCRIPTS="$HOME/.config/aseprite/scripts"   # Linux
   # macOS: ~/Library/Application Support/Aseprite/scripts
   # Windows: %APPDATA%/Aseprite/scripts
   for f in "$(pwd)"/tools/sprites/aseprite_scripts/*.lua; do
     ln -sf "$f" "$ASE_SCRIPTS/"
   done
   ```

3. In Aseprite: **File → Scripts → Rescan Scripts Folder**.

## Use

### load_palette
- Open any sprite under `art/characters/<character>/...`
- Run **File → Scripts → load_palette**
- The palette for that character (or `project` as fallback) is applied in place.

### export_with_validation
- Open a working file under `art/characters/<character>/aseprite/<character>_<pass>.aseprite`
- Edit the sprite as needed
- Run **File → Scripts → export_with_validation** (or bind a hotkey)
- A PNG is saved to the canonical `sheets/` path
- The Python validator runs and a dialog reports PASS or FAIL with details

Pass names with underscores (for example `idle_front`) are supported as long as the
filename follows `<character>_<pass>.aseprite`.

### baseline_overlay
- Run once to add the temporary guide layer.
- Run again to remove it.
- The layer is named `TOM baseline overlay`; `export_with_validation` hides `TOM ...`
  helper layers before exporting.

### add_hair_canopy
- Run on a flat runtime sheet when hair/head volume is too low after conversion.
- Batch example:

  ```bash
  ./tools/sprite aseprite-run add_hair_canopy kalev idle_front \
    --output /tmp/kalev_hair.png \
    --param rows=idle_down \
    --param height=4
  ```

### mirror_left_to_right
- Use when left/right silhouettes can share structure.
- Params: `from=<row-name-or-index>` and `to=<row-name-or-index>`.
- Example: `--param from=idle_left --param to=idle_right`.

### shrink_or_lift_cell
- Use for small anchor corrections without marquee-selection work.
- Params: `rows=...`, `cols=...`, `dx=<px>`, `dy=<px>`, `scale=<percent>`.
- Example: `--param rows=idle_down --param cols=0 --param dy=-2`.

### auto_tag_animations
- On a frame-based `.aseprite`, creates one tag per `animation_keys` row and sets FPS.
- On a flat sheet, sets the Aseprite grid to the spec cell size and explains that
  timeline tags require a frame-based document.

## Hotkey suggestions

In Aseprite: **Edit → Keyboard Shortcuts**.

- `load_palette` → `Ctrl+Alt+P`
- `export_with_validation` → `Ctrl+Alt+E`
- `baseline_overlay` → `Ctrl+Alt+B`
- `add_hair_canopy` → `Ctrl+Alt+H`
- `mirror_left_to_right` → `Ctrl+Alt+M`
- `shrink_or_lift_cell` → `Ctrl+Alt+N`
- `auto_tag_animations` → `Ctrl+Alt+T`

These coexist cleanly with Aseprite defaults.

## Alternative: external watcher

If you prefer not to install scripts, run `./sprite aseprite-watch` in a terminal. It detects when any `.aseprite` file under `art/characters/*/aseprite/` is saved and exports + validates externally. Same effect; no Aseprite hotkey needed.
