# Storyboard Bible — Tincture of Mercy Narrative Pivot

Status: working story-production bible  
Owner lane: narrative/storyboard + AI image/video production  
Authority: support artifact; does not supersede active canon docs  
Created: 2026-05-13  
Companion docs: `docs/story/SOURCE_ORE_MAP.md`, `docs/story/NARRATIVE_STORYBOARD_DECK_V0_1.md`

## 1. Pivot statement

This pass shifts *Tincture of Mercy* from game implementation toward story extraction and narrative visualization. The game project remains valuable as a worldbuilding mine: its lore, sprite prompts, concept art, audio brief, UI grammar, and scene mechanics become raw material for a narrative storyboard that can feed AI concept art, AI video, and voice-over.

The target is not to abandon the 2D pixel-art game identity. The target is to use it fully: pixel-art assets lock continuity, while higher-detail icon-panel concept art explores cinematic scenes that later can be retranslated into game assets or video.

## 2. Working story thesis

A healer who once knew what to do with his hands learns that medicine works, but cannot redeem. He survives by converting unbearable Pressure into Numbness. He loses names when he treats people as cases. The pilgrimage is not toward mastery but toward presence: to remember persons, to be present when rescue fails, and to discover that the names were already held.

## 3. Lived-source transmutation

The user's lived source matters:

- critical care bedside work during COVID;
- institutional healthcare pressure at Corewell Health Grand Rapids;
- aftermath involving loss of wealth, marriage, job, and descent into addiction/despair.

This bible treats that material as **deep source**, not as literal obligation. The default mode is mythic transmutation:

| Lived source | Story transmutation | Visual/story sign |
|---|---|---|
| Bedside COVID care | Kalev attending breath under impossible stakes. | Breath, water, cloth, fever, gloved/steady hands translated into apothecary care. |
| Institutional healthcare | Wittehaven as relief that becomes control. | Clean beds, blue-white light, charts, case IDs, fluorescent hum. |
| Loss of old identity | Exile from competence and civic belonging. | Wet road, old badge, empty house threshold, notebook heavier than gear. |
| Addiction/despair | Ember: effective relief with cost. | One red vial, narrowed perception, faces losing names, efficient hands. |
| Mercy/recovery | Recognition and presence. | Graphite names, returned notebook, spoken name, hand on shoulder. |

### Ethical guardrails

- Do not mine real people as characters without explicit permission and transformation.
- Do not turn addiction into villainy. Ember is effective relief with spiritual cost when misused.
- Do not frame healthcare workers as villains. Wittehaven must first feel like relief and must be partly right.
- Do not reduce grief to content. Every scene must justify itself by revealing personhood, consequence, or mercy.

## 4. Canon guardrails

Use these in every storyboard card and image prompt:

- **Recognition/presence over recipe victory.** The Bethany payoff is that presence is remembered; a corrected recipe is Apothecary-layer learning, not salvation.
- **Hesychasm is active terminology.** Pastoral is historical/source language only.
- **Bread beat, not porridge, in active v0.9.** Bread is ordinary mercy under constraint.
- **Mother death is a gravity encounter.** Fixed death, meaningful actions, no fake failure.
- **Wolves are real combat.** Act 5 can be violent, risky, and loot/material-consequential; Iiro safety is the objective.
- **Shared substrate as story grammar.** Care, combat, witness, recollection, economy, notebook, and aftermath share one truth: what happened is remembered.
- **Do not generalize v0.8.1 care-only P0 limits.** Older limits are scoped provenance, not project-wide doctrine.

## 5. Visual north star

The art phrase remains:

> **Michigan icon-manuscript pixel art.**

For storyboard and AI video work this becomes two linked visual layers:

### Layer A — Pixel-art continuity layer

Use existing project assets as continuity anchors:

- Kalev silhouette, coat, pouch, notebook, worn healer-apothecary body.
- Anna/Mother bedside breathing sheet.
- Iiro/Boy locomotion and fear/trust posture.
- Lena, Birdie, Wolf, cabin, Ironwood road, Wittehaven scaffolds.
- Palette discipline: ash, lake-slate, damp vellum, cedar, graphite, candle-white, earned gold, one ember red.

Purpose: make the storyboard feel born from the game rather than generic fantasy video.

### Layer B — Icon-panel cinematic layer

Use higher-detail generated concept art for scene boards:

- Damaged manuscript page composition.
- Flat symbolic framing, not photoreal cinematic spectacle.
- Damp Michigan materials: road salt, cedar, wet wool, iodine, hospital linen, graphite, rust, lake water.
- Gold only when something eternal presses through.
- Red only for live/dangerous/accusatory fire.

Purpose: produce emotional scene art for AI video, pitch decks, and narrative exploration.

## 6. Voice-over register

Default voice-over should be restrained, first-person or close-third, tactile, and unsentimental. It should sound like a person trying not to narrate his own wound.

Avoid:

- sermonizing;
- lore exposition before image;
- triumph language at care moments;
- clinical jargon unless it marks Wittehaven/sanctioned pressure;
- addiction clichés.

Prefer:

- concrete objects: cup, cloth, pencil, vial, door, breath;
- short lines;
- names over categories;
- admission over explanation;
- silence where the scene carries meaning.

### Voice-over pattern

```text
[Object or bodily fact].
[What Kalev did / failed to do].
[What the world recorded].
[One line of inward truth, usually shorter than the others].
```

Example:

```text
The cup was chipped on the side she touched.
I held it like procedure could make my hand clean.
She drank once, and the room kept breathing around her.
It was not enough.
```

## 7. Scene-card schema

Every storyboard card should include:

```markdown
## NN — Scene Title

- **Narrative beat:** What happens.
- **Emotional wound:** What this costs or reveals inside Kalev.
- **Visible action:** What the audience sees, without needing exposition.
- **Source ore:** Repo docs/art/audio that anchor the card.
- **Characters:** People in frame.
- **Location:** Place and regime.
- **Light noun:** One of the named lights, when applicable: the hearth, the lake-light, the receding light, the working light, fluorescent leak, or Paradise candle-white.
- **HOLD:** Intended held-frame duration or silence envelope.
- **Visual anchor:** Existing art/assets and palette/material notes.
- **Image prompt:** Still concept prompt.
- **Video prompt:** Motion/camera prompt.
- **Voice-over seed:** 1–4 lines.
- **Sound cue:** Ambient/foley/silence note.
- **Continuity notes:** Canon/style restrictions.
- **Council comparison notes:** Alternatives or unresolved choices to compare.
```

## 8. AI image prompt pattern

Use this pattern for still concept art:

```text
Tincture of Mercy, Michigan icon-manuscript pixel art translated into cinematic storyboard concept art, [scene subject], [specific visible action], [location/materials], damp November Michigan, ash light and candle warmth, damaged vellum manuscript framing, graphite marginalia, restrained Orthodox icon-panel composition, flat symbolic perspective, tactile objects, named-person intimacy, palette of lake-slate, cedar brown, damp vellum, ink, candle-white; earned gold only if specified; one ember-red mark only if specified; no gore, no neon, no glossy fantasy, no generic medieval setting, no triumphant game UI.
Continuity anchors: [character art paths / silhouette notes].
Composition: [camera/framing].
Mood: [emotional pressure].
```

### Negative prompt pattern

```text
avoid generic fantasy, cozy apothecary shop, hospital glamour, zombie horror, gore, superhero pose, bright saturated reward colors, decorative halos, photoreal skin pores, anime expression, corporate stock medical imagery, triumphant victory screen, random crosses as wallpaper, excessive red, excessive gold
```

## 9. AI video prompt pattern

Use still panels as first-frame/last-frame anchors when possible.

```text
Slow restrained motion, fixed manuscript-like composition, minimal camera movement, tactile foley-led scene. Animate only [breath/candle/snow/hand/page/wolf movement]. Keep characters grounded in the same silhouettes and costumes as reference images. No dramatic zooms. No victory flourish. Let silence and material sound carry the beat. Duration [6–12 seconds]. End on [object/person/name].
```

## 10. Scene sequence strategy

Build in three escalating passes.

### Pass 1 — Ten-card short-film spine plus candidate prologue

Goal: compare council outputs and discover the strongest narrative order.

0. Candidate prologue: Eli Keene / page 66 line 7.
1. Bedside before explanation.
2. Water.
3. Bread.
4. Tincture.
5. Anna death / Witness, optionally cross-cut with first wolf pressure.
6. Wolves / Iiro flight.
7. Borrowed Mercy.
8. Wittehaven relief.
9. Iron Ledger / exile.
10. Paradise / notebook returned.

### Pass 2 — Opening episode board

Expand cards 1–7 into 30–60 shots, or 00–7 if the Eli prologue is selected. Keep the cabin day/night arc intact: care, medicine, death, combat, self-administration, departure.

### Pass 3 — Pilgrimage proof board

Expand cards 8–10 into Wittehaven, Mackinac, Rafe/Mount Arvon, Paradise, with Birdie and Lena continuity.

## 11. Production pipeline

1. **Mine source** — update `SOURCE_ORE_MAP.md` when new lore/art appears.
2. **Write scene card** — fill schema before generating art.
3. **Select continuity anchors** — list exact asset paths for character/environment references.
4. **Generate still concepts** — produce 3–5 variants per card.
5. **Curate, do not average** — choose the image with the clearest story action and style fidelity.
6. **Generate video** — use still as anchor; animate breath, hand, snow, candle, page, wolf, doorway.
7. **Record scratch VO** — short lines; leave silence.
8. **Review against guardrails** — recognition, presence, Wittehaven relief/control, Ember cost, names.
9. **Back-port learning** — update game art prompts or lore docs only when a storyboard discovery becomes useful.

## 12. Continuity rules for generated art

- Kalev must not become a generic wizard, plague doctor, or cleric. He is a post-Turn Michigan healer-apothecary with hospital memory, road wear, pouch, notebook, and practical clothing.
- Anna/Mother must remain dignified; no horror-body framing.
- Iiro/Boy must remain a person with fear/trust state, not a mascot or quest token.
- Birdie must be odd and practical, not cute mascot energy.
- Lena must be embodied competence, not exposition.
- Halloway/Wittehaven must be seductive, useful, and partly right before they become spiritually dangerous.
- Ember must be small, tempting, effective, costly.
- The notebook records names; never render it as a quest log trophy.

## 13. Council comparison hooks

When comparing with the other council agent, score each proposal on:

1. **Story truth:** Does it preserve the lived wound without becoming literalized exploitation?
2. **Canon fidelity:** Does it respect active v0.9 guardrails?
3. **Visual fidelity:** Does it preserve Michigan icon-manuscript pixel art?
4. **Production usefulness:** Can each card be handed to an image/video model immediately?
5. **Emotional restraint:** Does it avoid melodrama and victory framing?
6. **Future game value:** Does it feed back into the 2D project instead of replacing it?

## 14. Council report integration

A later council pass added several useful production details. Adopt these immediately where they support active canon; keep disputed continuity forks explicit.

### Adopt now

- **Komboskini / prayer rope:** add as the concrete Hesychasm prop after Bethany. Fingers working knots can show prayerful attention without explanatory dialogue.
- **Named lights:** use light nouns as repeatable storyboard vocabulary: the hearth, the lake-light, the receding light, the working light, fluorescent leak, Paradise candle-white.
- **HOLD lines:** every scene card should specify a held-frame or disclosure envelope. Emotional beats end with at least 600ms of bed-layer-only sound unless the shot has a stronger documented hold.
- **Notebook as visual protagonist:** insert notebook shots between major beats. The notebook is a second narrator, not a UI prop.
- **Mechanic-to-symbol translations:** threat tables become gaze; line-of-protection becomes body-as-door; leash becomes cabin gravity; Numbness becomes desaturation and flattened eyes.
- **Silhouette/palette locks:** make character identity explicit in prompt language before generating AI imagery.
- **Voice pressure doubling:** under Pressure, Kalev may briefly slip into hospital-language fragments, then return to tactile folk speech. Use sparingly.

### Accept as candidate, not active lock

- **Eli Keene prologue:** v0.7/v0.8.1 strongly support Eli Keene at page 66 line 7 as a precedent bedside death. Active v0.9 opening work centers Anna/Iiro, so use Eli as a candidate prologue or trailer cold-open, not as a forced replacement for active opening canon.
- **Anna death overlapping wolf combat:** active docs allow replay-order nuance, and the overlap is dramatically strong. Treat this as a storyboard option: wolf pressure may intrude before Anna's final breath, with Iiro's flight and Anna's death cross-cut. Do not erase the gravity encounter; make the overlap intensify it.

### Defer or verify before locking

- Exact cabin coordinates from graybox should guide shot geography, but not become story law unless the Godot scene remains the target staging.
- Musical motif IDs, including `anna.d_phrygian_solo_female`, are valuable if preserved in audio docs; otherwise keep as a proposed motif label.

## 15. Mechanic-to-symbol translation table

| Substrate/game mechanic | Storyboard image | Use |
|---|---|---|
| Attention threat table | Wolf gaze snaps from Iiro to Kalev. | Make protection visible without UI. |
| Line of protection | Kalev's body becomes a door across the threshold. | Show care becoming violent protection. |
| Pack call radius | A second howl answers after the first strike. | Make danger multiply by sound. |
| Leash radius | Wolves remain bound to cabin perimeter. | Frame combat as defense, not conquest. |
| Loot withholding | No stripping when Iiro is still endangered. | Preserve dignity and priority. |
| Death friction | Kalev gets a recovery window; Anna does not. | Show unfair continuation. |
| FSR/Vigil self-dose | Hands steady while eyes flatten. | Ember converts Pressure into Numbness. |
| Burden / Pressure / Numbness | Posture, breath, focus, color saturation. | Never show bars in storyboard. |
| Receptivity tags | Camera shows Kalev seeing before doing. | Care begins as attention. |

## 16. Named lights

| Light noun | Scene family | Visual rule |
|---|---|---|
| The hearth | Cabin | 4-frame warmth/flicker; care source, not triumph. |
| The lake-light | Ironwood day | Flat gray, cold, no flicker. |
| The receding light | Ironwood dusk | Vignette and westward loss. |
| The working light | Bethany | Candle warm plus window cool, never blended. |
| Fluorescent leak | Wittehaven foreshadow | Off-frame cool rim or 1.5s hum; seductive unease. |
| Paradise candle-white | Paradise | Light from no obvious direction; earned gold only by restraint. |

## 17. Open decisions

- How literal should Corewell/Grand Rapids appear? Default: transmute into Wittehaven and hospital-language fragments.
- Should the first public piece be a 10-scene trailer, a narrated storyboard PDF, or an animatic?
- Should Kalev's first-person VO explicitly confess addiction, or should Ember carry it symbolically until later?
- Which child identity should anchor the opening pass: active `Iiro` from v0.9 or older `Eli Keene` from v0.7? Current judgment: Iiro anchors active opening; Eli is candidate prologue/provenance, not replacement.
- Does the story begin at the cabin, or with a pre-Turn hospital memory that visually rhymes with the cabin? Default: cabin first; hospital memory enters through Wittehaven/Ember.
