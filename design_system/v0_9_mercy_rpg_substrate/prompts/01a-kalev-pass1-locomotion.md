# Sprite-sheet prompt — Kalev · Pass 1 · Locomotion lock

Status: active authoring prompt
Owner lane: art direction + production
Sheet target: `art/characters/kalev/sheets/kalev_locomotion_64x96.png`
Pass purpose: lock scale, silhouette, palette, baseline, Godot slicing, and 1×/2× readability before any other animation is authored. This is the anchor pass — everything else inherits from it.
Plan reference: `01-kalev-runtime-sprite-plan-v0_1.md`

The deliverable is **native pixel art at 64×96** in a 5×8 grid. Source IS the runtime sheet — drop directly into `SpriteFrames` without further processing.

## Prompt

```text
You are producing Pass 1 of the runtime sprite sheet for Kalev Ward, the player character of *Tincture of Mercy: The Garments of Skin* — a combat-capable mercy RPG vertical slice in Godot 4.6 / C# / Forward+. This is the anchor pass: every later pass and every other character inherits this sheet's scale, palette, and baseline discipline.

Pass 1 covers locomotion only — idle and walk in four directions. Do not include care, tincture, or combat poses; those are later passes with separate sheets.

CHARACTER
- Kalev Ward, age 33, former critical-care nurse turned burdened healer-apothecary.
- The sprite reads tired, grave, competent, human. Not a hero. Not a victim.
- Silhouette laws (must read at 2× zoom):
  · long weathered cedar-brown coat to mid-thigh
  · scarf / collar mass framing the face
  · medicine pouch on right hip (rot-brown leather)
  · leather notebook in left hand on idle frames; lightly visible during walk
  · small cedar dog charm — visible as a 2×2 pixel cluster at 2×, not a glow
  · small restrained tincture vial inside pouch — not visible in idle/walk frames
  · practical boots and gloves
  · burdened shoulders, never hero stance
- Avoid: weapons, combat swagger, fantasy armor, neon glow, clean sci-fi medic colors, cozy-village brightness, glamour lighting.

CANVAS
- 64×96 pixels per frame, native authoring (no upscale, no downscale, no chroma background).
- 5 columns × 8 rows = 320 px wide × 768 px tall, transparent PNG, RGBA.
- No background, no grid lines, no labels, no guide rulers.
- Feet baseline y = 84 in EVERY cell (project-wide Godot anchor).
- Center of mass x = 32 (frame center).
- ≥ 4 px gutter from frame edges to silhouette — no character pixels touch the frame border.

ANIMATION ROWS (top to bottom)
  Row 0: idle_down  — 5 frames, slow breath cycle, 1 px chest rise, no overshoot, no idle fidget
  Row 1: walk_down  — 5 frames, heavy but playable; weight on planted foot; coat sways 1–2 px on opposite phase
  Row 2: idle_left  — 5 frames, same breath cycle, profile silhouette
  Row 3: walk_left  — 5 frames, profile gait; visible coat fold change; pouch rocks 1 px
  Row 4: idle_up    — 5 frames, same breath cycle, back silhouette; notebook hand visible at left edge of body
  Row 5: walk_up    — 5 frames, same gait pattern from behind
  Row 6: idle_right — 5 frames, same breath cycle, profile silhouette mirrored from row 2 (idle_left)
  Row 7: walk_right — 5 frames, mirrored from row 3 (walk_left)
- Walk cycles loop on frame 5 returning to frame 1 cleanly (no jitter on loop).
- If a 4-frame cycle is preferred, repeat frame 1 in cell 5 — every cell must be filled.

PER-CELL FRAMING PARITY (hard constraints)
- Figure heights (top-of-hair pixel to bottom-of-feet pixel) within ±1 px across all 40 cells. Front, profile, and back figures are the same height.
- Bottom-of-feet pixel sits on y = 84 in every cell. No per-cell baseline drift.
- Head proportion parity: head (top-of-hair to chin/jawline, BEFORE the scarf collar) is 18–22% of figure height in EVERY direction. Profile and back rows MUST show a clear hair canopy above the scarf. Do NOT merge the head silhouette into the scarf in any view.
- ≥ 4 px gutter from frame edges to silhouette. Ground-level shadow staying within the cell is OK; bleed into adjacent cells is not.

PIXEL-ART RIGOR
- Author every pixel natively at 64×96. No upscale-and-clean. No downscale-and-process. No chroma background.
- One-pixel solid outline in ink (#1A1612). No anti-aliasing on silhouette. No semi-transparent silhouette pixels.
- ≤ 24 unique colors per frame; ≤ 48 unique colors over the whole sheet.
- Dither: 1px or 2px ordered only, on coat folds and scarf shadow. Never spray noise.
- 12fps cycle. Walk cycles loop on frame 5 returning to frame 1 cleanly (no jitter on loop).

PALETTE (use these tokens; do not introduce others)
- Coat / pouch / boots:   cedar-brown #6B4A2C · rot-brown #4A3A26 · ink #1A1612
- Skin / face:            vellum-warm #EFE6D0 (highlight) · damp-ash #6B6358 (shade) · ink-soft #2B2520 (line) · old-ochre #B08A4A (mid-tone)
- Cloth / scarf:          pine-shadow #2A3329 · damp-ash #6B6358 · candle-white #F6F1E0 (small highlight)
- Notebook (in left hand): vellum-bone #E8DFC9 (page edge) · ink #1A1612 (cover spine)
- Cedar dog charm:        cedar-brown #6B4A2C (matte; no gold)

OUTPUT
- File: `art/characters/kalev/sheets/kalev_locomotion_64x96.png`
- One transparent-PNG sprite sheet meeting every constraint above.
- Empty cells fully transparent (alpha 0, all channels). Background everywhere is alpha 0 — no key color.

ACCEPTANCE (artist self-checks before delivery)
1. Sheet is exactly 320 × 768 px, RGBA, transparent background.
2. Every frame's feet sit on y = 84 within its cell (drop a horizontal guideline at y=84 — every figure's bottom pixel touches it).
3. Figure heights (top-of-hair to bottom-of-feet) within ±1 px across all 40 cells (drop a horizontal guideline at the head crown row — every figure's top pixel touches it).
4. ≤ 48 unique colors over the whole sheet (verifiable by histogram).
5. Silhouette is single-pixel outlined; no semi-transparent silhouette pixels.
6. Heads occupy 18–22% of figure height in every direction. Profile and back rows show a hair canopy above the scarf collar.
7. At 1× pixel scale, a single 64×96 cell is recognizable as Kalev: long coat, pouch on right hip, notebook in left hand, scarf/collar, burdened posture.
8. Walk cycles loop cleanly: frame 5 → frame 1 transition has no anchor jitter, no foot pop, no coat snap.
9. Coat color is pixel-identical across all 8 rows.

REFERENCES (silhouette and accessory guide ONLY; do not trace; do not downscale)
- `art/characters/kalev/kalev_design_asset.png` — concept reference (1122×1402; concept-only)
- `design_system/v0_8_1/kalev/templates/kalev_full_sheet_64x96_BLANK_TRANSPARENT_TEMPLATE.png` — empty 320×768 canvas; author rows 0–7 directly on this
- `design_system/colors_and_type.css` — palette tokens (use the hex codes above; the css file is the source of truth if they ever drift)
- `design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md` — locomotion is required by all five acts

Do not imitate any living artist. Return one transparent PNG at exactly 320 × 768.
```

## After this pass lands

1. Drop the delivered PNG into `art/characters/kalev/sheets/kalev_locomotion_64x96.png` (or `./tools/sprite ingest <delivered>.png kalev locomotion --then-convert` if it lands elsewhere).
2. Run validation:
   ```bash
   ./tools/sprite validate kalev locomotion
   ```
   Expect PASS — 320×768, ≤ 48 colors, palette-pinned, baselines on y=84.
3. Generate previews and visual review:
   ```bash
   ./tools/sprite preview kalev locomotion
   ```
4. Import into Godot; verify `flags/filter=false`, `flags/mipmaps=false` in the auto-generated `.import` file.
5. Stub `kalev_frames.tres` with these 8 animation rows; carve `Rect2(col*64, row*96, 64, 96)` regions.
6. Add `kalev.tscn` with `AnimatedSprite2D` referencing `kalev_frames.tres`; play `idle_down` and walk through all four directions.
7. Walk Kalev across a 32×32 tile graybox; confirm feet sit on tile baseline.
8. Confirm coat / face / pouch palette before authoring Pass 2 — Pass 2 must use pixel-identical colors.

Only after Pass 1 acceptance fully clears does Pass 2 begin.
