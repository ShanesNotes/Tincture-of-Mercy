# Sprite-sheet prompt — Kalev · Pass 4 · Combat compatibility

Status: active authoring prompt · v0.9 — new in v0.9 (no v0.8.1 equivalent)
Owner lane: art direction + production
Sheet target: `art/characters/kalev/sheets/kalev_combat_64x96.png`
Pass purpose: support Act 5 protection — Kalev as a real body in a violent encounter, taking damage, drawing threat, guarding the boy, going down. This is the v0.9 combat-capable expansion. v0.8.1 had no Kalev combat animations because v0.8.1 deferred combat; v0.9 makes combat first-class.
Prerequisite: Passes 1, 2, 3 shipped, validated, imported. Pass 4 must use pixel-identical shared-surface colors.
Plan reference: `01-kalev-runtime-sprite-plan-v0_1.md`
v0.9 silhouette caveat: Kalev still carries no weapons. He guards, pushes, dodges, takes wounds. The threat handling reads through positioning and posture, not weaponry. Combat-style verbs that would shift him toward warrior/rogue silhouette are out of scope.

## Prompt

```text
You are producing Pass 4 of the runtime sprite sheet for Kalev Ward in *Tincture of Mercy: The Garments of Skin* — a combat-capable mercy RPG vertical slice in Godot 4.6 / C# / Forward+.

Pass 4 covers combat-compatibility verbs: hurt, dodge_brace, push_guard, downed. Pass 1, 2, 3 must already be shipped.

CRITICAL — Kalev's combat-silhouette boundary
- Kalev carries NO weapons in any frame. Not a knife, not a stick, not a torch. His combat verbs are protection, draw-threat, dodge, guard-the-boy, take a hit, go down.
- The combat read comes from posture, hand position, weight transfer, and the boy's implied position relative to Kalev. It does not come from weapons or strike animations.
- Avoid: sword, dagger, club, makeshift weapon, fist-of-fury combat stance, hero pose, action-protagonist anatomy, fantasy heroism. Kalev is a tired healer who places himself between a child and wolves.

CHARACTER (consistent with Passes 1–3)
- Same character, same silhouette laws, same palette. Coat / face / pouch / boots colors must be pixel-identical across all four passes.
- The notebook is occluded (in pouch) during all combat frames. The tincture vial is occluded (in pouch) during all combat frames except an optional self-administer mid-combat — that animation is in Pass 3 (self_administer); Pass 4 doesn't repeat it.

CANVAS
- 64×96 pixels per frame
- 5 columns × 4 rows = 320 px wide × 384 px tall, transparent PNG, RGBA
- Feet baseline y = 84 across hurt / dodge_brace / push_guard frames; downed frames anchor differently (see row 3 spec).
- ≥ 4 px gutter from frame edges to silhouette

ANIMATION ROWS
  Row 0: hurt, 3 frames + 2 empty cells
    · frame 1: body recoils from impact (implied wolf hit from player-camera-side); torso twists 1–2 px away from impact direction; right arm rises slightly defensively
    · frame 2: maximum recoil — body leans 2–3 px back; head turned away; both arms protective
    · frame 3: return-toward-stable — body rights itself; arms lower toward sides; this is the recovery transition into idle
    No blood splash, no impact spark, no screen-flash hint. The hit reads through body language alone.

  Row 1: dodge_brace, 3 frames + 2 empty cells
    · frame 1: weight shifts to one side; the leading foot plants; body angles 5–10 degrees toward the dodge direction
    · frame 2: full sidestep — body in profile, weight on planted foot, head turned back toward threat direction
    · frame 3: brace — feet planted apart, body squared, both arms slightly raised, knees bent 1 px; this is the "ready to receive or push" pose
    The three frames flow into each other and can also play as an interrupted cycle (frame 1 → frame 3 with no frame 2 if dodge is interrupted by guard).

  Row 2: push_guard, 4 frames + 1 empty cell
    · frame 1: brace pose carried from dodge_brace frame 3; arms extended forward 4–6 px
    · frame 2: arms thrust further forward; weight transfers to leading foot; the implied wolf is being shoved away (the wolf sprite is off-frame; the gesture must read without it)
    · frame 3: arms held at full extension; brief hold; weight forward; this is the contact frame
    · frame 4: arms retract toward chest; weight returns to neutral; body returns to brace; the boy (off-frame, behind Kalev's left shoulder) implied by Kalev's protective angle
    push_guard cycles into dodge_brace cleanly — frame 4 of push_guard reads as the same body posture as frame 3 of dodge_brace.

  Row 3: downed, 3 frames + 2 empty cells — these frames anchor differently than other rows
    · frame 1: knees-buckled — kneeling but slumped forward; head bowed; one hand on the ground; this anchors at y = 70 (knees + hand on ground baseline)
    · frame 2: side-collapse — body fallen to the side, lying on hip and forearm; head down; this anchors at y = 56 (body lying, baseline-on-side)
    · frame 3: prone — fully on the ground, face-down or face-side; this anchors at y = 50 (fully prone)
    The downed sequence reads as collapsing under cost. It is not "death" — Act 5 tuning may resolve into recovery or into Kalev death depending on the encounter's danger setting. The visual must support either outcome.

PIXEL-ART RIGOR
- Author every pixel natively at 64×96. No upscale-and-clean, no downscale-and-process.
- One-pixel solid outline in ink (#1A1612). No anti-aliasing on silhouette. No semi-transparent silhouette pixels.
- ≤ 24 unique colors per frame; ≤ 48 unique colors over the whole sheet.
- Cross-pass discipline: every shared surface uses pixels-identical colors to Passes 1, 2, 3. No new palette tokens introduced in Pass 4 — combat doesn't get its own color register.
- Dither: 1px ordered only, on coat folds at twist points (hurt frame 2, downed frames). Never spray noise.
- 12fps cadence for hurt / dodge_brace / push_guard. downed sequence holds longer per frame (160–200ms) — collapsing is slow.

PALETTE (no additions over Passes 1–3)
- Use only the tokens already shared across the previous passes. Combat carries no special color treatment in the base sprite. Wound effects, blood, threat aura — none of these are painted into Kalev's sprite. They are runtime overlays (shader, particle, lighting) when scoped, or absent.

OUTPUT
- File: `art/characters/kalev/sheets/kalev_combat_64x96.png`
- One transparent-PNG sprite sheet meeting every constraint above.
- Empty cells fully transparent (alpha 0, all channels).

ACCEPTANCE
1. Sheet is exactly 320 × 384 px.
2. Standing-pose baselines (hurt, dodge_brace, push_guard) at y = 84.
3. Downed-row baselines: row 3 frame 1 at y = 70; frame 2 at y = 56; frame 3 at y = 50.
4. ≤ 48 unique colors over the whole sheet; no new colors introduced beyond the Pass 1–3 shared palette.
5. Coat / face / pouch / boot pixel colors are identical to all prior passes.
6. Single-pixel ink outlines; no semi-transparent silhouette pixels.
7. NO weapons in any frame. The silhouette never reads as warrior, rogue, or action protagonist — it reads as a tired healer protecting a child.
8. push_guard frame 4 → dodge_brace frame 3 transition is visually clean (Godot will cross-fade these via animation player; the sprites must support the read).
9. The downed sequence implies collapse-under-cost without dramatic action-pose framing. No "noble fall" composition.

REFERENCES
- Pass 1, 2, 3 sheets (landed): color references
- `design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md` §Act 5 — encounter data, threat handling, downed-state handling
- `design_system/v0_9_mercy_rpg_substrate/05-rpg-economy-progression.md` — Kalev wounds and care needs after combat
- `design_system/v0_9_mercy_rpg_substrate/02-substrate-primitives.md` §15 — death/friction/moral death; Kalev down state can recover or terminate the run per tuning
- `docs/adr/0001-combat-first-class-shared-substrate.md` — combat is first-class but Kalev's silhouette stays a healer's
- `docs/adr/0008-wolf-combat-is-violent-and-lootable.md` — the encounter is real; the boy's safety is the objective
- `design_system/colors_and_type.css` — palette tokens (Pass 4 introduces no new tokens)

Do not imitate any living artist. Return one PNG.
```

## After this pass lands

1. Validation: confirm 320 × 384, RGBA, ≤ 48 colors.
2. Cross-pass color comparator: every shared-surface pixel matches Passes 1–3 exactly.
3. Weapon audit: no frame contains weapon-like silhouette features.
4. Import; verify `.import` settings.
5. Add Pass 4 animation rows to `kalev_frames.tres`.
6. Test in a wolf graybox (`scenes/encounters/wolves_road.tscn`): play `dodge_brace` → `push_guard` cycles; confirm Kalev draws threat away from the boy through pose alone; confirm `hurt` and `downed` read at 1× and 2× zoom without dramatic framing.
7. After Pass 4 acceptance: all four Kalev sheets are landed. Run the consolidated validation script from `01-kalev-runtime-sprite-plan-v0_1.md`. The Kalev anchor asset is shipped; other characters can begin authoring inheriting his pipeline.
