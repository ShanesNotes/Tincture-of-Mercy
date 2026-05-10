# Aesthetic Bible — v0.8.1

> **One-sentence synthesis.** *Tincture of Mercy* is a top-down Godot pilgrimage in which a tired healer-apothecary attends to named persons in damp post-Turn Michigan, rendered as a damaged sacred manuscript whose pages — Ironwood, Wittehaven, Paradise — quietly invert the same components so the player learns, by hand, that medicine works but cannot redeem.

---

## 1. Aesthetic thesis (north star)

*Tincture of Mercy* should feel like an Orthodox service book dropped in a Michigan ditch, dried beside a clinic stove, and used afterward as a triage chart. The world is damp November, cedar splinters, wet wool, iodine, ash light, old road salt, rotting pine, rusted trusses, hospital linen, and graphite names. Its screens are not decorated by sacred imagery; they are built like damaged manuscript pages where care, guilt, and mercy have been written over one another.

**Gold appears only when something eternal presses through. Red appears only when fire is live, dangerous, or accusatory.** The prototype player is *responsible* before they are powerful — power may be earned in post-P0 layers (combat, RPG progression), but only on top of the contemplative core proven here.

### The phrase

The aesthetic is **Michigan icon-manuscript pixel art**.

What that phrase carries:

| Carries | Excludes |
|---|---|
| Post-Turn Michigan materiality | Generic fantasy |
| Top-down playable clarity | Decorative illustration |
| Sacred manuscript grammar | Church wallpaper |
| Apothecary practicality | Mystical vagueness |
| Orthodox-apocalyptic resonance | Generic "religious vibes" |
| Flat symbolic composition | Cinematic realism |
| Damp cold restraint | Cozy warmth |
| Earned gold, earned red | Saturated reward art |

This phrase replaces "Stardew-like." Use it in art briefs, asset names, and onboarding docs.

### One-paragraph art north star (for artist briefs)

> Build it like a wet manuscript: 32×32 tiles cut with a hand contour and flat symbolic color, premium large-pixel characters (Kalev / principal adults 64×96; minor adults 48×72; Birdie 48×64) each with one decisive silhouette feature, UI on damp vellum behind a leather notebook with a graphite hand. The world is cold and partial. Bethany is poor but human; the Ironwood watches without growling; Wittehaven is the relief of clean grids and sanctioned shorthand. Earn every halo. Earn every flame. Most pixels are ash, lake-slate, vellum-warm, ink, and cedar — and they should remain so.

---

## 2. The three-regime visual system

The same components — pouch, Tincture Wheel, patient panel, notebook, Kalev state overlay — re-theme by switching a single regime class on the root container. **The grammar inverts; the geometry does not.**

| Axis | Ironwood (folk) | Wittehaven (sanctioned) | Paradise (sacred) |
|---|---|---|---|
| **Light** | overcast; lake-slate; candle warm at edges | fluorescent; blue-white; even | candle-white center; ash dark; gold rim |
| **Surface** | damp vellum; cedar; wool; leather | enamel; printed card; clean sheets; linoleum | old wood; gold leaf; smoke-black icon panel |
| **Line** | hand contour, slight wobble | machined, monolinear, even-weight | hand contour again, but unwavering |
| **Color** | muted, mostly cold; earned warm | clean, cool, with one institutional blue | candle-white + true ink + earned gold |
| **Type** | IM Fell English / EB Garamond / Caveat | IBM Plex Mono, ALL CAPS short | Cinzel + EB Garamond, wide tracking |
| **Radius** | 4px (soft, irregular feel) | 0px (clinical rectangles) | 4px (composed, contained) |
| **Motion** | 260ms `--ease-quiet`, breath loops | 160ms `--ease-witte`, snap | 520ms slow, almost still |
| **Sound** | wet floorboard, kettle, pencil | hum, paper-feed, plastic click | candle hiss, cedar creak, distant chant |
| **Verbs** | *Sit · Wash · Warm · Write* | *FILE · ADMINISTER · CHART · DOSE* | *Sit · Write the name* |
| **Failure feels like** | grief | a cleared queue | being known |

**Rule of inversion.** When designing any new surface, design Ironwood first and Wittehaven simultaneously. Paradise is anchor, not target. If a surface cannot survive the inversion, it does not belong in the game.

### Regime A — Ironwood / Bethany: rough mercy

**Materials.** Graphite, damp vellum, leather, wool, cedar, ash, oil, salt, waxed cloth, patched gloves, old boards, smoky glass, snow that does not stay.

**Shapes.** Uneven borders. Hand-drawn lines. Softened corners. Imperfect icon-panel symmetry. Tile edges worn but readable. Small symbolic halos that can be mistaken for UI highlights until the player learns better.

**Tone.** The Ironwood watches but is not a monster forest. Bethany is poor but human — every blanket has already been used by someone else; every cup has a chip. Not a starter town.

### Regime B — Wittehaven: clean mercy turned into control

Do not make Wittehaven ugly at first. It is the **UI temptation**.

**It must feel like relief.** Clear grids. Predictable layouts. Readable typography. Blue-white light. Clean sheets. Reliable supplies. Working doors. Charts that answer before the player has to sit with uncertainty.

**The cost is latent in the shapes.** People become rows. Names become case IDs. Crosses become signage. Prayer becomes irregular behavior. Clean paint covers rot. Foster care becomes classification. Protocol becomes a substitute for mercy.

The design language must be seductive enough that the player understands why people chose it.

### Regime C — Paradise: recognition, not reward

Not a victory screen. Old wood, candle white, smoke-dark icons, wet boots near the narthex, tired priest, small living color, gold that finally belongs somewhere. Paradise is not saturated heaven; it is a place where names were already known.

Design Paradise only as a future visual grammar anchor. Do not implement in the prototype.

---

## 3. Material vocabulary

A controlled list of substances the world is made of. Anything not on this list needs a flag.

| Material | Where | Visual signature | Sound | Symbolic load |
|---|---|---|---|---|
| Damp vellum | UI, notebook, icon panels | warm-cream texture, faint ribs | soft page turn | the page where names are kept |
| Graphite | notebook, marginalia, bug-state cursor | smudged 1-pixel line, never crisp black | pencil scratch | imperfect memory |
| Cedar | dog, cabin, beams, boards | warm brown with grain, slight green undercast | dry creak | presence; absent son; unburnt fire |
| Wool | bed, compress, gloves | matte, slightly fuzzy edge | muted shuffle | shared warmth |
| Iron / rust | trusses, fences, old badges | cold ochre with bleed | dull tap | the Iron Ledger; institutions |
| Salt | wash, road, dish | white granular, cold blue undertone | crystalline patter | dignity; preservation |
| Iodine | dressing, wound, label | dark amber stain | (silent) | medicine that works |
| Damp pine / rot | road, ditch, ironwood floor | mottled brown-green | wet step | the Turn left in soil |
| Lake water (patterned) | thresholds, bottom of frames | stylized waves in lake-deep on lake-slate | hush | crossing; chaos held |
| Candle wax | cabin, bedside, narthex | candle-pure with ember-glow rim | hiss | attention |
| Hospital linen | future Wittehaven only | flat witte-white, no fold | crisp paper sound | seductive cleanliness |
| Cold breath | character idle | 1–2 pixel puff of candle-white | (silent) | aliveness in cold |
| Snow that does not stay | road, cabin doorstep | candle-pure dots, low density | (silent) | non-persistence |

**Forbidden materials in the prototype.** Plastic with logos, neon, glass display screens, glossy ceramic, chrome, blood pools, gore, photorealistic skin, sparkles.

---

## 4. Symbolic vocabulary

Each symbol has a **gameplay use** and a **risk if overused**. Do not deploy without both anchors.

| Symbol | Gameplay use | Visual treatment | Risk if overused |
|---|---|---|---|
| Halo | Sacred disclosure on Paradise beats | Gold ring, no glyph; only via `.halo-active` class | Becomes decoration |
| Cross | Marker on rare Bethany surfaces; converted to signage in Wittehaven future | Always wood, never gilded in Ironwood | Cheapens at sight |
| Cedar dog | Locked pouch slot; presence anchor | Carved wood, uneven ear, knife-mark on flank | Becomes mascot |
| Notebook | Memory; consequence record | Damp vellum + graphite hand | Becomes collectible card |
| Ember vial | Tempting bypass; one slot | Single intense ember-red glyph + glow | Becomes power-up |
| Dragon / serpent | Pressure, accusation, the Iron Ledger | Dragon-red contour at margin, symbolic only in P0 | Becomes literal P0 enemy sprite (post-P0 antagonist art may use dragon/serpent imagery deliberately) |
| Patterned water | Threshold; chaos held | Stylized waves at frame bottom | Becomes wallpaper |
| Apple | Birdie's refusal | Single-pixel red on cedar surface | Becomes inventory item |
| Stone (margin) | Burden visualization | Smooth gray weight in notebook margin | Becomes stat tooltip |
| Manuscript marginalia | Page edges of major panels | Thorny vines, faint icon borders | Becomes decoration |
| IC XC NIKA plate | Paradise-only register | Cinzel wide-tracked, double frame | Becomes logo |

---

## 5. Camera & composition rules

- **Top-down or slight three-quarter.** Never first-person, never side-scroll, never cinematic dolly.
- **Fixed framing per scene.** Camera does not follow Kalev like a lens; it cuts on threshold.
- **Symmetry is sacred.** When symbolic content is in play (Sit at bedside, mid-craft Wheel, icon-panel beat), center symmetrically. Otherwise prefer left-aligned, ragged-right, manuscript-block.
- **Margins are wide.** Manuscript proportions; never edge-to-edge type.
- **Two columns max** for body content, with a margin glossary column (manuscript marginalia) — the right place for Burden's stone, Pressure's tremor mark, and Ember warnings.
- **Fixed UI placement.** Kalev state overlay top-left ≤ 280×72px. Pouch bottom-left. Notebook bottom-right. Never centered. Never floating.
- **Icon-panel beats are still images.** Cabin death, Bethany triage outcome, Mackinac crossing. Not in normal play. Use the manuscript double-frame (2px ink + 1px inner rule at 8px inset).

---

## 6. Color-use laws

The full token set lives in `colors_and_type.css`. These are the **laws** that govern its use.

1. **Vellum / ink / lake is the substrate.** Most pixels in any frame are some variant of `--vellum-warm`, `--ink`, `--ink-soft`, `--damp-ash`, `--lake-slate`, `--lake-deep`, or `--cedar-brown`. If a screen is not majority-cold, defend it.
2. **Gold is sacred.** `--icon-gold` is reserved for: halos, page-77 line, Paradise plates, focus-outline (sacred focus), and the rare narrative reveal. Never as button fill, never as headline color.
3. **Ember red is one mark.** `--ember-red` appears as a *single intense glyph* — the vial in pouch, the Ember verb on the patient panel, a restrained glint on the Ember vial when actively handled. Never as a fill area > 32×32px.
4. **Dragon red is accusation.** `--dragon-red` for the Iron Ledger, danger overlays, Wittehaven case-rejection stamp. Never used in Ironwood except for the Iron Ledger's literal appearance.
5. **Verdigris signals unease.** `--verdigris` is the spiritual-unease tint — old hospital paint, copper before Wittehaven, the page where something is wrong but unnamed.
6. **Wittehaven owns blue-white.** `--witte-white`, `--witte-blue`, `--witte-cool` belong to Wittehaven. Do not bleed them into Ironwood. (The exception: Kalev's hospital-language fragments under stress may briefly tint a verb chip witte-cool. Use rarely.)
7. **Pale healing green is small.** `--pale-heal` for Pulseleaf, Lena's accents, Bethany. Never as background fill.
8. **No SaaS gradients.** A single soft gradient may protect text over a busy panel. Never decorative. Never blue→purple.
9. **Color is never the only cue.** Every color signal pairs with a shape, a position, or a typographic register. Accessibility minimum: full-experience playable in monochrome.
10. **Grain over flatness.** Vellum surfaces carry a 1–3% noise texture. Pure flat color reads as Wittehaven; reserve flatness for it.

---

## 7. Motion laws

- **Default duration 260ms; ease `--ease-quiet`.** Slow, like pencil and breath.
- **Wittehaven snaps at 160ms / `--ease-witte`.** The clinical regime is *more* responsive — deliberately seductive.
- **Paradise is almost still (520ms / quiet).**
- **No bounces. No spring overshoots. No icon "pings."** Nothing in this world celebrates motion.
- **Breath loop — 1800ms sinusoidal opacity 0.85↔1.0.** On the dying-boy sprite, candles, Ember vial idle, Kalev's chest at rest.
- **Ember flash — 220ms warm-flash + 600ms desaturation/cool-clarity.** Only on Ember self-use. The desaturation phase is the moment Numbness rises — do not lose it.
- **Hand tremor — 90ms ±0.5px translateX wobble.** On cursor and Tincture-Wheel pointer when Pressure is high. Never on the wheel itself.
- **Page turn — 320ms, soft easing, slight paper sound.** Notebook open/close.
- **Halo bloom — 800ms slow rise from 0 to `--shadow-halo`.** Paradise reveals only.
- **Threshold cut — 0ms.** Crossing into a new scene cuts; it does not fade. (Ironwood → Bethany → road north.)

---

## 8. Sound laws

Audio is **diegetic-first**. Music does not over-explain emotion.

- **Foley before score.** A Bethany scene should be carried by kettle, breath, wool, cup, pencil — not by strings.
- **Score is rare and tonal.** Drone with a single voice. Never melodic resolution at care moments. No swells on Ember use.
- **Wittehaven owns the fluorescent hum.** It's the seductive background of relief — and the first thing the player will miss on the road north.
- **The notebook has its own audio.** Page turn, pencil scratch, leather creak. The notebook's audio is the player's confidant; do not dilute it.
- **Silence is a tool.** Miriam's death moment may have only Kalev's breath and the pencil. Do not score it.
- **No celebration sounds.** No flourish on a recipe completion. Quality is signaled by a clean kettle sound at sound-quality, a slightly bitter note at rough-quality. The player learns by ear.

---

## 9. Negative manifesto — what the P0 prototype must not become

Each *not* states the **correct P0 alternative**. These are aesthetic /
tonal anchors for the prototype slice. Some (loot, hospital sim, morality
meter) describe **mechanics that are out of P0 scope but open for post-P0
expansion**; others (cartoon villainy, exposition-machine NPCs, mascot
Birdie) are perpetual character / tonal locks that survive into any later
layer. Read the list as: *the prototype is not yet these things, and even if
later packets add adjacent mechanics, the contemplative core remains the
ground.*

- **Not** Stardew with darker colors. → A care-pilgrimage where movement is small and attention is the resource. *(Farming systems may layer in post-P0; the P0 must read as care first.)*
- **Not** a cozy apothecary game. → An apothecary game where the apothecary is exhausted and partly numb.
- **Not** medical fantasy where the right recipe saves everyone. → Medicine that works, sometimes, partially, and does not redeem.
- **Not** a survival loot game *in P0*. → Foraging that reads as gathering for named persons under pressure. *(Tiered loot / rarity may layer in post-P0 as a deliberate extension; the P0 ingredient surface is hand-named, not graded.)*
- **Not** a hospital management sim *in P0*. → A bedside game where a single person occupies the screen. *(Larger-scale care management may be designed in post-P0.)*
- **Not** generic Christian allegory. → A polyphonic naming system: folk / sanctioned / mystical, not preached.
- **Not** medieval fantasy. → Post-Turn Michigan: lake-effect, rusted trusses, road salt, cedar.
- **Not** zombie horror. → An illness that fades people; bodies remain dignified.
- **Not** misery porn. → Grief carried with humor and craft; small relief is real.
- **Not** a morality meter *in P0*. → Burden, Pressure, Numbness — perceptual states, not scores. *(If post-P0 layers introduce reputation/alignment systems, they must layer above the body-state core, not collapse it into a single bar.)*
- **Not** a spreadsheet with stained paper *in P0*. → Tactile UI where numbers do not reach the P0 player. *(Post-P0 RPG progression may expose numbers in dedicated character-sheet surfaces, never in the bedside Patient Panel.)*
- **Not** a gallery of religious illustrations with a playable character pasted on top. → Gameplay primary; sacred grammar structures the screen, doesn't decorate it.
- **Not** Wittehaven as cartoon villainy. → Wittehaven as relief that becomes recognition that becomes refusal.
- **Not** Ember as obviously evil. → Ember as effective, scarce, and tempting; misuse is *Strange Fire*, named only after.
- **Not** Birdie as mascot. → Birdie as inconvenient holy fool: refuses food at wrong moments, names what Kalev misses.
- **Not** Lena as lecturer. → Lena as embodied competence with stained fingers; presence over speech.
- **Not** Halloway as fool. → Halloway as a man whose sanctioned register is half a disguise.
- **Not** Rafe as exposition machine. → Rafe held off-prototype; appears only by rumor.

---

## 10. The six-line player image (use to test any decision)

> A named person is fading in a cold room.
> There is cloth, salt, water, a bitter leaf, a cedar toy, a pencil, a vial, and not enough time.
> The player's hand shakes.
> The interface asks whether they are attending to a person or controlling an outcome.
> The road north is wet.
> Somewhere ahead, there are clean sheets.
> The notebook waits.

If a design choice contradicts these lines, it is wrong. If it inflects them, it may be right.
