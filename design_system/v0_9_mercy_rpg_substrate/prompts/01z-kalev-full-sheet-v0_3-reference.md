# Sprite-sheet prompt — Kalev Ward · 64×96

Status: active authoring prompt · v0.9 update of v0.3 prompt
Owner lane: art direction + production
Replaces: `design_system/v0_8_1/kalev/prompts/PROMPT_KALEV_FINAL_SPRITE_SHEET_64x96_v0_3.md` (v0.3 prompt remains historical reference; v0.9 prompt below adds explicit palette tokens, color budget, and the cross-act animation set required by the opening five-act slice).
Sheet target: `art/characters/kalev/kalev_full_sheet_64x96.png`
Layout reference: `design_system/v0_8_1/kalev/templates/kalev_full_sheet_64x96_layout.json`
Blank canvas: `design_system/v0_8_1/kalev/templates/kalev_full_sheet_64x96_BLANK_TRANSPARENT_TEMPLATE.png` (320×1344)

## Prompt

```text
You are producing the runtime sprite sheet for Kalev Ward, the player character of *Tincture of Mercy: The Garments of Skin* — a combat-capable mercy RPG vertical slice in Godot 4.6 / C# / Forward+. Authoring rules below are non-negotiable.

CHARACTER
- Kalev Ward, age 33, former critical-care nurse turned burdened healer-apothecary.
- Active in all five opening acts (Water, Bread, Tincture, Mother death/Witness, Wolves). Carries Health, Spirit, Steady, Burden, Pressure, Numbness as game state. The sprite reads tired, grave, competent, human.
- Silhouette laws (must read at 2× zoom):
  · long weathered cedar-brown coat to mid-thigh
  · scarf / collar mass framing the face
  · medicine pouch on right hip (rot-brown leather)
  · leather notebook in left hand on idle frames
  · small cedar dog charm — visible as a 2×2 pixel cluster at 2×, not a glow
  · small restrained tincture vial — single ember-red glint only when the vial is actively out
  · practical boots and gloves
  · burdened shoulders, never hero stance
- Avoid: weapons, combat swagger, fantasy armor, neon glow, clean sci-fi medic colors, cozy-village brightness, glamour lighting.

CANVAS
- 64×96 pixels per frame
- 5 columns × 14 rows = 320 px wide × 1344 px tall, transparent PNG, RGBA
- No background, no grid lines, no labels, no guide rulers
- Feet baseline y = 84 across every frame (alignment guide for Godot collision)

ANIMATION ROWS (matches `kalev_full_sheet_64x96_layout.json`)
  Row 0: idle_down,        4 frames + 1 empty cell — slow breath cycle, no overshoot
  Row 1: idle_left,        4 frames + 1 empty cell
  Row 2: idle_up,          4 frames + 1 empty cell
  Row 3: idle_right,       4 frames + 1 empty cell
  Row 4: walk_down,        4 frames + 1 empty cell — heavy but playable, weight on planted foot
  Row 5: walk_left,        4 frames + 1 empty cell
  Row 6: walk_up,          4 frames + 1 empty cell
  Row 7: walk_right,       4 frames + 1 empty cell
  Row 8: write_name,       3 frames + 2 empty cells — careful, intimate, pencil hand only
  Row 9: administer_ember, 5 frames — precise and dangerous through hand posture and vial position; NO magic VFX, NO screen-shake; tremor is shader-driven at runtime
  Row 10: wash,            4 frames + 1 empty
  Row 11: warm,            3 frames + 2 empty
  Row 12: sit,             2 frames + 3 empty
  Row 13: kneel,           3 frames + 2 empty

PIXEL-ART RIGOR
- Author every pixel natively at 64×96. No upscale-and-clean, no downscale-and-process.
- One-pixel solid outline in ink (#1A1612). No anti-aliasing on silhouette. No semi-transparent silhouette pixels.
- ≤ 24 unique colors per frame; ≤ 48 unique colors over the whole sheet.
- Dither: 1px or 2px ordered only, where coat folds and hearth-light demand. Never spray noise.
- 12fps animation cadence; keyframes over tween smear. Hold each frame 100–160ms.

PALETTE (use these tokens; do not introduce others)
- Coat / pouch / boots:   cedar-brown #6B4A2C · rot-brown #4A3A26 · ink #1A1612
- Skin / face:            vellum-warm #EFE6D0 (highlight) · damp-ash #6B6358 (shade) · ink-soft #2B2520 (line)
- Cloth / scarf:          pine-shadow #2A3329 · damp-ash #6B6358 · candle-white #F6F1E0 (small highlight)
- Notebook:               vellum-bone #E8DFC9 (page) · ink #1A1612 (cover)
- Cedar dog charm:        cedar-brown #6B4A2C (matte; no gold)
- Tincture vial:          ember-red #C63E1F (≤ 4 pixels visible total) · vellum-bone #E8DFC9 (glass)
- Earned colors (gold #C79A3A, ember-glow #E26A3A): used at runtime via shader/light, not painted into base sprite.

OUTPUT
- File: `art/characters/kalev/kalev_full_sheet_64x96.png`
- One transparent-PNG sprite sheet meeting every constraint above.
- Empty cells fully transparent (alpha 0, all channels).

ACCEPTANCE
1. Sheet is exactly 320 × 1344 px.
2. Every frame's feet sit on y = 84 within its cell.
3. ≤ 48 unique colors over the whole sheet (verifiable by histogram).
4. Silhouette is single-pixel outlined; no semi-transparent silhouette pixels.
5. At 1× pixel scale, a single 64×96 cell is recognizable as Kalev: long coat, pouch on right hip, notebook in left hand, scarf/collar, burdened posture.
6. The five `administer_ember` frames convey precision and danger through hand and vial position alone — no glow, no particles, no light bloom; tremor is added at runtime by `res://shaders/tremor.gdshader`.

REFERENCES (silhouette and accessory guide ONLY; do not trace; do not downscale)
- `art/characters/kalev/kalev_design_asset.png` — canonical Kalev concept reference (1122×1402; concept-only)
- `design_system/v0_8_1/kalev/templates/kalev_full_sheet_64x96_BLANK_TRANSPARENT_TEMPLATE.png` — empty 320×1344 canvas with the correct cell grid
- `design_system/v0_8_1/kalev/templates/kalev_full_sheet_64x96_ANNOTATED_TEMPLATE.png` — labeled layout for planning
- `design_system/v0_8_1/godot_asset_manifest_v0_8_1.md` §6.2 — sprite manifest contract
- `design_system/colors_and_type.css` — palette tokens
- `design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md` — what each animation has to support across Acts 1–5

Do not imitate any living artist. Return one PNG.
```
