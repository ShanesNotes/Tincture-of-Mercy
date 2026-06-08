# Source Ore Map — Narrative Storyboard Pivot

Status: working story-production artifact  
Owner lane: narrative/storyboard + AI image/video production  
Authority: support artifact; it maps sources but does not override `CONTEXT.md`, ADRs, or the active v0.9 packet  
Created: 2026-05-13

## Purpose

This map identifies the strongest existing project material to mine for a narrative storyboard, AI scene concept art, AI video, and narrative voice-over. It treats game implementation docs as ore: images, motifs, conflicts, scene grammar, sound, and character pressure. It does not treat every source as current canon.

## Authority order for story work

1. `CONTEXT.md` — active glossary and conflict resolutions.
2. `docs/adr/` — accepted decisions and why they exist.
3. `design_system/v0_9_mercy_rpg_substrate/` — active story/system direction for the opening mercy RPG substrate.
4. `design_system/v0_8_1/` — tone, visual grammar, scene composition, names, and art provenance where not contradicted.
5. `docs/lore/` — deep lore and older packets; high-value narrative ore, not automatic active direction.
6. `docs/source/` — raw source intake and nuance; evidence, not direct contract.
7. `art/` and `audio/` — continuity anchors for scene images, concept art, and video prompts.
8. Scratchpads outside the repo — useful if accessible, but never sacred.

## Scratchpad note

The requested scratchpad path was not found at these checked locations:

- `/downloads/tincture-of-mercy-v0.7`
- `/home/ark/downloads/tincture-of-mercy-v0.7`
- `/home/ark/Downloads/tincture-of-mercy-v0.7`

Repo-local v0.7 provenance exists at `docs/lore/tincture_of_mercy_godot_design_handoff_v0_7.md`. Treat it as a historical consolidation, especially for prototype scenes, craft/care grammar, and asset expectations.

## Highest-value story ore

| Source | Authority | Best ore | Use in storyboard |
|---|---:|---|---|
| `CONTEXT.md` | Active | Recognition, presence, Bethany payoff, Hesychasm, bread beat, gravity encounter, wolf encounter, shared substrate. | Guardrail all story cards. Prevent recipe-victory drift and care-only drift. |
| `design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md` | Active after substrate gate | Water, bread, tincture, Anna death/Witness, wolves/Iiro flight/combat. | Primary first-episode sequence. Convert acts into scene cards. |
| `design_system/v0_9_mercy_rpg_substrate/04-latent-paths-receptivity.md` | Active | Apothecary, Hesychasm, Iconographic as forms of attention; receptivity and recognition hooks. | Scene interiority: what Kalev notices, misses, receives, or cannot bear. |
| `design_system/v0_9_mercy_rpg_substrate/05-rpg-economy-progression.md` | Active | Grounded cost, loot/material consequence, progression as event-derived consequence. | Keep combat/aftermath material and embodied rather than symbolic-only. |
| `docs/adr/0007-mother-death-is-a-gravity-encounter.md` | Active decision | Fixed death with meaningful action. | Core tragic grammar: care matters but does not control death. |
| `docs/adr/0008-wolf-combat-is-violent-and-lootable.md` | Active decision | Real protection, danger, violence, possible wolf material. | Keep Act 5 from becoming metaphor-only. |
| `docs/adr/0005-distinguish-voice-registers-and-latent-paths.md` | Active decision | Voice registers vs latent paths. | Prevent terminology confusion in VO and scene cards. |
| `design_system/v0_8_1/aesthetic_bible_v0_8_1.md` | Provenance/support | Michigan icon-manuscript pixel art; Ironwood/Wittehaven/Paradise visual regimes; material and symbolic vocabulary. | Master style bible for image prompts and continuity. |
| `design_system/v0_8_1/scene_composition_bible_v0_8_1.md` | Provenance/support | Scene framing, icon-panel beats, Wittehaven contrast, Bethany triage layouts. | Camera/framing guidance for concept-art panels. |
| `design_system/v0_8_1/art_direction_v0_8_1.md` | Provenance/support | Sprite scale, silhouette laws, palette discipline, visual negative manifesto. | Continuity rules for using pixel-art identity as source anchors. |
| `docs/lore/tincture_of_mercy_v0_3.md` | Deep lore/provenance | Four-phase pilgrimage: Ironwood, Wittehaven, Straits, Paradise; cast; final scene; Ember/Strange Fire; Burden/Pressure/Numbness. | Long-arc storyboard spine and mythic autobiographical transmutation. |
| `docs/lore/tincture_of_mercy_packet_v0_6.md` | Historical packet | Prototype thesis, names over metrics, medicine works but cannot redeem, Wittehaven relief, Tincture Wheel, triage. | Extract core promises and UI/story rituals. |
| `docs/lore/tincture_of_mercy_godot_design_handoff_v0_7.md` | Historical packet | Buildable scenes, patient designs, craftables, state model, notebook entries, dialogue style. | Convert old production specificity into storyboard detail where compatible. |
| `docs/source/2026-05-09-tincture-codex-handoff/primary_sources/opening_slice_design_v2.md` | Source intake | Strong original prose for the five-act cabin/mother/wolves ramp, including borrowed mercy. | Use as high-energy source for scene order and emotional causality, corrected by active docs. |
| `docs/source/2026-05-09-tincture-codex-handoff/primary_sources/latent_paths.md` | Source intake | Tradition-grounded path language and non-Christian player framing. | Nuance for VO and audience translation. |
| `docs/source/2026-05-09-tincture-codex-handoff/primary_sources/three_registers.md` | Source intake | Apothecary/Pastoral/Iconographic origin language. | Historical comparison only; convert Pastoral to Hesychasm in active outputs. |
| `docs/source/tincture_of_mercy_audio_generation_workflow.md` | Support/source | Ambient foundations, foley batches, Act 4 breath-stop mix, wolves/combat cues, body-state automation. | Sound cue field on every storyboard card; later AI video mix direction. |
| `docs/source/sound_design_brief.md` | Support/source | Audio north-star and cue grammar. | Voice-over and sound-bed production. |
| `design_system/v0_9_mercy_rpg_substrate/prompts/` | Active art prompt support | Kalev, Lena, Anna/Mother, Iiro/Boy, Wolf sprite prompts; master template. | Character identity anchors for AI images and video continuity. |
| `design_system/v0_9_mercy_rpg_substrate/10-asset-pipeline.md` | Active art-pipeline support | Source → runtime asset rules and validation expectations. | Keep generated images as source/concept unless intentionally turned into runtime art. |

## Existing visual anchors

| Asset surface | Best ore | Storyboard use |
|---|---|---|
| `art/characters/kalev/` | Kalev design asset, portraits, locomotion/care/tincture/combat sheets. | Lock silhouette: exhausted healer-apothecary, coat, pouch, notebook, cudgel-capable body. |
| `art/characters/anna/` and `art/characters/mother/` | Bedside sheets and reference images. | Anna/Mother fixed-death panels; breathing states; dignity without gore. |
| `art/characters/iiro/` and `art/characters/boy/` | Child references and locomotion sheets. | Bread, fear, flight, later recognition seed. Use one active identity per pass. |
| `art/characters/lena/` | Lena locomotion and reference. | Competent presence; stained hands; future alternative to Kalev's numbness. |
| `art/characters/birdie/` | Birdie idle/design. | Holy-fool interruption; apple refusal; later notebook return. |
| `art/characters/wolf/` | Wolf reference, locomotion/full sheets. | Real danger, not metaphor-only; Act 5 violence and cost. |
| `art/characters/cabin_cast_manifest.md` | Runtime cast inventory and quality boundary. | Fast index for scene-card visual references. |
| `art/environment/source/downloads_20260510_first_drafts/` | Cabin interior/exterior, Ironwood road, yard combat slice, first encounter mock. | Concept-art background and shot-layout references. |
| `art/environment/analysis/downloads_environment_triage.md` | Salvage verdict and extraction order. | Know which environment masters are best for cabin/road/wolf yard panels. |
| `art/environment/preview/` | Runtime tiles/contact previews. | Pixel-art continuity anchors and scene geography. |
| `design_system/assets/reference/` | St. George/dragon, cosmic images, Noah/flood references. | High-symbol reference for icon-panel layer only; avoid decorative overuse. |

## Living autobiographical ore → story transmutation

| Lived source | Story engine | Possible image grammar | Caution |
|---|---|---|---|
| Critical care bedside during COVID | Kalev at the bedside; care under impossible pressure; breath as event truth. | Gloved hands, oxygen/breath motifs translated into cup, cloth, tincture, candle, notebook. | Do not make this a literal hospital memoir unless requested. |
| Corewell/Grand Rapids institutional setting | Wittehaven as seductive relief and sanctioned control. | Clean grids, fluorescent hum, case charts, white-blue hospital linen, doors that work. | Keep Halloway/system partly right; no cartoon villainy. |
| Loss of wealth/marriage/job | Exile from civic identity; road north; stripping of old competence. | Empty badge, wet boots, notebook, road salt, abandoned thresholds. | Avoid one-to-one exploitation of real persons. |
| Addiction/despair | Ember as effective relief with cost; Pressure converted into Numbness. | Red vial as one mark; narrowed faces; efficient hands losing names. | Keep substance morally neutral; focus on use, temptation, and cost. |
| Recovery/mercy | Recognition, presence, names remembered. | Graphite names, Paradise book, wet notebook returned, hand on shoulder. | Payoff is being known, not technical success. |

## Storyboard extraction lanes

1. **Opening witness lane** — cabin, water, bread, tincture, Anna death, wolves, borrowed mercy.
2. **Institutional temptation lane** — Bethany into Wittehaven, clean relief, charting, case language, Birdie classified.
3. **Addiction/Ember lane** — Pressure, Numbness, competence restored, perception narrowed, names at risk.
4. **Exile/pilgrimage lane** — road north, Mackinac, notebook loss, Rafe, bridge/bread.
5. **Recognition lane** — Bethany payoff, Paradise, names already known, wife's name finally written.

## Immediate production recommendation

Start with a ten-card first-pass storyboard:

1. Bedside before explanation.
2. Water.
3. Bread.
4. Tincture.
5. Anna death / Witness.
6. Wolves / Iiro flight.
7. Borrowed Mercy.
8. Wittehaven relief.
9. Iron Ledger / exile.
10. Paradise / notebook returned.

This sequence gives a complete short-film arc while preserving the larger game/lore future.

## Council comparison questions

Use these when comparing with the other council agent:

- Did they choose literal memoir framing or mythic transmutation?
- Did they preserve recognition/presence over recipe victory?
- Did they keep Wittehaven seductive before judgment?
- Did they treat Ember as effective relief with cost, not obvious evil?
- Did they use the 2D pixel-art project as continuity anchor rather than abandon it for generic cinematic AI imagery?
- Did they make scene cards production-ready for image/video/VO, not just outline plot?

## Council-report additions accepted into the ore map

A later council report usefully identified several high-yield veins. These are adopted with active-canon caveats:

| Addition | Source confidence | How to use |
|---|---:|---|
| **Eli Keene as precedent prologue** | Strong v0.7/v0.8.1 provenance, not active-v0.9 replacement. | Candidate cold-open: page 66 line 7 already bears a name before Anna/Iiro. Use if the story needs a baseline wound before the active opening slice. |
| **Komboskini / prayer rope** | Strong source-intake support in `latent_paths.md`. | Introduce after Bethany as visible Hesychasm practice; fingers on knots replace explanatory dialogue. |
| **Named lights** | Strong v0.8.1 support in `scene_composition_bible_v0_8_1.md`. | Add light noun to every scene card: the hearth, lake-light, receding light, working light, fluorescent leak, Paradise candle-white. |
| **Disclosure envelope** | Strong v0.8.1 support. | Every emotional mark gets at least 600ms bed-layer-only silence; longer holds can be specified by scene. |
| **Notebook as visual protagonist** | Strong v0.7/v0.8.1/lore support. | Use notebook insert shots as connective tissue and moral clock. |
| **Mechanic → symbol translation** | Strong active-v0.9 fit. | Threat table becomes gaze; protection line becomes body-as-door; Numbness becomes desaturation/flattened eyes. |
| **Concept paintings as video seeds** | Practical production judgment. | Use environment concept PNGs as video style seeds; use pixel sheets for pose/silhouette consistency. |

## Candidate prologue source cluster

Use these together if building the Eli prologue:

- `docs/lore/tincture_of_mercy_godot_design_handoff_v0_7.md` — Eli Keene, page 66 line 7, prototype cabin scene.
- `design_system/v0_8_1/scene_composition_bible_v0_8_1.md` — held frame/disclosure rules for cabin death.
- `design_system/preview/notebook-entry.html` and `design_system/ui_kits/game/index.html` — page 66 / line 7 visual language.
- `docs/lore/tincture_of_mercy_v0_3.md` — seed-scene prose and page 77 closure.

Guardrail: do not let Eli replace active Anna/Iiro unless the project intentionally chooses a v0.7/v0.8 continuity pivot. Treat Eli as prologue ore.
