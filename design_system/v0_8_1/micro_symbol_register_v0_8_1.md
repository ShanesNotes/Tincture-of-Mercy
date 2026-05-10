# Micro-Symbol Register — v0.8.1

A list, not a glossary. Every entry is a **design tool**: each carries a place to appear, a gameplay use, a visual treatment, a symbolic function, and a stated risk if overused. If you cannot fill the **risk** column for a new symbol, it is not ready.

---

## Schema

| Field | Required | Notes |
|---|---|---|
| Object / detail | yes | The thing |
| Where it appears | yes | Scene + UI surface |
| Gameplay use | yes | What the player *does* with it |
| Visual treatment | yes | Concrete pixel/CSS spec |
| Symbolic function | yes | What it carries |
| Risk if overused | yes | What it becomes if mishandled |

---

## 1. Kalev

### 1.1 Leather notebook
- **Where.** Bottom-right HUD; opens to full panel; appears in cabin, road, Bethany, rest screen.
- **Gameplay.** Holds the names of attended persons; auto-paginates by encounter; player writes name on Sit-after-death or recovery.
- **Visual.** 280×220px panel, vellum-bone, lined `repeating-linear-gradient` at 20px, leather corner gussets in `--cedar-brown`. Open animation 320ms.
- **Symbolic.** Memory under cold. The thing the world cannot take.
- **Risk.** Becomes a collectible card binder. *Mitigation:* never show progress count; never list "unfilled" pages.

### 1.2 Page 66, line 7
- **Where.** Notebook. Existing entry on first open.
- **Gameplay.** Read-only on prototype; player learns the precedent before writing their first line.
- **Visual.** Hand-script entry — *"Eli Keene. The breath left before the name did."* — graphite-soft `--ink-soft`.
- **Symbolic.** The cabin's already-ended.
- **Risk.** Becomes lore-dump. *Mitigation:* one line. Never expanded.

### 1.3 Page 77, line 7 (future only)
- **Where.** Reserved page; not implemented in prototype.
- **Symbolic.** The line that will be written *or refused* in the Wittehaven sequence.
- **Visual.** Reserved blank line with a faint `--icon-gold` rule beneath. The only gold on the notebook.
- **Risk.** Spoiling reverence by foreshadowing too directly. *Mitigation:* do not show in prototype; flagged for v0.9+.

### 1.4 Cedar dog
- **Where.** Pouch slot 1 (locked); cabin shelf in opening; Kalev's hand on rest.
- **Gameplay.** Always carried. Cannot be dropped. Right-click reveals a single line of text that changes per chapter.
- **Visual.** 14×14 sprite, `--cedar-brown` body, `--rot-brown` knife-mark on flank, **uneven left ear** (always 1px shorter).
- **Symbolic.** The son. Presence. Unburnt fire.
- **Risk.** Becomes mascot. *Mitigation:* never animated. Never speaks. Never reacts.

### 1.5 Uneven ear
- **Where.** Cedar dog sprite, every appearance.
- **Gameplay.** Hover tooltip on first encounter only: *"He carved it before he knew how."*
- **Visual.** Left ear 1px shorter than right. Always. In all art.
- **Symbolic.** Imperfection that proves a hand made it.
- **Risk.** Becomes a "find the symbol" puzzle. *Mitigation:* never highlighted, never quest-tied.

### 1.6 Knife mark on the cedar dog's flank
- **Where.** Cedar dog sprite, every appearance.
- **Gameplay.** None.
- **Visual.** 2-pixel `--rot-brown` slash on the flank.
- **Symbolic.** The hand that carved was not yet skilled. Everything is incomplete.
- **Risk.** Reads as damage. *Mitigation:* never grows or changes. Static.

### 1.7 Old badge / age 33
- **Where.** Kalev's pack; readable via Sit-then-Observe-self in cabin only.
- **Gameplay.** One-time disclosure: shows *"K. WARD · 33 · CCRN"* in `--mono-witte`.
- **Visual.** Faded plastic card, edges curled.
- **Symbolic.** He was once sanctioned. He still has the language.
- **Risk.** Becomes backstory dump. *Mitigation:* never repeats; not catalogued.

### 1.8 Ember vial
- **Where.** Pouch slot 16 (always last); patient panel "Ember" verb when usable. *(v0.8.1: corrected from slot 8.)*
- **Gameplay.** 2 doses at game start. Doses never replenish. Self-use raises Numbness; patient-use saves a body, leaves Numbness, may write *Strange Fire* in the notebook.
- **Visual.** 12×16 glass vial with `--ember-red` liquid; `--shadow-ember` glow on idle (1800ms breath).
- **Symbolic.** Effective bypass. Strange Fire when used to escape what should be borne.
- **Risk.** Becomes an obvious sin. *Mitigation:* it must *work*. The first use should feel like relief.

### 1.9 Medicine pouch
- **Where.** Bottom-left HUD; cedar leather; 16 slots in 8×2.
- **Gameplay.** Holds craftables and ingredients. Cedar dog locked; Ember always last; middle slots for ingredients.
- **Visual.** Cedar-brown leather background; vellum slots; ember slot tinted on Ember presence.
- **Symbolic.** What he carries that the world does not provide.
- **Risk.** Becomes loot inventory *in P0*. *P0 mitigation:* small grid, hand-named slots ("salt", "honey", "cotton"), no rarity tiers in the prototype. Tiered loot / rarity may layer in post-P0 packets through a separate inventory surface — not by retrofitting tiers into the cedar pouch.

### 1.10 Pencil graphite in damp paper
- **Where.** Notebook; brief micro-animation when Kalev writes.
- **Gameplay.** Drives the "Write the name" verb. Takes ~3 seconds — long enough to be intentional.
- **Visual.** 320ms graphite-stroke animation; 1px line, slightly smeared at end.
- **Symbolic.** Memory imperfectly inscribed.
- **Risk.** Becomes typing minigame. *Mitigation:* no input rhythm; player just holds.

### 1.11 Hand tremor
- **Where.** Cursor; Tincture-Wheel pointer; ingredient drop animation.
- **Gameplay.** Activates when Pressure ≥ "shaking". Affects crafting precision: harder to land *sound* quality.
- **Visual.** `.tremor` class — 90ms ±0.5px translateX keyframe.
- **Symbolic.** The body refuses to be a tool.
- **Risk.** Becomes nausea-inducing. *Mitigation:* never on the world; only on cursor and pointer.

### 1.12 Hospital-language fragments under stress
- **Where.** Brief substitution in patient panel descriptors when Pressure ≥ "shaking" *and* Numbness ≥ "slight distance".
- **Gameplay.** Symptom labels temporarily render in `--mono-witte`: *"breath thin"* becomes *"RR 6"* for ~1s before reverting.
- **Visual.** No transition; cuts.
- **Symbolic.** The trained response surfacing through grief.
- **Risk.** Becomes a Wittehaven preview / cool effect. *Mitigation:* rare, brief, accompanied by a tiny step-down in audio.

---

## 2. Lena

### 2.1 Repaired gloves
- **Where.** Bedside frames; idle animation; Bethany triage.
- **Gameplay.** Visual identifier; no mechanical effect.
- **Visual.** Wool gloves, palm patched in different `--cedar-brown`, fingers cut at first knuckle.
- **Symbolic.** Skill maintained without ceremony.
- **Risk.** Becomes signature accessory. *Mitigation:* never centered in framing; always part of the bedside action.

### 2.2 Candlelit stitching
- **Where.** Bethany sickroom evening; idle animation when no patient is critical.
- **Gameplay.** Lena returns to stitching when not engaged. Player can interrupt.
- **Visual.** 4-frame loop, 320ms per frame, candle-pure highlight on needle.
- **Symbolic.** Care continued even when no one is watching.
- **Risk.** Becomes set-dressing. *Mitigation:* she actually finishes a thing — by end of slice, a folded square is on the bench.

### 2.3 Stained fingers
- **Where.** Lena's hand sprites; close-up on Sit-with-Lena conversation frame.
- **Gameplay.** None.
- **Visual.** Iodine-amber on right index and thumb.
- **Symbolic.** Real work has marked her.
- **Risk.** Reads as wound. *Mitigation:* matched to iodine bottle on her shelf.

### 2.4 Practical bedside presence
- **Where.** Whenever Lena is on-screen during patient interaction.
- **Gameplay.** Her presence reduces Pressure tremor by one step. She does not heal.
- **Visual.** Subtle: tremor wobble drops from ±0.5px to ±0.3px when she is within ~2 tiles.
- **Symbolic.** Companionship is real medicine, distinct from the medicine.
- **Risk.** Becomes buff aura. *Mitigation:* never named; never visible as a UI cue. Player notices over time.

### 2.5 No Tincture
- **Where.** All Lena scenes.
- **Gameplay.** Lena cannot craft. Cannot use the Wheel.
- **Visual.** No pouch on her belt. Bare hands.
- **Symbolic.** Care without instrumentation.
- **Risk.** Reads as helpless. *Mitigation:* she is competent at *Sit, Wash, Warm, Write* — verbs Kalev uses too.

### 2.6 Presence without sermonizing
- **Where.** All dialogue.
- **Gameplay.** Lena's lines are short; she names the present moment, never explains it. Max 12 words per line.
- **Symbolic.** Theology that doesn't theologize.
- **Risk.** Becomes wisdom-figure. *Mitigation:* she is also tired, occasionally curt, sometimes wrong.

---

## 3. Birdie / Ruth

### 3.1 Apple refusal
- **Where.** Ironwood Road, scene-3 entry; replays at one Bethany beat.
- **Gameplay.** Player offers apple → Birdie does not take it. Apple stays in pouch. The verb "Offer" remains available; she remains unwilling.
- **Visual.** Single-pixel red on cedar bench surface (the apple); Birdie's hand frame retracts to side.
- **Symbolic.** The first refusal that doesn't fit the world's rules.
- **Risk.** Reads as broken NPC. *Mitigation:* she names what she does want — *"I'll wait for the bread."*

### 3.2 Hunger at inconvenient moments
- **Where.** Bethany triage middle beat; rest screen; second night.
- **Gameplay.** Birdie says she's hungry exactly when Kalev cannot stop. The player must choose: pause to feed, delegate to Lena, or refuse.
- **Visual.** No cue. She just says it.
- **Symbolic.** The unscheduled need.
- **Risk.** Becomes whining mechanic. *Mitigation:* triggers only once per beat, at most twice in the slice.

### 3.3 Misnaming
- **Where.** First two scenes Birdie shares with Kalev.
- **Gameplay.** She calls Kalev *"Caleb"* the first time she meets him. He does not correct her on-screen.
- **Visual.** Dialogue as is, no asterisk.
- **Symbolic.** Naming preceded recognition.
- **Risk.** Becomes a puzzle ("why does she call him that?"). *Mitigation:* never resolved in prototype.

### 3.4 Noticing what Kalev misses
- **Where.** Bethany triage; rest screen.
- **Gameplay.** Birdie volunteers a perception cue — *"Miriam's hands got cold before her face."* — that the patient panel had not yet surfaced. After her line, the panel updates.
- **Visual.** Brief vellum-bone flicker on the symptom row that updates.
- **Symbolic.** The child sees through the trained eye.
- **Risk.** Becomes hint system. *Mitigation:* one cue per slice, max two.

### 3.5 Refusal to be classed
- **Where.** Bethany; future Wittehaven.
- **Gameplay.** A sanctioned NPC asks her name and place. She gives a name that is not hers.
- **Visual.** Dialogue only.
- **Symbolic.** She knows when not to be known.
- **Risk.** Becomes mystery-box. *Mitigation:* her real name is held until Paradise; do not dangle hints.

### 3.6 Future coat she did not have before
- **Where.** Future regime only; foreshadow in prototype: she is cold and mentions *"when I have my coat."*
- **Symbolic.** She knows her own future provision.
- **Risk.** Becomes prophecy mechanic. *Mitigation:* one mention only.

### 3.7 True name held until Paradise
- **Where.** Reserved.
- **Symbolic.** She is *Ruth*. Player learns this only on the Paradise threshold.
- **Risk.** Becomes a "secret name" reveal trope. *Mitigation:* delivered without flourish.

---

## 4. Bethany

### 4.1 Chipped cups
- **Where.** Sickroom shelf; cup near each patient bed.
- **Gameplay.** Used in Salt Wash and Pulseleaf Draught crafts. The chip is cosmetic.
- **Visual.** 8×8 vellum-warm sprite, 1px chip in `--ink`.
- **Symbolic.** Every vessel has been used.
- **Risk.** Becomes texture noise. *Mitigation:* the chip is in the same place on every cup; players notice the consistency.

### 4.2 Shared blankets
- **Where.** Sickroom; Bethany rest area.
- **Gameplay.** Player can take a blanket from one bed to warm another. There are not enough.
- **Visual.** Wool sprite, two patterns (loomed gray, plaid red-brown), both faded.
- **Symbolic.** Resource that requires deciding whose warmth.
- **Risk.** Becomes a numbers puzzle. *Mitigation:* the choice is between two named persons, never a queue.

### 4.3 Improvised sickroom
- **Where.** Bethany interior.
- **Gameplay.** The room is the kitchen. The work surface is the table. The bed is a moved sofa.
- **Visual.** No medical signage. Hearth in corner. Iodine bottle next to a cup of tea.
- **Symbolic.** Mercy in a place that wasn't built for it.
- **Risk.** Reads as low-budget. *Mitigation:* visible care in the arrangement — folded cloth, ordered jars.

### 4.4 Village doctor as patient (Dr. Amos Bell)
- **Where.** Third Bethany bed.
- **Gameplay.** The Ember dilemma. Bell is conscious; he asks for E-7 by name. He knows the dose.
- **Visual.** Reading glasses on his chest. Sleeves rolled up. Old stethoscope draped on the bedpost — the only medical apparatus on screen.
- **Symbolic.** *Physician, heal thyself.* The one who knows medicine asks to be saved by it.
- **Risk.** Becomes Lazarus exposition. *Mitigation:* no character mentions Lazarus. The scene undertone carries it.

### 4.5 The road bending north
- **Where.** Bethany exit; visible from the rest screen.
- **Gameplay.** Player walks toward it; scene transition cuts on threshold.
- **Visual.** Wet road in `--lake-slate`; tilts northeast; faint blue-white tint at the far edge.
- **Symbolic.** Wittehaven, by rumor.
- **Risk.** Becomes nav arrow. *Mitigation:* no waypoint marker; the bend is the cue.

---

## 5. Wittehaven future foreshadow (prototype: rumor only)

### 5.1 White paint
- **Where.** Single Bethany prop: a stack of paint cans by the road north, unopened.
- **Gameplay.** Inspect: *"Sanctioned white. They paint the rot over."*
- **Visual.** Witte-white cans on cedar pallet.
- **Symbolic.** Future cleanliness as cover.
- **Risk.** Becomes lore-prop. *Mitigation:* one mention.

### 5.2 *Faith over Fear* banner
- **Where.** Reserved (Wittehaven outskirts in v0.9). In prototype: a torn ribbon on the road.
- **Visual.** Witte-white cloth, witte-cool letters partial.
- **Symbolic.** Sanctioned slogan that sounds true and is not.
- **Risk.** Becomes parody. *Mitigation:* legible reading, not a punchline.

### 5.3 Cross converted into signage
- **Where.** Reserved.
- **Symbolic.** When the cross becomes a directional arrow.
- **Risk.** Becomes blunt allegory. *Mitigation:* shown, never narrated.

### 5.4 Case IDs
- **Where.** First glimpse: Bell mentions his old case number under stress.
- **Visual.** `--mono-witte` *"0044-B"* spoken aloud.
- **Symbolic.** The shorthand the world used and discarded — and re-adopted.

### 5.5 Repainting Ritual
- **Where.** Reserved (Wittehaven slice).
- **Symbolic.** A community ritual of covering rot with witte-white. Beauty as denial.

### 5.6 Paint smell covering rot
- **Symbolic.** Wittehaven owns the smell of fresh paint over old wood. Foreshadow only.

### 5.7 Warm foster house as classification
- **Symbolic.** The house is warm because the children are catalogued.
- **Risk.** Becomes blunt. *Mitigation:* the warmth is real; the classification is the cost.

### 5.8 Clean sheets as temptation
- **Where.** Bethany rest screen has *one* clean sheet, unused, in a stack. Inspect: *"Came up from Wittehaven. They have stacks."*
- **Symbolic.** The first thing the player will want.
- **Risk.** Becomes punchline. *Mitigation:* the player isn't told it's bad.

---

## 6. World

| Detail | Where | Visual signature | Symbolic |
|---|---|---|---|
| Lake-effect clouds | Sky band, all outdoor scenes | Long horizontal `--lake-slate` strips | Pressure that doesn't rain |
| Wet wool | NPC garments | Matte fuzzy edge in `--damp-ash` | Carried damp |
| Iodine | Bedside, Lena's fingers | Amber stain | Medicine that works |
| Rotting pine | Ironwood floor | `--rot-brown` mottled with `--pine-shadow` | The Turn left in soil |
| Cedar | Beams, dog, cabin | Warm brown with grain | Presence |
| Rusted trusses | Roadside; Bethany rooftop | Dragon-red bleed on iron | Old infrastructure failing |
| Patterned water | Bottom of major panels | Lake-deep waves on lake-slate | Threshold; chaos held |
| Old road salt | Cabin doorstep, road | Candle-pure granular | Dignity preserved at the edge |
| Snow that does not stay | Outdoor scenes | Sparse candle-pure dots | Non-persistence |
| The Ironwood watching | Treeline | Faint icon-gold pinpoint among `--pine-shadow` (very rare) | Attention — not threat |

---

## 7. Spiritual / structural

These are not visible. They **shape** the visible.

| Concept | Game manifestation | Risk if surfaced as text |
|---|---|---|
| Names over cases | Patient panel always shows name in folk register | Becomes slogan |
| Garments of skin | The human body's vulnerability — what care covers | Becomes lore page |
| Strange Fire | Notebook entry written *after* an Ember misuse | Becomes warning popup |
| The Grey Stone | Burden's heaviness — felt, not labeled | Becomes inventory item |
| Burden / Pressure / Numbness | Three perceptual states (see §8 of aesthetic_bible) | Become bars |
| Tobit dog frame | The cedar dog's quiet presence in the journey | Becomes Bible-quoting |
| Caleb / Cain | Birdie's misnaming carries it | Becomes puzzle |
| Page 66 / reserved page 77 | Eli begins the notebook; page 77 line 7 remains future-only | Becomes prototype spoiler tease |
| Outside the camp | Wittehaven's exclusion zones (future) | Becomes plot reveal |
| The enemy is FIRST not flesh and blood | No combat / bosses / health bars in P0; combat layer open for post-P0 | Becomes manifesto |

---

## 8. Use rules

- **A symbol used twice has been used too much.** Most entries above appear *once* in the prototype slice. The Ember vial, the cedar dog, the notebook, and the patient panel are the only repeating symbols. Everything else is a single anchor.
- **Symbols that need narration are not yet symbols.** If a beat requires a character to explain what something means, redesign the beat or remove the symbol.
- **The risk column is the test.** When proposing a new symbol, write its risk first. If you cannot, the symbol is not ready.
