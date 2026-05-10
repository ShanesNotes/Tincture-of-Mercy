# Sprite-sheet prompt — Mother (bedside) · 96×48

Status: active authoring prompt · new in v0.9
Owner lane: art direction + production
Sheet target: `art/characters/patients/mother_bed_96x48.png`
Active in: Acts 1, 2, 3, 4 (gravity-encounter death). Highest authoring priority among bedside patients — Act 4 will not graybox without her.

## Prompt

```text
You are producing the runtime bedside sprite sheet for the Mother, the Act 4 fixed-outcome death subject in *Tincture of Mercy: The Garments of Skin* — a combat-capable mercy RPG vertical slice in Godot 4.6 / C# / Forward+. Authoring rules below are non-negotiable.

CHARACTER
- Mother — unnamed in the opening slice; her name is resolved at runtime through `notebook.write_name` events. The sprite must read as a real person, not a puzzle object.
- Bedside focal sprite. She does not move; the entire animation set is small breath / fading / stillness shifts. Player actions (water, bread, tincture, presence) affect comfort tags, child fear/trust, Kalev Burden, and the notebook prose around her — not her physical pose at this scale.
- Silhouette laws (must read at 2× zoom):
  · woman lying on back under a thin wool blanket, blanket reaching mid-chest
  · head tilted slightly toward the player-camera side
  · long hair fanned on the pillow, not styled
  · linen nightgown collar visible above the blanket line
  · one hand visible on the blanket — shifts to "open" position in the fading frames
  · pillow takes up upper-left quadrant; blanket takes the rest of the canvas
  · small night-table corner (kettle? cup?) optional in the lower-right 2 px margin only — keep it ambient, not a focal object
- Avoid: hospital sheets / clean white linen, IV lines, modern medical equipment, peaceful-glow halo, dramatic blood, theatrical pallor, "praying hands" pose, flowers placed on her body, anything that turns her into a deathbed icon before Act 4 lands.

CANVAS
- 96×48 pixels per frame (bedside focal canvas — wider than tall because she's horizontal)
- 5 columns × 3 rows = 480 px wide × 144 px tall, transparent PNG, RGBA
- No background, no grid lines, no labels, no guide rulers
- The bed (mattress + pillow + blanket) IS the sprite. Do not isolate the figure on transparent space — she lies on the bed; the bed lies in the cell. The background of the room is rendered separately by the scene tilemap.
- Pillow top edge anchored at y = 4; mattress bottom edge at y = 44

ANIMATION ROWS
  Row 0: breath_calm,     4 frames + 1 empty cell — chest rises ~1 px on a 4-beat cycle; hand still; mouth closed
  Row 1: breath_thinning, 3 frames + 2 empty cells — chest rise ~0.5 px and slower; hand begins opening; head tilts ~1 px
  Row 2: fading,          3 frames + still 1 (= 4 frames + 1 empty) — chest motion vanishes; hand fully open; mouth slightly parted; the final frame is "still" and is the resting state after Act 4 death

PIXEL-ART RIGOR
- Author every pixel natively at 96×48. No upscale-and-clean, no downscale-and-process.
- One-pixel solid outline in ink (#1A1612) on the figure and bed silhouette. No anti-aliasing on silhouette. No semi-transparent silhouette pixels.
- ≤ 20 unique colors per frame; ≤ 36 unique colors over the whole sheet (smaller budget than full-body characters because the canvas is more compact).
- Dither: 1px ordered only, on the blanket fold under her arm and along the pillow shadow. Never spray noise.
- The breath cycle should be visible without zoom — 1px chest rise reads at 2× display scale.
- 12fps cadence; longer holds on stillness frames (200–300ms) for breath_thinning and fading rows.

PALETTE (use these tokens; do not introduce others)
- Mattress / linen:    vellum-warm #EFE6D0 (base) · damp-ash #6B6358 (shade) · candle-white #F6F1E0 (small highlight)
- Pillow:              vellum-bone #E8DFC9 (base) · damp-ash #6B6358 (shade)
- Blanket (wool):      cedar-brown #6B4A2C (base) · rot-brown #4A3A26 (deep fold) · damp-ash #6B6358 (worn highlight)
- Skin / face:         vellum-warm #EFE6D0 (highlight) · damp-ash #6B6358 (shade) · ink-soft #2B2520 (line); shift toward damp-ash dominance in `breath_thinning` and `fading` rows
- Hair:                rot-brown #4A3A26 (base) · ink #1A1612 (deep) · damp-ash #6B6358 (worn strand)
- Nightgown collar:    candle-white #F6F1E0 (base) · damp-ash #6B6358 (shade)
- Optional corner detail: cedar-brown #6B4A2C only

OUTPUT
- File: `art/characters/patients/mother_bed_96x48.png`
- One transparent-PNG sprite sheet meeting every constraint above.
- Empty cells fully transparent (alpha 0, all channels).

ACCEPTANCE
1. Sheet is exactly 480 × 144 px.
2. Pillow top edge consistently at y = 4 within each cell; mattress bottom edge consistently at y = 44.
3. ≤ 36 unique colors over the whole sheet.
4. Silhouette is single-pixel outlined; no semi-transparent silhouette pixels.
5. At 1× pixel scale, a single 96×48 cell is recognizable as a person in bed (not a generic bedside object) without ornament or halo.
6. The three rows together convey a continuous arc: alive → thinning → fading-into-still. The progression must read across the whole sheet without copy/paste frames; even tiny differences (hand position, mouth seam, eye state) must be authored.
7. The final cell of `fading` is the canonical "still" frame — Act 4 fixed-outcome death freezes on this frame after `death.mother` fires.

REFERENCES (silhouette and tone guide ONLY; do not imitate any specific person or composition)
- `design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md` §Act 4 — required events, comfort tags, Witness/Recollection hooks the sprite has to support
- `design_system/v0_9_mercy_rpg_substrate/04-latent-paths-receptivity.md` — Hesychasm `sit_near` / `speak_name` / `hold_hand` verbs play against this sprite
- `design_system/v0_8_1/godot_asset_manifest_v0_8_1.md` §6.2 — bedside-patient sprite contract (Eli pattern: "breath 2 / breath-thinning 2 / still 1" — extend to the v0.9 sequence above)
- `design_system/colors_and_type.css` — palette tokens

Do not imitate any living artist. Return one PNG.
```
