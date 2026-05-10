# Icon Panel Prompt Pack — v0.8.1

Style-safe prompts for sourcing concept exploration of icon panels, sprites, and UI surfaces. Use these with image-generation tools, mood-board search, or as written briefs for human illustrators.

**Two principles before all prompts:**
1. **Translate, don't imitate.** Never name a living artist; never reference *Tincture of Mercy* directly to a third-party tool. Use the principle vocabulary from `art_direction_v0_8_1.md` §1.
2. **Concept exploration only.** These prompts produce reference, not shippable art. Final assets are authored against the manifest in `godot_asset_manifest_v0_8_1.md`.

---

## 1. Universal style anchors (paste into every prompt)

```
top-down 32-pixel narrative game, manuscript UI, restrained palette,
folk woodcut religious printmaking sensibility, 1px ink contour line,
flat symbolic color (no gradients), vellum and ink dominant,
cold lake-effect Michigan, post-Turn medieval-modern, candlelight,
no fantasy, no sparkles, no portrait avatars, no UI score language
```

```
NEGATIVE: gradients, bloom, lens flare, anime, chibi, cute mascots,
healing sparkles, RPG hud, hp bar, mana, achievement, victory pose,
generic medieval fantasy, dragons as combat enemies,
glossy plastic, photorealism, Instagram filter, 3d render
```

---

## 2. Icon-panel prompts

Each panel: **480×300, manuscript double-frame (2px ink outer + 1px inner at 8px inset), stacked composition (sky/world/underworld bands when applicable), small human figures under vast invisible order.**

### 2.1 Cabin death panel

```
Manuscript icon panel, 480×300, woodcut-on-vellum sensibility.
Stacked composition: sky band shows a single bare branch against
vellum-bone (#F2EFE6); world band shows a small bedridden boy on a
plank cot, hearth at frame margin, a man in a brown coat seated
beside the bed in posture of vigil. One ember-red glint on a corked
vial on the table — the only color beyond ink and vellum.
Marginalia in lower-left: cedar twigs and a tiny carved-dog motif.
1px ink contour line. Damp aged vellum texture. No halo.
[universal anchors] [negative]
```

### 2.2 Birdie apple-refusal panel (mandatory)

```
Manuscript icon panel, 480×300, folk-woodcut sensibility.
Stacked composition: sky band shows bare pine canopy in damp-ash
(#7F7468); world band shows a small child in an oversized rot-brown
coat seated beneath a pine, after refusing the apple, hands drawn back;
a man in a cedar-brown coat walks past at frame-right edge, not
turning. Underworld band: snow with a single ember-red apple
half-buried. Marginalia at lower-right margin: a small worm motif.
1px ink contour. Cold-breath particles drifting up.
[universal anchors] [negative]
```

### 2.3 Bethany triage panel

```
Manuscript icon panel, 480×300, candle-lit interior icon
sensibility. Stacked composition: sky band carries faint window-cross
in lake-slate (#5C6770) at left and three candle flames at right;
world band shows three sickbeds in a row, a man in cedar-brown coat
seated at one bedside, an older woman in pale-heal-deep shawl
standing with her hand placed on his shoulder, a small child at the
door-frame at right carrying a tin cup. Underworld band: patterned
manuscript water motif.
Three small marginalia, one per side margin: a cup, a leaf, an open
notebook. Earned colors limited to: pale-heal-deep on the woman's
shawl, cedar-brown on the notebook, and (if the leftmost patient
died) a single dragon-red blanket on her bed. No halo.
[universal anchors] [negative]
```

### 2.4 Mackinac threshold (reserved — concept only, not for P0 production)

```
Manuscript icon panel, 480×300, frozen-lake threshold sensibility.
Horizontal corridor composition: a long bridge truss in damp-ash
crossing left-to-right; a small man in cedar-brown coat at center,
mid-crossing; ice surface below. Underworld band: patterned
lake-water visible UNDER the ice — the chaos contained but present.
Sky band: lake-slate flat, no sun. Cold-breath particles. No halo.
1px ink contour. Manuscript double-frame.
[universal anchors] [negative]
```

### 2.5 Wittehaven Block 0044 (reserved — concept only)

```
Manuscript icon panel, 480×300, sanctioned-modern-clinical
contrast. Composition is NOT stacked; instead: a single fluorescent-
lit corridor in witte-white (#F4F6F8) and witte-cool (#A8B6C2),
hard-edged grid floor, a row of identical sanctioned doors, a small
man in cedar-brown coat at frame-left looking down the corridor.
ONE folk detail: a child's drawing in pencil-and-vellum taped to a
window at frame-right — the only warm-toned element. Sharp
monolinear contour, NOT hand-wobble. Manuscript frame still
present, but the contents inside it look industrial.
[universal anchors] [negative]
```

### 2.6 Paradise narthex (reserved — concept only)

```
Manuscript icon panel, 480×300, candle-pure narthex sensibility.
Composition: a single small carved cedar dog on an old-wood table,
candle-light from below frame, smoke-dark icon panels on the wall
behind. A faint single icon-gold (#C9A557) ring around the dog —
the ONLY gold mark. IC XC NIKA plate Cinzel-wide-tracked at upper-
right margin. No human figures in frame. No verbs. Vellum-bone
background with deep ink. 1px contour.
[universal anchors] [negative]
```

---

## 3. Sprite-sheet briefs

Use these as written briefs to a sprite artist; they are not literal image-gen prompts (image-gen at native pixel-art canvas is unreliable — author by hand, use these to align visual intent). Canvas sizes follow `godot_asset_manifest_v0_8_1.md` §7.1.

### 3.1 Kalev (64×96)

> Adult man in his late 30s. Cedar-brown wool coat to mid-thigh; damp-ash trousers; rot-brown leather pouch on right hip; left hand carries a small leather notebook on idle. Hair short, ink-dark. Hands deliberately drawn — they are the verbs of the game. **Silhouette test:** identifiable by the pouch on right hip and notebook in left hand. **Palette:** cedar-brown coat, damp-ash trousers, rot-brown pouch, single ember-red glint visible only when the vial is actively out. No halo in Ironwood. Halo on cedar dog only in Paradise scenes (separate sprite).

### 3.2 Lena (64×96)

> Older woman, 60s, healer. Pale-heal-deep shawl over a vellum-warm apron; stitched gloves with the fingertips cut off (her hands must read as warm, working hands, not protected). Hair tied back; ink-dark with damp-ash silver streaks. **Silhouette test:** identifiable by gloves with cut fingertips and the shawl draped asymmetrically. **Palette:** pale-heal-deep shawl, vellum-warm apron, iodine-amber stains on fingertips. No pouch. She does not carry the Ember.

### 3.3 Birdie / Ruth (48×64 — child)

> Child, 8 or 9. Oversized rot-brown coat (clearly an adult's coat resized for her); vellum-bone collar; one shoulder slightly raised (she watches without turning her head). Small. Quiet posture. **Silhouette test:** smaller than adult sprites by a full head; the too-large coat is the recognition mark. **Palette:** rot-brown coat, vellum-bone collar. No accent color in Ironwood. Acquires a faint pale-heal-deep ribbon in Paradise (separate sprite).

### 3.4 Miriam Toll (96×48 or 128×64, bedridden)

> Elder woman. Lying on plank cot. Hair down (others have it tied). Vellum-warm linen shift. Lake-slate blanket — visibly cold-toned. One arm at her side; one hand resting on the blanket. Three frames: breathing / breathing-thinning / still. **Palette:** vellum-warm shift, lake-slate blanket. **In the icon panel only**, the blanket renders as dragon-red — the marginalia color of pressure that has not been answered.

### 3.5 Nora Finch (96×48 or 128×64, bedridden)

> Recoverable Bethany patient. Lying on plank cot. Hair tied back, gray. Vellum-warm linen shift. Cedar-brown blanket — warmer than Miriam's. One frame coughing (3 frames), one frame settled. **Palette:** vellum-warm shift, cedar-brown blanket. Recoverable patient — visual register is warmer than Miriam's by design.

### 3.6 Dr. Amos Bell (96×48 or 128×64, bedridden)

> Elderly village physician. Reading glasses kept on the bedside table beside him. Sleeves rolled up. Verdigris (#5A6E5C) blanket — the spiritual-unease tint. Three frames: breathing / murmuring / settled. **Palette:** vellum-warm shift, verdigris blanket, ink-dark glasses on tin saucer beside him.

### 3.7 Eli (96×48 or 128×64, bedridden)

> Boy, 7 or 8. Lying on plank cot. Use 96×48 or 128×64 bedside-patient canvas. Vellum-warm linen shift. Cedar-brown small blanket. Three frames: thin breath / thinner breath / still. The cedar dog rests on the bed beside his hand in the still frame — this is the moment Kalev takes it back. **Palette:** vellum-warm shift, cedar-brown blanket, the carved cedar dog visible at all three frames.

---

## 4. Tile-set briefs

Use as written briefs. **All tiles 32×32 native, 1px ink contour at edges that meet collision boundaries, three wear variants per primary surface.**

### 4.1 Cabin interior

> A single-room cedar cabin, mid-Michigan, post-Turn. Floors: wide cedar plank with three wear variants (clean, scuffed, worn-through to ash beneath). Walls: cedar plank vertical, four straight + four corner. Hearth: stone-and-mortar with hearth-fire animated tile. Window: small, four-pane, with lake-slate sky visible. Bed: plank with linen folded back. Table: cedar with a notebook. Chair: simple plank. Shelf: jars and a kettle. Foreground occluder: a low ceiling beam at 32×48, drawn with 50% opacity overlay-ready. **Palette:** cedar-brown, damp-ash, vellum-warm, with one ember-red pixel allowed only on the vial's cork.

### 4.2 Ironwood Road

> A narrow road through deep pine. Surface: rot-brown earth with three wear variants (packed, muddy, frozen). Mud tile: damp-ash with cedar-brown rut. Snow patch: vellum-bone with 1px ink stipple. Pine canopy occluder (32×48, 50% opacity overlay): ink-dark needles with damp-ash highlights. Cedar trunk: rot-brown bark. Salvage prop: a rusted truss-fragment from the world before. Pulseleaf cluster: three small leaves, pale-heal with a 2-frame breath shimmer. Fence post: cedar with one nail. Crossroads barricade: a manuscript-rule barrier with the Cinzel label "AHEAD — RECEIVING" rendered in-tile.

### 4.3 Bethany sickroom

> A long room in a cedar farmhouse repurposed for the sick. Floors: vellum-warm wide plank with three wear variants. Walls: cedar plank vertical. Door: cedar with iron hinges. Window: large, six-pane, lake-slate sky beyond — this window is the cold zone. Hearth: smaller than the cabin's. Sickbed: three variants, identical structure but blanket color carries patient identity (lake-slate / cedar-brown / verdigris). Prep table: long, with jars, mortar, kettle, a single notebook. Water basin: tin, on a stool. Jar shelf: pulseleaf, salt, honey, clean water, cedar, wool; **never Bitterleaf and never an Ember vial — the Ember stays in Kalev's pouch.** Candle: tin saucer, three placed between beds, breath-synced flicker.

### 4.4 Manuscript UI tiles

> Margin tiles: vellum-warm with 1–3% ink noise, edges slightly irregular, four corner motifs (thorny vine, cedar twig, small bird, small dog). Page edge: vellum-bone with a single 1px ink rule. Lined ruling: pencil-on-vellum at 20px gap. Marginalia motifs (5): cup, leaf, dog, vial, candle — each at 12×12, ink contour only. **Reserved IC XC NIKA plate (post-P0 Paradise only):** Cinzel wide-tracked, ink on vellum-bone, 96×64.

### 4.5 Wittehaven placeholder

> Floors: witte-white (#F4F6F8) flat, 1px witte-cool grid lines at 32px spacing. Walls: witte-blue (#3D5A80) flat with sharp 1px witte-cool top edge. Door: witte-white with one centered witte-cool bar. Sign post: witte-blue post, witte-white plate, sanctioned text in mono-witte. Paint can: witte-white can with witte-cool rim, ember-red (Wittehaven's ember-red is duller than Ironwood's) drip optional.

---

## 5. Prop briefs

### 5.1 Cedar dog (14×14)

> A small carved cedar dog, palm-sized, the kind a father carves for a son. Smooth contours; one ear slightly higher. Cedar-brown grain visible. **The most important small object in the game.** Renders identically across all regimes — except in Paradise, it carries a 1px icon-gold halo ring at 12px outer offset. **Forbidden:** sparkles, glow, "rare item" border.

### 5.2 Ember vial (16×24, three states)

> Sealed: small glass vial, ember-red liquid inside, cork stopper. Uncorked: cork removed, liquid level visible. Empty: clear glass, faint ember-red residue. **The only sustained ember-red presence in the game outside the apple.** No animation on the liquid — it holds still. The vial is heavy. It does not look magical. It looks like medicine that the player should not want to use.

### 5.3 Notebook (64×48, two states)

> Closed: leather-bound, vellum edges visible, a small ribbon bookmark hanging out. Open: two pages visible, lined pencil-rule at 20px, hand-script names in Caveat. A graphite underrule renders only for still-patient names; page 77 line 7 is reserved outside P0. **A coffee ring, fingerprint, or pencil-drag smudge is drawn once per page and reused** — the notebook looks lived-in.

### 5.4 Pouch (32×24)

> Cedar-leather drawstring pouch with rot-brown stitching. Visible on Kalev's right hip at all times. The drawstring is slightly loose. The pouch never visually communicates what's inside. **Forbidden:** glowing rim, item-count indicator, any UI element drawn onto the pouch sprite itself.

### 5.5 Apple (12×12)

> Small apple, mostly rot-brown skin (it has been in the snow), one pixel of ember-red core visible at the bite mark. **The bite mark and the worm hole are the visual story.** No shine. Not appetizing.

### 5.6 Paint can (16×24)

> Industrial paint can, witte-white with witte-cool rim band. Sanctioned-stencil mono-witte text on the side: a partial word, just enough to read as bureaucratic. One drip of dulled ember-red running down the side — Wittehaven's appropriation of the color the player will recognize from the vial. **This is the visual moment Wittehaven first declares itself.**

### 5.7 Torn ribbon (32×16)

> Witte-white cloth, frayed at both ends, snagged on a fence post. Faintly visible partial lettering in mono-witte: enough to read as institutional but not enough to read whole words. 3-frame flutter at 240ms. **Never picked up by the player.**

---

## 6. UI surface briefs

### 6.1 Pouch grid

> 8×2 grid of slot tiles set on cedar-leather backplate. Each slot: 32×32, vellum-warm fill with 1px ink rule (Ironwood) / witte-white fill with 0px radius (Wittehaven) / vellum-bone fill (Paradise). Quantities in mono-witte 8px bottom-right of each slot — **the only mono in the Ironwood UI**, because quantities are sanctioned by their nature. Slot labels in Caveat hand 11px sentence case. Ember slot glows on hover with shadow-ember (Ironwood) / no glow (Wittehaven) / dimmed 40% (Paradise).

### 6.2 Tincture Wheel

> Square 200×200 in HUD, expands to 320×320 mid-craft. Four axes: Relief (top), Warmth (left), Stability (bottom), Risk (right). Three concentric guide rings at 28% / 60% / 90% radius. Hand-drawn 1px ink contour with slight wobble (Ironwood) / sharp monolinear (Wittehaven) / clean cool-saturation (Paradise). Polygon overlay rendered at runtime in pale-heal 55% fill, pale-heal-deep 1.4px stroke. **Quality readout never numeric** — Caveat 22px sentence case in Ironwood; mono-witte ALL CAPS in Wittehaven; absent in Paradise. **No celebration on excellent quality.** The kettle whistle is the only audio cue, and only on reaching *sound*.

### 6.3 Patient panel

> 420×320 manuscript frame, vellum-warm fill with 1px rule-strong border (Ironwood). Header: name in IM Fell English 28px (folk) / mono-witte 14px ALL CAPS as case ID (Wittehaven) / IM Fell English 28px folk-with-lineage (Paradise). Place row in mono-witte 9px (Ironwood — the only sanctioned slip, because place is) / mono-witte 11px ALL CAPS (Wittehaven) / IM Fell English 11px italic (Paradise). Symptom grid 2×2 minimum, in EB Garamond italic 14px tactile words (Ironwood) / mono-witte 12px sanctioned readouts (Wittehaven) / EB Garamond italic 14px folk-tense-shifted (Paradise). Action bar across bottom — verbs sentence case (Ironwood), ALL CAPS sanctioned (Wittehaven), reduced to two verbs (Paradise: *Sit · Write the name*). **Numbness blur (0.6px) applies to the patient name only, in Ironwood only.** Wittehaven panel never blurs.

### 6.4 Notebook

> 480×420 panel, vellum-warm with lined pencil-ruling at 20px gap, repeating background. Page header in serif-icon 9px wide-tracked: "PAGE 66 · LINE 7". Names in Caveat 26px; notes in Caveat italic 16px. A graphite underrule renders only on still-patient names. Page 77 line 7 remains reserved outside P0 and never appears as a prototype notebook line. **The notebook is not re-themed across regimes.** It is Kalev's, not the world's. In Wittehaven scenes a separate "FILE TO LEDGER" button appears beside it; the notebook itself remains vellum.

### 6.5 State overlay

> 280×72 vellum-warm card (Ironwood) / witte-white card (Wittehaven) / vellum-bone with halo glow (Paradise). Three rows: Burden / Pressure / Numbness. Each row: label in Cinzel 9px wide-tracked, meter rail (vellum-bone with tinted fill — Burden cedar-brown, Pressure dragon-red, Numbness lake-slate), state-word in EB Garamond italic 11px right-aligned. **Never numeric.** State-words from the controlled vocabulary in `ui_regime_system_v0_8_1.md` §7.1. In Paradise, Pressure and Numbness rows fade out; only Burden remains, and its state-word is *carried* regardless of internal value.

### 6.6 Dialogue band

> Bottom of frame, 1920×120. Speaker name in Cinzel 9px wide-tracked caps overline above body. Body in EB Garamond 16px ragged-right manuscript block (Ironwood) / mono-witte 12px justified ALL CAPS for sanctioned NPCs only (Wittehaven) / EB Garamond 18px centered, generous 1.72 leading, italic on every other line (Paradise). **No portrait avatars. No "…" cliffhangers. No ">>" continue arrows.** Tap anywhere advances.

---

## 7. Animation briefs

> Walks: 4 frames per direction, 240ms per frame. Flat foot-plant, no overshoot, no anime stretch.
> Sit: 2 frames (sit-down, settle), 320ms total. Posture is vigil, not rest.
> Wash: 4 frames, 280ms each. Hands enter basin, agitate, withdraw, dry.
> Warm: 3 frames (reach, hold, withdraw), 480ms total. The hold is the longest frame.
> Administer (folk): 4 frames, 320ms each. Cup or spoon to lips; never violent, never spilling.
> Administer (Ember): 5 frames (uncork, pour, brace, pour, withdraw), 400ms each. **Frame 3 (brace) is where the tremor shader fires if Pressure is high.** This is the only sprite that visibly carries Kalev's state.
> Write: 3 frames (open, scratch loop, close), 320ms per frame. The scratch loop is the pencil moving across the page; loops once per name written.

**Animation must never exceed 6 frames per action.** If a beat needs more, break it into two beats.

---

## 8. Forbidden prompt patterns

Do not let any of these phrases enter prompts, even by accident:

- "in the style of [living artist]"
- "epic", "legendary", "rare", "ultra-detailed"
- "anime", "chibi", "cute"
- "magical", "mystical", "ethereal" (Paradise is none of these — it is *plain*)
- "victorious", "heroic", "powerful"
- "fantasy" (the world is post-Turn Michigan, not generic medieval fantasy)
- "healing glow", "potion", "spell"
- "boss", "enemy", "creature"
- "hp bar", "ui hud", "minimap"
- "screenshot", "render", "octane", "unreal"
- "8k", "highly detailed" (we want pixel-restraint, not detail)

---

## 9. Concept-exploration workflow

1. **Pick one panel or sprite at a time.** Do not batch-prompt the whole scene.
2. **Generate 4–6 variants** per prompt. Discard 80%+; keep what survives the acceptance gates.
3. **Run the silhouette test** on every sprite candidate.
4. **Run the palette-application test** on every panel candidate (§8 of `art_direction_v0_8_1.md`).
5. **Hand-author the final asset** against the manifest. Concept exploration is reference, not delivery.
6. **Log accepted references** in `art/reference/` with a short caption noting which principle from `art_direction_v0_8_1.md` §1 they satisfy.

The goal is not to find an image that *is* the game. The goal is to find an image that helps a human author the game by hand.
