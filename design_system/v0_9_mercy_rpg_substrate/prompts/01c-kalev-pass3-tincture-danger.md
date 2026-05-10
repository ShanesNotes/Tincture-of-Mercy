# Sprite-sheet prompt — Kalev · Pass 3 · Tincture / danger verbs

Status: active authoring prompt
Owner lane: art direction + production
Sheet target: `art/characters/kalev/sheets/kalev_tincture_64x96.png`
Pass purpose: support the Act 3 / 4 / 5 emotional and mechanical bridge — administering the tincture to a patient, FSR/Vigil self-administration, and the tremor-shader base pose. This is the pass where danger first enters Kalev's silhouette without weapons.
Prerequisite: Pass 1 (locomotion) and Pass 2 (care) shipped, validated, imported.
Plan reference: `01-kalev-runtime-sprite-plan-v0_1.md`

## Prompt

```text
You are producing Pass 3 of the runtime sprite sheet for Kalev Ward in *Tincture of Mercy: The Garments of Skin* — a combat-capable mercy RPG vertical slice in Godot 4.6 / C# / Forward+.

Pass 3 covers tincture and danger verbs: administer_ember (patient-target), self_administer (FSR/Vigil self-use), and recoil_neutral (the tremor-shader base pose). Pass 1 and Pass 2 must already be shipped.

CHARACTER (consistent with Pass 1 and Pass 2)
- Same character, same silhouette laws, same palette. The tincture vial is now visible in select frames — it's the only sprite-painted ember-red in the sheet (≤ 4 px per frame).
- Avoid: magical glow, screen-shake VFX, particle aura, light bloom, dramatic backlighting, theatrical pose. Tremor is shader-driven at runtime; the painted sprite is steady. Danger reads through hand position and vial angle, not through effects.

CANVAS
- 64×96 pixels per frame
- 5 columns × 3 rows = 320 px wide × 288 px tall, transparent PNG, RGBA
- Feet baseline y = 84 across all frames
- ≥ 4 px gutter from frame edges to silhouette

ANIMATION ROWS
  Row 0: administer_ember, 5 frames (no empty cells)
    · frame 1: vial drawn from pouch on right hip; right hand at hip level; left hand still holding notebook
    · frame 2: vial raised to chest level; right hand center; the dose is being measured
    · frame 3: vial extended forward toward bedside / patient (implied off-screen left); body leans 1 px forward
    · frame 4: vial held still; right hand steady; this is the dose-administered hold
    · frame 5: vial returns toward chest; right hand begins withdrawing; this is the post-dose recovery frame
    The whole sequence is precise. No tremor painted in. The patient is implied off-frame.

  Row 1: self_administer, 4 frames + 1 empty cell
    · frame 1: vial drawn from pouch; right hand at hip; left hand drops notebook into pouch
    · frame 2: vial raised toward Kalev's own mouth; eyes lowered; head tilts forward 1 px
    · frame 3: vial at lips; right hand hovering; head tilts backward 1 px (the dose passes); body reads as compressed/closed
    · frame 4: vial lowered to chest; head rights itself; right hand still holds vial; left hand at side, empty
    The sequence reads as a private, costly act. No grimace, no flourish. The body's stillness IS the cost.

  Row 2: recoil_neutral, 4 frames + 1 empty cell
    · frame 1: standing, weight balanced, hands at sides, eyes forward; this is the perfectly stable base pose
    · frame 2: identical pose to frame 1 — a literal duplicate frame at pixel level
    · frame 3: identical pose to frame 1 — a literal duplicate frame at pixel level
    · frame 4: identical pose to frame 1 — a literal duplicate frame at pixel level
    These are not animation frames. They are the static substrate the `tremor.gdshader` overlays its vertex offset onto at runtime. The shader cycles which frame it reads to avoid GPU caching artifacts. Author them identically.

PIXEL-ART RIGOR
- Author every pixel natively at 64×96. No upscale-and-clean, no downscale-and-process.
- One-pixel solid outline in ink (#1A1612). No anti-aliasing on silhouette. No semi-transparent silhouette pixels.
- ≤ 24 unique colors per frame; ≤ 48 unique colors over the whole sheet.
- Cross-pass discipline: every shared surface uses pixels-identical colors to Pass 1 and Pass 2.
- 12fps cadence for administer_ember and self_administer; recoil_neutral is shader-driven (no animation playback in editor).
- The ember-red vial pixel cluster: ≤ 4 pixels per frame in administer_ember rows 1, 2, 5; ≤ 4 pixels in frames 3 and 4 of administer_ember (vial is held); 0 pixels of ember-red in frames where the vial is occluded by the hand or held flush to the body (frames 3–4 of self_administer when the vial is at the lips). Vial glass pixels stay vellum-bone #E8DFC9.

PALETTE (additions to Pass 1 / Pass 2 — same shared surfaces, plus these tincture-specific tokens)
- Tincture vial liquid: ember-red #C63E1F (≤ 4 px visible per frame; 0 px when occluded)
- Tincture vial glass:  vellum-bone #E8DFC9 (3–6 px outlining the ember-red)
- Vial cap / stopper:   ink #1A1612 (1–2 px)
- Earned colors (gold #C79A3A, ember-glow #E26A3A): NOT painted. Runtime light/shader only.

OUTPUT
- File: `art/characters/kalev/sheets/kalev_tincture_64x96.png`
- One transparent-PNG sprite sheet meeting every constraint above.
- Empty cells fully transparent (alpha 0, all channels).

ACCEPTANCE
1. Sheet is exactly 320 × 288 px.
2. Every frame's feet sit on y = 84.
3. ≤ 48 unique colors over the whole sheet.
4. Coat / face / pouch / boot pixel colors are identical to Pass 1 and Pass 2.
5. Single-pixel ink outlines; no semi-transparent silhouette pixels.
6. administer_ember reads as precise and dangerous through hand and vial position alone — no glow, no particles, no light bloom; the danger is in the vial's existence, not its rendering.
7. self_administer reads as a costly private act through body compression, not through facial expression.
8. recoil_neutral row 2 contains four pixel-identical frames suitable for `tremor.gdshader` to overlay its offset cycle onto.
9. Ember-red is the only painted use of #C63E1F across the whole project; it appears only on the vial liquid in this sheet.

REFERENCES
- Pass 1 + Pass 2 sheets (landed): color references
- `res://shaders/tremor.gdshader` — the tremor shader that overlays this sheet's recoil_neutral frames at runtime; bound to `pressure_state` int 0–4
- `design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md` §Act 3 (tincture), §Act 4 (gravity encounter), §Act 5 (combat with self-use option)
- `design_system/v0_9_mercy_rpg_substrate/02-substrate-primitives.md` §11 — FSR/Vigil cooldown contract; this sheet is the visual surface for that primitive
- `design_system/colors_and_type.css` — palette tokens

Do not imitate any living artist. Return one PNG.
```

## After this pass lands

1. Validation: confirm 320 × 288, RGBA, ≤ 48 colors.
2. Color comparator: Pass 3 shared-surface pixels equal Pass 1 and Pass 2.
3. Ember-red audit: only the vial liquid uses #C63E1F; no other pixels in the sheet.
4. Import; verify `.import` settings.
5. Add Pass 3 animation rows to `kalev_frames.tres`.
6. Wire `recoil_neutral` to `AnimatedSprite2D` with `tremor.gdshader` material applied; test that the shader's `pressure_state` parameter cycles vertex offset visibly without painting tremor into the base pixels.
7. Test in `kalev.tscn`: play `administer_ember`, `self_administer`; confirm the vial-pixel cluster reads at 1× and 2×.
8. Pass 4 only after Pass 3 acceptance fully clears.
