# Kalev Runtime Sprite Production Plan · v0.1

Status: active production plan
Owner lane: art direction + production + Godot integration
Authority level: active for the Kalev anchor-asset production pass and the pipeline pattern every other character will inherit
Dependencies: `design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md`, `design_system/v0_9_mercy_rpg_substrate/04-latent-paths-receptivity.md`, `design_system/v0_9_mercy_rpg_substrate/09-naming-conventions.md`, `design_system/v0_8_1/godot_asset_manifest_v0_8_1.md` §6.2 (provenance)
Replaces: `01z-kalev-full-sheet-v0_3-reference.md` (kept as reference; the v0.3 single-sheet approach is superseded by pass-slicing)
Validation gate: each pass passes the verification helper before the next pass begins

## Why Kalev first

Kalev is the anchor asset, not the easiest one. If his scale, silhouette, palette, animation density, and Godot import pattern are solved first, every other character inherits a working pipeline. The wolf prompt revealed the production truth: concept art is easy to accumulate; runtime-ready game art needs a pipeline. We are not generating another beautiful high-resolution concept sheet. We are creating a native runtime sprite production packet, drop-in for Godot.

## Why pass-sliced

The v0.3 prompt asks for 14 rows of Kalev in one pass — 56+ frames covering idle, walk, write, administer, wash, warm, sit, kneel. That is too much surface to land correctly on the first try. A pass-sliced approach lets us:

- Lock scale, silhouette, palette, baseline, and Godot slicing on a small surface (Pass 1).
- Iterate without throwing away work — each pass is a separate sheet that drops into `SpriteFrames` independently.
- Stop at any point with a usable subset (Pass 1 alone is already enough to walk Kalev around a graybox).
- Catch divergence early — palette or proportion drift in 8 rows is recoverable; in 14 it is not.

## Pass structure

Each pass produces its own sheet at native 64×96 frame size, 5 columns, with baseline y = 84 consistent across all passes. Sheets load independently in Godot; one `SpriteFrames` resource references frames from all of them.

| Pass | Sheet | Rows | Sheet dims | Used / total cells | Proves | Prompt |
|---|---|---|---|---|---|---|
| **1 — Locomotion lock** | `kalev_locomotion_64x96.png` | idle ×4dir, walk ×4dir | 320 × 768 | 32 / 40 | scale · silhouette · palette · baseline · Godot slicing · 1× / 2× readability | `01a-kalev-pass1-locomotion.md` |
| **2 — Care verbs** | `kalev_care_64x96.png` | write_name, wash, warm, sit, kneel | 320 × 480 | 15 / 25 | the actual mercy-game identity — bedside posture and hand discipline | `01b-kalev-pass2-care.md` |
| **3 — Tincture / danger** | `kalev_tincture_64x96.png` | administer_ember, self_administer, recoil_neutral | 320 × 288 | 13 / 15 | Act 3/4/5 emotional + mechanical bridge; FSR/Vigil cooldown surface; tremor-shader base | `01c-kalev-pass3-tincture-danger.md` |
| **4 — Combat compatibility** | `kalev_combat_64x96.png` | hurt, dodge_brace, push_guard, downed | 320 × 384 | 13 / 20 | Act 5 protection verbs; Kalev as a real body in a violent encounter; downed-state for tuning | `01d-kalev-pass4-combat.md` |

**Total frames across 4 passes: 73**, distributed across 4 small sheets that can be authored, reviewed, and corrected independently.

## Target file layout

```
art/characters/kalev/
├── kalev_design_asset.png          (concept reference; not runtime; do not edit)
├── animations/                     (v0.8.1 early animation passes; provenance only)
│   └── ...
└── sheets/
    ├── kalev_locomotion_64x96.png  (Pass 1)
    ├── kalev_care_64x96.png        (Pass 2)
    ├── kalev_tincture_64x96.png    (Pass 3)
    └── kalev_combat_64x96.png      (Pass 4)

scenes/characters/kalev/
└── kalev.tscn                      (AnimatedSprite2D + KalevPlayer C# script)

data/sprite_frames/
└── kalev_frames.tres               (SpriteFrames resource referencing all four sheets)
```

All paths follow the project Godot naming conventions in `09-naming-conventions.md`.

## Silhouette laws (consolidated; same across all passes)

- Long weathered cedar-brown coat to mid-thigh
- Scarf / collar mass framing the face
- Medicine pouch on right hip (rot-brown leather)
- Leather notebook in left hand on idle frames; tucked into pouch when both hands occupied (administer, wash, push_guard)
- Small cedar dog charm — visible as a 2×2 pixel cluster at 2×, never a glow
- Small restrained tincture vial — single ember-red glint only when the vial is actively out (administer_ember, self_administer)
- Practical boots and gloves
- Burdened shoulders, never hero stance

**Avoid across all passes:** weapons, combat swagger, fantasy armor, neon glow, clean sci-fi medic colors, cozy-village brightness, glamour lighting, anti-aliased silhouette edges.

## Palette (consolidated; pin to these exact tokens)

| Surface | Tokens |
|---|---|
| Coat / pouch / boots | cedar-brown #6B4A2C · rot-brown #4A3A26 · ink #1A1612 |
| Skin / face | vellum-warm #EFE6D0 (highlight) · damp-ash #6B6358 (shade) · ink-soft #2B2520 (line) |
| Cloth / scarf | pine-shadow #2A3329 · damp-ash #6B6358 · candle-white #F6F1E0 (small highlight) |
| Notebook | vellum-bone #E8DFC9 (page) · ink #1A1612 (cover) |
| Cedar dog charm | cedar-brown #6B4A2C (matte; no gold paint into base sprite) |
| Tincture vial | ember-red #C63E1F (≤ 4 px visible) · vellum-bone #E8DFC9 (glass) |
| Earned colors (gold #C79A3A, ember-glow #E26A3A) | runtime-only via shader/light, never painted into base sprite |

**Color budget per sheet:** ≤ 24 unique colors per frame; ≤ 48 unique colors across the sheet. Cross-sheet consistency: identical colors on Kalev's coat in Pass 1 and Pass 4 — no per-pass palette drift.

## Frame anchoring

- Frame size: 64 × 96 pixels
- Feet baseline: y = 84 (same across all passes; Godot collision shapes anchor here)
- Center of mass: x = 32 (frame center)
- Empty cells: fully transparent (alpha 0, all channels)
- Padding inside frame: ≥ 4 px gutter from frame edges to silhouette (no character pixels touch frame border)

## Godot import notes

When sheets land in `art/characters/kalev/sheets/`, Godot will auto-generate `.import` files. Verify these settings on each:

| Setting | Required value |
|---|---|
| `compress/mode` | Lossless |
| `compress/lossy_quality` | n/a |
| `flags/filter` | **false** (Nearest) |
| `flags/mipmaps` | **false** |
| `flags/anisotropic` | false |
| `flags/srgb` | Disabled (2D pixel art) |
| `process/fix_alpha_border` | true |
| `process/premult_alpha` | false |
| `detect_3d/compress_to` | n/a |

The `.import` file will look like:

```ini
[remap]
importer="texture"
type="CompressedTexture2D"

[params]
compress/mode=0
flags/filter=false
flags/mipmaps=false
flags/anisotropic=false
flags/srgb=2
process/fix_alpha_border=true
```

The `SpriteFrames` resource (`data/sprite_frames/kalev_frames.tres`) references frames using `Rect2(x, y, 64, 96)` regions across the four sheet textures. Animation names follow snake_case (`idle_down`, `walk_left`, `write_name`, `administer_ember`, `hurt`, `downed`).

## Acceptance — per pass

Each pass must pass before the next begins:

1. Sheet dimensions exactly match the pass spec (no padding pixels).
2. Every frame's feet sit on y = 84.
3. Color count over the sheet ≤ 48 (verifiable by histogram).
4. Single-pixel ink outline; no semi-transparent silhouette pixels.
5. Silhouette laws read at 1× zoom for at least one cell per row.
6. Palette tokens are exact hex values from the table above; no introduced colors.
7. Empty cells fully transparent.
8. Cross-pass consistency: colors used on Kalev's coat / face / pouch are identical across this pass and any previously landed pass.

## Acceptance — overall (all four passes complete)

1. All four sheets present at the target paths.
2. `data/sprite_frames/kalev_frames.tres` references every animation row across all sheets with correct `Rect2` regions.
3. Test scene (`scenes/characters/kalev/kalev.tscn`) plays every animation cleanly.
4. At 2× zoom in Godot's editor, a graybox scene with Kalev walking on a 32×32 tile floor reads as the v0.9 design intent: burdened, competent, weighted to the ground.
5. The four sheets together cover every animation referenced by the opening five-act bible.

## Validation script

Run after each pass lands. Verifies dimensions, mode, transparency, color count.

```python
from PIL import Image
from pathlib import Path

PASSES = {
    'art/characters/kalev/sheets/kalev_locomotion_64x96.png': (320, 768, 48),
    'art/characters/kalev/sheets/kalev_care_64x96.png':       (320, 480, 48),
    'art/characters/kalev/sheets/kalev_tincture_64x96.png':   (320, 288, 48),
    'art/characters/kalev/sheets/kalev_combat_64x96.png':     (320, 384, 48),
}

def check(rel_path, expected_w, expected_h, max_colors):
    p = Path(rel_path)
    if not p.exists():
        return f'{rel_path}: MISSING'
    with Image.open(p) as im:
        if im.size != (expected_w, expected_h):
            return f'{rel_path}: WRONG SIZE {im.size} expected {(expected_w, expected_h)}'
        if im.mode != 'RGBA':
            return f'{rel_path}: WRONG MODE {im.mode} expected RGBA'
        colors = im.getcolors(maxcolors=10_000)
        unique = len(colors) if colors else None
        if unique is None or unique > max_colors:
            return f'{rel_path}: COLOR FAIL {unique} > {max_colors}'
        return f'{rel_path}: OK {im.size} {unique} colors'

for path, (w, h, c) in PASSES.items():
    print(check(path, w, h, c))
```

## "Is this actually usable?" checklist

Before declaring a pass shipped, walk through:

- [ ] Drop the sheet into `art/characters/kalev/sheets/` — does Godot auto-import with Nearest filter and mipmaps off?
- [ ] Open `kalev_frames.tres` — can you carve `Rect2` regions cleanly on the 64×96 grid without sub-pixel offsets?
- [ ] Add to `kalev.tscn` — does `AnimatedSprite2D.play("idle_down")` cycle without flicker?
- [ ] Set zoom to 2× — does the silhouette read?
- [ ] Set zoom to 1× — is the character still recognizable?
- [ ] Walk Kalev across a 32×32 tile floor — do feet sit on the tile baseline without floating or sinking?
- [ ] Compare a Pass 1 coat color to a Pass 4 coat color — pixel-identical?
- [ ] Run the validation script — green across the board?

If any answer is no, the sheet is not yet shipped. Iterate before moving to the next pass.

## Workflow recommendation

For each pass, in order:

1. **Author** — human pixel artist using the pass prompt, or a specialist pixel-art tool (Aseprite + ML plugin, PixelLab, Pixaki, Retro Diffusion at native target). General-purpose image models will produce pixel-art-styled illustrations that fail color-budget and outline acceptance — avoid them for runtime sprites.
2. **Validate** — run the Pillow script above.
3. **Import** — drop into `art/characters/kalev/sheets/`; verify `.import` settings.
4. **Wire** — add animation rows to `kalev_frames.tres`.
5. **Test** — graybox scene, walk it, watch for tile-baseline drift, palette mismatch, anchor wobble.
6. **Commit** — only after the "actually usable?" checklist clears.
7. **Move to next pass.**

If a pass fails any acceptance, fix it before the next pass starts. Pass-slicing only saves time when the discipline holds.

## Caveat about generative tools (carried forward from prior audit)

General image models (Midjourney, DALL·E, SDXL base, base diffusion variants) consistently produce *pixel-art-styled illustrations* at high resolution. They do not author native-resolution pixel art with palette discipline and single-pixel outlines. They will fail acceptance criteria 3 and 4 reliably. For runtime sprites, prefer specialist pixel-art workflows or human pixel artists.

A multimodal LLM with an image-manipulation tool (e.g., Pillow) can post-process a model output by clamping to the project palette and snapping outlines, but this is a salvage operation, not a primary workflow.

## Next artifact

When this plan is approved, ship `kalev_locomotion_64x96.png` first using `01a-kalev-pass1-locomotion.md`. Validate, import, wire, test, commit. Then Pass 2.
