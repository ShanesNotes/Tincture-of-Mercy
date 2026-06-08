# AI Production Pipeline — Storyboard to Image, Video, and Voice

Status: working production guide  
Owner lane: narrative/storyboard + AI image/video production  
Authority: support artifact; follows `STORYBOARD_BIBLE.md` and `NARRATIVE_STORYBOARD_DECK_V0_1.md`  
Created: 2026-05-13

## Goal

Turn each storyboard card into a repeatable AI production unit: reference pack → still concept variants → selected keyframe → video shot → voice-over/audio bed → review.

## Folder convention

Recommended future output structure:

```text
art/storyboard/
  v0_1/
    01_bedside_before_explanation/
      references.md
      prompts.md
      stills/
      video/
      audio/
      review.md
```

Keep generated images as storyboard/source intake unless a later pass intentionally converts them into runtime game assets through the sprite/tile pipeline.

## Reference pack schema

Create `references.md` for each card:

```markdown
# References — NN scene_title

## Canon guardrails
- Recognition/presence guardrail:
- Active terminology:
- Drift risks:

## Timing and light
- Light noun:
- HOLD / disclosure envelope:
- Motif or sound mark:

## Visual anchors
- Character refs:
- Environment refs:
- Palette/material refs:
- Existing prompt refs:

## Audio anchors
- Ambient:
- Foley:
- Silence/music rule:

## Must preserve
- 

## Must avoid
- 
```

## Still-image prompt template

```text
[GLOBAL STYLE PREFIX]
Scene: [one concrete visible action].
Characters: [names + silhouette/costume anchors; pure-silhouette identity locks].
Setting: [place + materials + named light].
Composition: [camera/framing/icon-panel geometry; HOLD target].
Emotional pressure: [short phrase].
Continuity anchors: [repo asset paths or visual descriptions].
Palette: [5-8 color/material words].
Sacred/Ember rule: [gold/red usage, or absent].
Negative constraints: avoid generic fantasy, cozy apothecary, zombie horror, gore, superhero pose, decorative halos, photoreal medical stock imagery, triumphant UI, excessive red, excessive gold.
```

## Variant matrix

Generate 3–5 stills per priority card:

| Variant | Change only this | Keep fixed |
|---|---|---|
| A — literal panel | Direct card action. | Character identity, palette, location. |
| B — object-led | Foreground object carries the emotion. | Canon action and visual regime. |
| C — wider geography | Show route/room/threshold. | Mood and continuity anchors. |
| D — icon-panel | More symmetrical/sacred composition. | Restraint; no decorative gold. |
| E — video-friendly | Clear layers and motion affordances. | Same character/object truth. |

Do not average variants. Pick one that best tells the action.

## Named lights and disclosure envelope

Use these across prompts instead of generic light descriptions:

| Light noun | Prompt use |
|---|---|
| The hearth | Cabin warmth, 4-frame flicker, care source, not victory. |
| The lake-light | Ironwood day, flat gray ambient, no flicker. |
| The receding light | Ironwood dusk, edge vignette, loss and transition. |
| The working light | Bethany, candle warm plus window cool, never blended. |
| Fluorescent leak | Wittehaven foreshadow, 1.5s hum or cool rim on paint/ribbon. |
| Paradise candle-white | Light from no clear direction; earned gold only by restraint. |

Every emotional mark needs a **disclosure envelope**: at least 600ms of bed-layer-only sound unless a card specifies a longer hold.

## Still review rubric

Score 0–2 each:

1. **Action legibility:** Can someone tell what happens without reading lore?
2. **Character continuity:** Does Kalev/Anna/Iiro/etc. match project anchors?
3. **Canon fidelity:** No recipe-victory, no care-only drift, no Wittehaven cartoon evil.
4. **Material truth:** Damp Michigan, vellum, graphite, cedar, candle, hospital linen when appropriate.
5. **Restraint:** No melodrama, spectacle, gore, or reward framing.
6. **Video viability:** Clear foreground/midground/background and animate-able small motion.

Reject below 8/12 unless the failure teaches a better prompt.

## Video prompt template

```text
Use selected still as first-frame style and identity reference.
[GLOBAL VIDEO PREFIX]
Duration: [6-12 seconds].
Motion only: [breath/candle/snow/page/hand/door/wolf/fluorescent hum].
Camera: [locked / slow push no more than 5% / lateral drift no more than 5%].
End frame: [object/person/name].
Sound intention: [foley/ambient/silence; no score unless specified].
Do not add: new characters, gore, magic effects, victory gestures, random symbols, explanatory text.
```

## Voice-over template

Use one to four lines. Default close-first-person Kalev unless a card requires objective narration.

```text
[Concrete object/body fact].
[Action or failure].
[Record/consequence].
[Short inward truth].
```

Rules:

- If image already explains the lore, VO should name the wound, not the system.
- If the scene is sacred or death-adjacent, cut one line before adding one.
- Wittehaven VO may use a single clinical word, but only to mark pressure.
- Do not say the moral out loud if an object can carry it.

## Audio-bed template

```markdown
- Ambient loop:
- Load-bearing foley:
- Body-state treatment:
- Silence rule:
- Music rule:
```

Source: `docs/source/tincture_of_mercy_audio_generation_workflow.md`.

## Priority batch

First image/video batch for comparison with the other council agent:

0. **00 Candidate Prologue: Eli Keene / Page 66** — tests whether precedent death strengthens or over-frontloads the opening.
1. **01 Bedside Before Explanation** — locks story truth and visual language.
2. **05 Anna Death / Witness** — proves gravity encounter and restraint.
3. **07 Borrowed Mercy** — tests addiction/despair transmutation.
4. **08 Wittehaven Relief** — tests institution as seductive relief.
5. **10 Paradise / Notebook Returned** — tests recognition/presence payoff.

## Continuity anchor index

| Subject | Anchor paths |
|---|---|
| Kalev | `art/characters/kalev/kalev_design_asset.png`, `art/characters/kalev/portraits/`, `art/characters/kalev/sheets/kalev_locomotion_64x96.png`, `art/characters/kalev/sheets/kalev_care_64x96.png`, `art/characters/kalev/sheets/kalev_tincture_64x96.png`, `art/characters/kalev/sheets/kalev_combat_64x96.png` |
| Anna/Mother | `art/characters/anna/anna_reference.png`, `art/characters/anna/sheets/anna_bedside_96x48.png`, `art/characters/mother/sheets/mother_bedside_96x48.png` |
| Iiro/Boy | `art/characters/iiro/iiro_reference.png`, `art/characters/iiro/sheets/iiro_locomotion_48x64.png`, `art/characters/boy/sheets/boy_locomotion_48x64.png` |
| Lena | `art/characters/lena/lena_v1_idle.png`, `art/characters/lena/sheets/lena_locomotion_64x96.png` |
| Birdie | `art/characters/birdie/birdie_design_asset.png`, `art/characters/birdie/sheets/birdie_character_idle_48x64.png` |
| Wolf | `art/characters/wolf/sheets/wolf_full_sheet_96x64.png`, `art/characters/wolf/sheets/wolf_locomotion_96x64.png`, `art/characters/wolf/sheets/wolf_reference.png` |
| Cabin/Ironwood | `art/environment/source/downloads_20260510_first_drafts/interior-cabin.png`, `art/environment/source/downloads_20260510_first_drafts/building-cabin-outdoor.png`, `art/environment/source/downloads_20260510_first_drafts/ironwood-envrionment.png`, `art/environment/source/downloads_20260510_first_drafts/yard-combat-slice.png` |
| Style | `design_system/v0_8_1/aesthetic_bible_v0_8_1.md`, `scene_composition_bible_v0_8_1.md`, `art_direction_v0_8_1.md` |

## Video-generation seed strategy

- Use concept/environment paintings as style seeds where possible: `building-cabin-outdoor.png`, `cabin-inside.png`, `interior-cabin.png`, `ironwood-envrionment.png`, `yard-combat-slice.png`.
- Use pixel runtime sheets mainly for pose, silhouette, costume, and identity locks.
- Do not ask video models to infer full cinematic style from a tiny runtime sheet alone.
- Do not downscale cinematic output into runtime sprites.

## Narration vocabulary discipline

For voice-over, avoid mechanics-facing words unless writing a dev note: heal, buff, debuff, stat, level, XP, unlock, quest, loot, crit, tier, damage, attack, weapon, equip, inventory.

Prefer: bread, presence, materials, name, breath, watch, write, receive, hold, mercy, evidence of care. Use Hesychasm only when naming the path; otherwise show it with stillness, breath, and the komboskini.

## Model-routing note

- Use general AI image models for cinematic storyboard/icon-panel concept art.
- Use pixel-art-specialized models or the existing sprite pipeline only for runtime pixel assets.
- Use video-generation models with concept paintings as style seeds and pixel sheets as identity/pose references.
- Do not downscale cinematic concept art into runtime sheets.
- Generated storyboard art can inspire game art, but runtime assets must pass the project asset pipeline.

## Review meeting output

After each batch, produce:

```markdown
# Batch Review

## Keep
- 

## Reject
- 

## Prompt fixes
- 

## Lore/story discoveries
- 

## Game-project backports
- 

## Council-agent comparison
- 
```
