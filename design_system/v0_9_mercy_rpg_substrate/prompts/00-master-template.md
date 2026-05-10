# Sprite-sheet prompt — master template

Status: active authoring template
Owner lane: art direction + production
Authority level: active for v0.9 sprite-sheet authoring prompts
Dependencies: `design_system/v0_8_1/godot_asset_manifest_v0_8_1.md` (sprite manifest contract still active under v0.9 visual law), `design_system/colors_and_type.css`, `design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md`

This template produces a runtime sprite sheet that drops directly into Godot `SpriteFrames` resources. Fill in every `[BRACKET]` per character. Do not relax the pixel-art-rigor or palette sections — they are the project visual lock.

## Template

```text
You are producing a runtime sprite sheet for *Tincture of Mercy: The Garments of Skin* — a combat-capable mercy RPG vertical slice in Godot 4.6 / C# / Forward+. Authoring rules below are non-negotiable; the resulting PNG must drop into `SpriteFrames` without further processing.

CHARACTER
- Name: [CHARACTER NAME]
- Role: [PC | companion | bedside patient | hostile encounter actor]
- Active in: [Act 1 Water | Act 2 Bread | Act 3 Tincture | Act 4 Mother death/Witness | Act 5 Wolves | post-opening]
- Silhouette laws (must read at 2× zoom): [list 4–8 specific identifiers]
- Avoid silhouette drift: [list]

CANVAS
- Native frame size: [64×96 | 48×64 | 48×72 | 96×48 | 96×64 | 128×64] pixels per frame
- Sheet layout: [N] columns × [N] rows. Each row is one animation. Each cell is exactly one frame.
- Total sheet dimensions: [columns × frame_width] × [rows × frame_height] px
- Format: transparent PNG, RGBA, 8-bit per channel
- No background, no grid lines, no labels, no guide rulers, no concept-sheet decoration
- Feet baseline: y = [frame_height − 12] consistent across all frames so Godot anchor stays put

ANIMATION ROWS (top to bottom)
[Row index, animation_name, frame_count, motion notes]

PIXEL-ART RIGOR (hard constraints)
- Hand-author every pixel at native size. Do NOT upscale a sketch and clean it up. Do NOT downscale an illustration with bilinear/bicubic and post-process.
- Edges: hard, single-pixel outlines in ink (#1A1612). No anti-aliasing on silhouette. No semi-transparent pixels except for authored shadow/hair-tip opacity.
- Color budget: ≤ 24 unique colors per frame, ≤ 48 unique colors across the whole sheet.
- Dither: 1px or 2px ordered only, where cloth folds, hair, or hearth-light demand. Never spray noise.
- Sub-pixel detail: avoid lone single pixels on flat planes. Group features into 2×2 minimum clusters where possible.
- Animation cadence: keyframes only — fewer, better frames. Hold 100–160ms; 12fps cycle target.

PALETTE (pin to these exact hex; substitute or extend only when noted)
Manuscript / paper       ink #1A1612 · ink-soft #2B2520 · damp-ash #6B6358 · vellum-bone #E8DFC9 · vellum-warm #EFE6D0 · candle-white #F6F1E0
Cold Michigan            lake-slate #5B6770 · lake-deep #2C3540 · pine-shadow #2A3329 · rot-brown #4A3A26 · cedar-brown #6B4A2C · old-ochre #B08A4A
Healing                  pale-heal #7A8C5E · pale-heal-deep #5A6B48 · verdigris #6E8A7C
Earned (sparing)         icon-gold #C79A3A · icon-gold-warm #D9B057 · dragon-red #8A2018 · ember-red #C63E1F · ember-glow #E26A3A
Wittehaven (later)       witte-white #F4F6F7 · witte-blue #D5DEE4 · witte-cool #8FA3B0
Avoid: bright fantasy saturation, neon, clean sci-fi medic teal, shiny armor highlights, cozy-village warmth.

OUTPUT
- File path: `[res://art/characters/CHARACTER_DIR/CHARACTER_full_sheet_WxH.png]`
- One PNG. No alts, no annotation overlay, no reference tile.
- Empty cells fully transparent (alpha 0, all channels).

ACCEPTANCE (self-check before returning)
1. Total dimensions equal columns×frame_width by rows×frame_height exactly. No padding pixels.
2. Each frame's character feet (or anchor) sit on y = [frame_height − 12] within its cell.
3. Unique color count over the whole sheet ≤ 48 (verifiable by histogram).
4. Outline is one-pixel solid; no semi-transparent silhouette pixels.
5. The character is recognizable at native size without zoom — view a single cell at 1× and confirm silhouette laws still read.
6. PNG is RGBA with explicit transparency, not a flattened image with a key color.

REFERENCES (for tone, not imitation)
- Project concept reference for this character: `[path/to/design_asset.png]` — silhouette + accessory guide ONLY; do not trace; do not downscale.
- Project palette and type system: `design_system/colors_and_type.css`.
- Active design canon: `design_system/v0_9_mercy_rpg_substrate/INDEX.md`.
- Visual provenance: `design_system/v0_8_1/aesthetic_bible_v0_8_1.md`.

Do not imitate any living artist. Produce one transparent-PNG sprite sheet meeting every constraint above.
```

## Why these constraints

| Constraint | Reason |
|---|---|
| Native canvas authoring | Downscaled illustrations have anti-aliased edges and uncontrolled palettes; they degrade the moment Godot scales them with a nearest filter. |
| ≤ 48 colors / sheet | Forces deliberate value structure; matches the "icon-manuscript" tone where every color carries meaning. |
| Single-pixel ink outline | Reads cleanly at 2× zoom and keeps silhouettes legible against the cold Michigan world palette. |
| 12fps, fewer-better keyframes | Ships within a small-team production budget; the contemplative pace fits the project. |
| Feet baseline at y = h−12 | Godot collision shapes and floor anchoring stay consistent across animations and characters. |

## Tooling guidance

General-purpose image models (Midjourney, DALL·E, SDXL base) consistently produce *pixel-art-styled illustrations* at high resolution rather than native-resolution pixel art. They will fail acceptance criterion 3 (color count) and criterion 4 (single-pixel outline). Prefer one of:

1. A multimodal LLM with a Pillow / image tool, instructed to author at native size with a palette-clamp step.
2. Aseprite + a pixel-art-tuned ML plugin (artist stays in the loop on edges and color budget).
3. A specialist pixel-art model (PixelLab, Pixaki, Retro Diffusion at small native target).
4. A human pixel artist using this prompt + the existing `design_system/v0_8_1/kalev/templates/` blank canvas.
