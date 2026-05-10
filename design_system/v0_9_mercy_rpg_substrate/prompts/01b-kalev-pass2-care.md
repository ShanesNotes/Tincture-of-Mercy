# Sprite-sheet prompt — Kalev · Pass 2 · Care verbs

Status: active authoring prompt
Owner lane: art direction + production
Sheet target: `art/characters/kalev/sheets/kalev_care_64x96.png`
Pass purpose: prove the actual mercy-game identity — bedside posture, hand discipline, the verbs that make Kalev a healer rather than a movement system.
Prerequisite: Pass 1 (`kalev_locomotion_64x96.png`) shipped, validated, and imported. Pass 2 must use pixel-identical coat/face/pouch colors.
Plan reference: `01-kalev-runtime-sprite-plan-v0_1.md`

## Prompt

```text
You are producing Pass 2 of the runtime sprite sheet for Kalev Ward in *Tincture of Mercy: The Garments of Skin* — a combat-capable mercy RPG vertical slice in Godot 4.6 / C# / Forward+.

Pass 2 covers care verbs: write_name, wash, warm, sit, kneel. Pass 1 (locomotion) must already be shipped — Pass 2 inherits its scale, silhouette, baseline, and palette without drift.

CHARACTER (consistent with Pass 1)
- Same character, same silhouette laws, same palette. Coat / face / pouch / boots colors must be pixel-identical to Pass 1. The notebook moves between the left hand (idle/sit) and an open position on the lap or surface (write_name).
- Hand discipline matters more than face expression at this scale. Faces have ≤ 8 px of detail; pose carries the meaning.
- Avoid: melodramatic posture, halo light, sympathy lighting, cartoon tear, fantasy potion-bottle gestures.

CANVAS
- 64×96 pixels per frame
- 5 columns × 5 rows = 320 px wide × 480 px tall, transparent PNG, RGBA
- Feet baseline y = 84 across all standing/kneeling frames; for sit frames the seated baseline (hip on surface) sits at y = 76 with feet at y = 90
- ≥ 4 px gutter from frame edges to silhouette

ANIMATION ROWS
  Row 0: write_name, 3 frames + 2 empty cells
    · frame 1: notebook open on lap or low surface; right hand lifts pencil over page; head bowed slightly
    · frame 2: pencil contacts page; right hand drawn close to body; pose held
    · frame 3: pencil lifted slightly; line of script implied beneath the right hand (1–2 px of ink on the page)
    The whole sequence reads as careful and intimate. No flourish. No signature curl. The graphite mark is implied, not rendered.

  Row 1: wash, 4 frames + 1 empty cell
    · frame 1: facing patient (player-camera-side); both hands at chest level, holding folded cloth
    · frame 2: hands lower toward bedside / basin; cloth angled toward target
    · frame 3: hands at lowest point; cloth pressed to surface; weight forward
    · frame 4: hands rise; cloth lifts; return-pose toward frame 1
    Loops cleanly frame 4 → frame 1 if held longer.

  Row 2: warm, 3 frames + 2 empty cells
    · frame 1: both hands cupped in front of body, near chest height, palms down toward implied hearth
    · frame 2: hands rotate slightly; right hand higher than left (fingers extended toward warmth)
    · frame 3: hands return to cupped pose, slightly closer to body
    Slow cycle (200ms+ per frame). The pose carries the act's quietness.

  Row 3: sit, 2 frames + 3 empty cells
    · frame 1: seated facing player-camera; weight on hips; coat folds visible over knees; both hands resting in lap; notebook closed in left hand
    · frame 2: same pose, head dipped 1 px; this is the held-quiet moment used during patient sit-near beats

  Row 4: kneel, 3 frames + 2 empty cells
    · frame 1: from standing, lowering — one knee bending, one foot still planted
    · frame 2: kneeling, one knee on ground, weight forward, head bowed; both hands together near the lower chest
    · frame 3: kneeling, head slightly raised, hands separating slightly outward; this is the "before rising" pose
    The sequence does not include rising back to standing — that is a runtime reverse-play of the same frames.

PIXEL-ART RIGOR
- Author every pixel natively at 64×96. No upscale-and-clean, no downscale-and-process.
- One-pixel solid outline in ink (#1A1612). No anti-aliasing on silhouette. No semi-transparent silhouette pixels.
- ≤ 24 unique colors per frame; ≤ 48 unique colors over the whole sheet.
- Cross-pass discipline: every shared surface (coat, face, pouch, boots) uses pixels-identical colors to Pass 1.
- Dither: 1px or 2px ordered only, on coat folds at the elbow / knee crease. Never spray noise.
- 12fps cadence; write_name and warm rows hold 200ms+ per frame for contemplative pacing.

PALETTE (additions to Pass 1 — same shared surfaces, plus these care-specific tokens)
- Notebook open page:  vellum-bone #E8DFC9 (page) · damp-ash #6B6358 (page shadow) · ink #1A1612 (binding edge) · ink-soft #2B2520 (1–2 px implied script)
- Cloth (wash):        candle-white #F6F1E0 (base) · damp-ash #6B6358 (shade) · vellum-warm #EFE6D0 (mid)
- Pencil (write_name): cedar-brown #6B4A2C (shaft, ≤ 6 px) · ink #1A1612 (graphite tip, 1 px)

OUTPUT
- File: `art/characters/kalev/sheets/kalev_care_64x96.png`
- One transparent-PNG sprite sheet meeting every constraint above.
- Empty cells fully transparent (alpha 0, all channels).

ACCEPTANCE
1. Sheet is exactly 320 × 480 px.
2. Standing/kneeling baselines at y = 84; sit baselines at y = 76 with feet at y = 90.
3. ≤ 48 unique colors over the whole sheet.
4. Coat / face / pouch / boot pixel colors are identical to the corresponding pixels in Pass 1 (`kalev_locomotion_64x96.png`). Run a comparator if needed.
5. Single-pixel ink outlines; no semi-transparent silhouette pixels.
6. write_name reads as careful and quiet without facial detail beyond the ink-line silhouette.
7. wash and warm cycle cleanly from final frame back to first.
8. sit frame 1 includes the closed notebook in the left hand — readable as such at 2× zoom.

REFERENCES
- Pass 1 sheet (now landed): `art/characters/kalev/sheets/kalev_locomotion_64x96.png` — color reference
- `design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md` §Acts 1, 2, 4 — care verbs in context
- `design_system/v0_9_mercy_rpg_substrate/04-latent-paths-receptivity.md` — Hesychasm path verbs (sit_near, hold_hand, keep_watch) overlap with these animations
- `design_system/colors_and_type.css` — palette tokens

Do not imitate any living artist. Return one PNG.
```

## After this pass lands

1. Validation: confirm 320 × 480, RGBA, ≤ 48 colors.
2. Color comparator: confirm Pass 2 coat/face/pouch pixels exactly equal Pass 1.
3. Import; verify `.import` settings.
4. Add Pass 2 animation rows to `kalev_frames.tres` referencing the new sheet.
5. Test in `kalev.tscn`: play `write_name`, `wash`, `warm`, `sit`, `kneel` in sequence; confirm baseline transitions are clean (sit lowers feet to y=90, write_name keeps feet at 84).
6. Pass 3 only after Pass 2 acceptance fully clears.
