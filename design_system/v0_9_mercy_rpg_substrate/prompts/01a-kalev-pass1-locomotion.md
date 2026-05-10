# Sprite-sheet prompt — Kalev · Pass 1 · Locomotion lock

Status: active authoring prompt
Owner lane: art direction + production
Sheet target: `art/characters/kalev/sheets/kalev_locomotion_64x96.png`
Pass purpose: lock scale, silhouette, palette, baseline, Godot slicing, and 1×/2× readability before any other animation is authored. This is the anchor pass — everything else inherits from it.
Plan reference: `01-kalev-runtime-sprite-plan-v0_1.md`

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
- 64×96 pixels per frame
- 5 columns × 8 rows = 320 px wide × 768 px tall, transparent PNG, RGBA
- No background, no grid lines, no labels, no guide rulers
- Feet baseline y = 84 across every frame (this is the project-wide anchor for Godot collision)
- Center of mass x = 32 (frame center)
- ≥ 4 px gutter from frame edges to silhouette — no character pixels touch the frame border

ANIMATION ROWS
  Row 0: idle_down,  4 frames + 1 empty cell — slow breath cycle, 1 px chest rise, no overshoot, no idle fidget
  Row 1: idle_left,  4 frames + 1 empty cell — same breath cycle, profile silhouette
  Row 2: idle_up,    4 frames + 1 empty cell — same breath cycle, back silhouette; notebook hand visible at left edge of body
  Row 3: idle_right, 4 frames + 1 empty cell — same breath cycle, profile silhouette mirrored from row 1
  Row 4: walk_down,  4 frames + 1 empty cell — heavy but playable; 4-frame cycle with weight on planted foot; coat sways 1–2 px on opposite phase
  Row 5: walk_left,  4 frames + 1 empty cell — profile gait; visible coat fold change; pouch rocks 1 px
  Row 6: walk_up,    4 frames + 1 empty cell — same gait pattern from behind
  Row 7: walk_right, 4 frames + 1 empty cell — mirrored from walk_left

PIXEL-ART RIGOR
- Author every pixel natively at 64×96. No upscale-and-clean, no downscale-and-process.
- One-pixel solid outline in ink (#1A1612). No anti-aliasing on silhouette. No semi-transparent silhouette pixels.
- ≤ 24 unique colors per frame; ≤ 48 unique colors over the whole sheet.
- Dither: 1px or 2px ordered only, on coat folds and scarf shadow. Never spray noise.
- 12fps cycle. Walk cycles loop on frame 4 returning to frame 1 cleanly (no jitter on loop).

PALETTE (use these tokens; do not introduce others)
- Coat / pouch / boots:   cedar-brown #6B4A2C · rot-brown #4A3A26 · ink #1A1612
- Skin / face:            vellum-warm #EFE6D0 (highlight) · damp-ash #6B6358 (shade) · ink-soft #2B2520 (line)
- Cloth / scarf:          pine-shadow #2A3329 · damp-ash #6B6358 · candle-white #F6F1E0 (small highlight)
- Notebook (in left hand): vellum-bone #E8DFC9 (page edge) · ink #1A1612 (cover spine)
- Cedar dog charm:        cedar-brown #6B4A2C (matte; no gold)

OUTPUT
- File: `art/characters/kalev/sheets/kalev_locomotion_64x96.png`
- One transparent-PNG sprite sheet meeting every constraint above.
- Empty cells fully transparent (alpha 0, all channels).

ACCEPTANCE
1. Sheet is exactly 320 × 768 px.
2. Every frame's feet sit on y = 84 within its cell.
3. ≤ 48 unique colors over the whole sheet.
4. Silhouette is single-pixel outlined; no semi-transparent silhouette pixels.
5. At 1× pixel scale, a single 64×96 cell is recognizable as Kalev: long coat, pouch on right hip, notebook in left hand, scarf/collar, burdened posture.
6. The four idle rows show recognizable directional silhouette in a single static frame — front-of-head detail in idle_down, profile in idle_left/right, back-of-head + notebook hand in idle_up.
7. Walk cycles loop cleanly: frame 4 → frame 1 transition has no anchor jitter, no foot pop, no coat snap.
8. Coat color is pixel-identical across all 8 rows.

REFERENCES (silhouette and accessory guide ONLY; do not trace; do not downscale)
- `art/characters/kalev/kalev_design_asset.png` — concept reference (1122×1402; concept-only)
- `design_system/v0_8_1/kalev/templates/kalev_full_sheet_64x96_BLANK_TRANSPARENT_TEMPLATE.png` — empty canvas; use rows 0–7
- `design_system/colors_and_type.css` — palette tokens
- `design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md` — locomotion is required by all five acts

Do not imitate any living artist. Return one PNG.
```

## After this pass lands

1. Run validation:
   ```bash
   python3 -c "from PIL import Image; im = Image.open('art/characters/kalev/sheets/kalev_locomotion_64x96.png'); print(im.size, im.mode, len(im.getcolors(maxcolors=10000)))"
   ```
   Expect `(320, 768) RGBA <=48`.
2. Import into Godot; verify `flags/filter=false`, `flags/mipmaps=false` in the auto-generated `.import` file.
3. Stub `kalev_frames.tres` with these 8 animation rows; carve `Rect2(col*64, row*96, 64, 96)` regions.
4. Add `kalev.tscn` with `AnimatedSprite2D` referencing `kalev_frames.tres`; play `idle_down` and walk through all four directions.
5. Walk Kalev across a 32×32 tile graybox; confirm feet sit on tile baseline.
6. Confirm coat / face / pouch palette before authoring Pass 2 — Pass 2 must use pixel-identical colors.

Only after Pass 1 acceptance fully clears does Pass 2 begin.
