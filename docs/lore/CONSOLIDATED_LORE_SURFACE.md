# Consolidated Lore Surface — Tincture of Mercy

Status: active consolidation (Phase 1–2 complete)
Created: 2026-06-11
Companion: [`INDEX.md`](INDEX.md)
Method: full-repo narrative archaeology across `docs/lore/`, `docs/source/`, `docs/story/`, `design_system/`, ADRs, runtime fixtures, art prompts, and review HTML

This document teases apart **lore**, **mechanics**, and **assets** so a cold reader can grasp the narrative arc and its iterations without reading git history or implementation slop.

---

## How to use this surface

| If you need… | Read… |
|---|---|
| The story in one paragraph | § Story thesis |
| Full pilgrimage arc | § Macro narrative arc |
| What happens in the opening cabin | § Opening slice (active v0.9) |
| Who everyone is (including name forks) | § Cast bible |
| What the game *means* | § Themes and theology |
| Objects that carry meaning | § Symbol register |
| Where the story goes geographically | § World geography |
| How the idea changed over versions | § Iteration ledger |
| What's still undecided | § Open questions |
| What's engine vs story | § Mechanics vs lore boundary |
| Which PNGs embody which beats | § Assets vs lore boundary |
| Every file that contains lore | § Complete source index |

**Authority:** For implementation, `CONTEXT.md` + ADRs + v0.9 packet win where they conflict with older lore prose. This surface **records** those conflicts rather than hiding them.

---

## Story thesis

A healer who once knew what to do with his hands discovers that **medicine works but cannot redeem**. He survives by converting unbearable love and grief (**Burden**) into functional detachment (**Numbness**), often through **Ember** — effective relief with spiritual cost when misused. He loses people when he treats them as cases. The pilgrimage is not toward mastery but toward **presence**: to remember persons, to witness when rescue fails, and to discover that the names were already held.

The **Bethany payoff** is not a corrected recipe saving someone. It is **recognition** — a person-specific response that reveals remembered presence across time. A corrected recipe may exist as **Apothecary** learning; it must not be framed as the salvific cause.

*Distilled from:* `docs/lore/tincture_of_mercy_v0_3.md` §I, §IX · `docs/story/STORYBOARD_BIBLE.md` §2 · `CONTEXT.md` · ADRs 0006–0008

---

## Macro narrative arc

Four phases structure the full game. Alchemical labels are **author scaffolding only** — never player-facing.

| Phase | Label | Geography | Core movement |
|---|---|---|---|
| **I** | Nigredo (darkness) | Ironwood → Bethany | Death, first names, forage, companions, road bends north |
| **II** | Albedo (whitening) | Wittehaven | False relief → protocol capture → Iron Ledger → exile |
| **III** | Citrinitas (burning) | Mackinac → Mount Arvon | Ember dilemma, notebook lost, mystic encounter |
| **IV** | Rubedo (reddening) | Paradise | Church register, graveyard recognition, page 77, family presence |

*Source:* `docs/lore/tincture_of_mercy_v0_3.md` §VIII–IX

### Phase I — Ironwood (detail)

1. **The cabin** — dying person; notebook page 66; Grey Stone pressure; Ember temptation; cedar dog charm
2. **Ironwood Road** — Birdie; **apple refusal** (mandatory); forage north
3. **Bethany** — three sick (one doctor); Lena enters; Lazarus mirror (*physician, heal thyself*)
4. Road bends toward Wittehaven (rumors of clean streets, trains)

### Phase II — Wittehaven

1. Provisional integration — relief first (beds, food, E-7, procedure bonuses)
2. Slow institutional capture (charts, case IDs, foster classification, no unsanctioned prayer)
3. Continuance Hospital (cross as logo)
4. Patient dies "well" → filed as protocol failure
5. Repainting Ritual
6. **Birdie's departure** (misplaced trust, not malice)
7. Town anxiety → scapegoat need
8. **Iron Ledger trial** (inverse of seed scene; accusation partly true)
9. **Scapegoat exile** (*outside the camp*)

### Phase III — Straits

1. Road to Mackinac; vial nearly empty; notebook heavier
2. **Pivotal Ember choice** — dying former Office of Continuance official (linked to children's removal)
3. **Mackinac crossing** — wife's name attempt; **notebook lost to water**
4. Bridgekeepers (bread, names, salvage)
5. **Mount Arvon — Rafe Carver** — *"the only way up is through the center, and the center is a cross"*

### Phase IV — Paradise

1. Bright church (not sterile); washing; chrism
2. Priest's register — names already there; priest writes *Caleb*
3. Birdie/Ruth at graveyard gate with warped, wet notebook
4. **Page 77, line 7** — wife's name written by Kalev's hand
5. Son, daughter, wife at grave; ambiguous resurrection/recognition
6. Full Jesus Prayer: *"Lord Jesus Christ, Son of God, have mercy on me, a sinner."*

*Prose gems preserved in v0.3 §VII, §IX — see deep ore file for full drafts.*

---

## Opening slice (active v0.9)

The **first playable** proves five acts through one shared substrate. Narrative weight order differs from **replay chronology** (Epic C runs wolves before Anna witness in the current fixture).

### Narrative weight order

1. **Water** — embodied care under time pressure
2. **Bread** — ordinary mercy under constraint (not a cooking minigame)
3. **Tincture** — medicine real and costly; Ember temptation
4. **Anna death / Witness** — gravity encounter (fixed death, meaningful actions)
5. **Wolves / Iiro flight / combat** — real violence; boy safety is the objective

### Epic C replay order (runtime fixture)

Two Breaths seed → Water → Bread → Tincture → **Wolves** → **Anna Witness** → Borrowed Mercy / departure

*Sources:* `design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md` · `data/opening/opening_act_cabin_prologue_events.json`

### Beat summary (active cast: Anna + Iiro)

| Act | What happens | Lore meaning |
|---|---|---|
| **Water** | Kalev tends Anna and Iiro; water glances on Anna | Care records person-specific acts before combat |
| **Bread** | Limited food; timing and receptivity | Ordinary mercy, not recipe victory |
| **Tincture** | Craft/administer; Anna partial relief only | Medicine works; does not redeem |
| **Wolves** | Kalev holds line; Iiro reaches woodline; wolf loot possible | Protection through real violence; loot is consequence not win |
| **Witness** | Sit near, keep watch; Anna fixed death | Care does not control death |
| **Borrowed Mercy** | Kalev self-administers dose meant for her; crosses threshold | Survives on her death; pilgrimage on borrowed mercy |

**Canon line (runtime):** *"Anna's breath stops with Kalev still beside her."*

Notebook records: bread ordinary mercy, Anna written after breath stopped, borrowed mercy, threshold as leaving not rescue.

### Candidate prologue (provenance, optional)

**Eli Keene** at page 66 line 7 — v0.7/v0.8.1 cabin dying **boy** before the active Anna/Iiro opening. Use as cold-open ore only; does not replace active cast unless explicitly chosen.

*Sample precedent line:* *"Eli Keene. The breath left before the name did."*

*Sources:* `docs/lore/tincture_of_mercy_godot_design_handoff_v0_7.md` · `docs/story/NARRATIVE_STORYBOARD_DECK_V0_1.md` §00 · `design_system/v0_8_1/micro_symbol_register_v0_8_1.md` §1.2

---

## Cast bible

### Protagonist and family

| Figure | Names / IDs | Role | Relationships |
|---|---|---|---|
| **Kalev Ward** | `kalev`; Hebrew **Caleb** (faithful); inner **Cain** on page 66 | Ex–critical-care nurse, 33; healer-apothecary | Husband (wife dead, name withheld); father (children taken by State) |
| **Wife** | Unnamed until page 77 | Dead before story | Kalev cannot write her name until graveyard threshold |
| **Son** | Unnamed | Carved cedar dog | Taken by State; recognizes dog in Paradise |
| **Daughter** | Unnamed | Memory/vision | Waits at grave for Kalev to finish hearing son |

### Opening slice (active v0.9)

| Figure | Names / IDs | Role |
|---|---|---|
| **Anna** | `anna`; alias **Mother** in art folders | Dying mother; gravity-encounter death; motif `anna.d_phrygian_solo_female` |
| **Iiro** | `iiro`; alias **Boy** in art/prompts | Protected child; Bethany recognition seed |
| **Wolves** | `wolf_01`–`wolf_03` | Real predators; loot-eligible when recoverable |

### Prototype / provenance opening (v0.7/v0.8.1)

| Figure | Names / IDs | Role |
|---|---|---|
| **Eli Keene** | Page 66 line 7 | Cabin dying boy; Ember cannot target; self-use after name written |
| **Birdie / Ruth** | Display **Birdie**; true name **Ruth** (Paradise) | Holy fool; apple refusal; returns notebook |
| **Lena Hart** | `lena`; folder `elena/` | Presence healer; no Tincture bypass; stained fingers |
| **Miriam Toll** | Elder | Bethany unavoidable death |
| **Nora Finch** | Not Nora Field | Recoverable patient |
| **Dr. Amos Bell** | Not Dr. Bell | Village doctor; Ember dilemma |

### Long-arc cast (v0.3 — not yet playable)

| Figure | Role |
|---|---|
| **Director Cornelius Halloway** | Magistrate of Health; Iron Ledger; partly right antagonist |
| **Rafe Carver** | Icon-carver hermit, Mt. Arvon; Raphael frame (replaces "Pageau" easter egg) |
| **Bridgekeepers** | Mackinac passage; bread and names |
| **Paradise priest** | Writes *Caleb* in register |
| **Father Ilarion** | Hesychast priest at wayhouse outside Bethany (AiMock prototype only) |
| **Continuance official** | Mackinac Ember-choice patient; linked to child removal |

### Name alias quick reference

| Canonical | Aliases / drift | Notes |
|---|---|---|
| Kalev | Caleb (Birdie, priest) | Notebook Caleb/Cain theology |
| Anna | Mother | Active opening mother |
| Iiro | Boy, the boy | Active opening child |
| Eli Keene | v0.7 cabin boy | Prologue ore |
| Birdie | Ruth | True name held until Paradise |
| Hesychasm | Pastoral (historical) | ADR 0004 |
| Bread beat | Porridge (source v2) | ADR 0006 |
| Wittehaven | Whitewash | Dutch *witte haven* |
| Ember | Strange Fire (church); E-7 (Wittehaven) | Morally neutral substance |

---

## Themes and theology

| Theme | In-world expression | Avoid framing as… |
|---|---|---|
| **Mercy vs optimization** | Care under scarcity; names over metrics | Morality meter, success panels |
| **Medicine works, cannot redeem** | Tincture helps; Anna still dies | Right recipe saves everyone |
| **Presence** | Sit, watch, speak name, witness | Passive waiting, idle empathy |
| **Recognition** | Bethany payoff; boy remembers cabin | Quest reward, reputation |
| **Burden → Pressure → Numbness** | Grey Stone model; perceptual states | Raw stat bars in care UI |
| **Ember / Strange Fire** | Effective relief; self-use = bypass (Lev 10:1) | Obvious evil power-up |
| **Caleb / Cain** | Page 66 vs page 77; 777 vs 666 | Lore dump in dialogue |
| **Garments of Skin** | Technology, hospital, ledger as necessary coverings | Anti-medicine sermon |
| **The Turn / Withering** | Apathy, not zombie horror | Generic post-apocalypse |
| **Gravity encounter** | Fixed death; meaningful pre-death verbs | Fake failure, unwinnable cutscene |
| **Scapegoat** | Wittehaven exile | Cartoon villainy |
| **Enemy is not flesh and blood** | Ephesians 6; discernment before hostile bodies | — |
| **Latent paths** | Apothecary, Hesychasm, Iconographic growth | Skill trees |
| **Voice registers** | Folk, sanctioned, sacred copy modes | Same as paths (ADR 0005) |

### Lived-source transmutation (author intent)

The project transmutes autobiographical material into myth — not literal memoir unless requested:

| Lived source | Story transmutation |
|---|---|
| COVID critical-care bedside | Kalev at cot; breath, water, cloth |
| Institutional healthcare (Corewell/GR) | Wittehaven relief → control |
| Loss of wealth, marriage, job | Exile north; empty thresholds |
| Addiction/despair | Ember: effective relief with cost |
| Recovery/mercy | Recognition; names remembered |

*Source:* `docs/story/STORYBOARD_BIBLE.md` §3 · ethical guardrails in same file §3

---

## Symbol register

Repeating objects that carry narrative load. Rule from v0.8.1: **a symbol used twice is used too much** — except notebook, cedar dog, Ember vial, patient panel.

| Symbol | Narrative load | Mechanical hook (see § Mechanics) |
|---|---|---|
| **Leather notebook** | Names of attended persons; moral memory | Append-only events; page 66 precedent |
| **Page 66, line 7** | Eli precedent (provenance) | Read-only on first open |
| **Page 77, line 7** | Wife's name; **reserved** — not in prototype | Future arc closure |
| **Cedar dog** | Son's carving; Tobit dog; pouch slot 1 locked | Always carried |
| **Ember vial** | Strange Fire; temptation; pouch slot 16 locked | 2 doses P0; self-use → Numbness |
| **Pencil / graphite** | Imperfect inscription of names | ~320ms stroke |
| **Apple** | Eden bribe refused by Birdie | Mandatory refusal beat |
| **Hearth light** | Named light; dims ~18% on death | Audio bed layer |
| **Bread** | Ordinary mercy under constraint | Act 2 beat |
| **Tincture / broken bottle** | Borrowed mercy; half-full persists | Act 5 self-admin |
| **Hospital cross logo** | Faith as signage | Wittehaven regime |
| **Iron Ledger** | Outcome accounting vs notebook | Trial inversion of seed scene |
| **Komboskini / prayer rope** | Hesychasm practice instrument | Post-Bethany (source intake) |

*Sources:* `design_system/v0_8_1/micro_symbol_register_v0_8_1.md` · `design_system/v0_8_1/aesthetic_bible_v0_8_1.md` · `design_system/v0_8_1/scene_composition_bible_v0_8_1.md`

### Composition grammar (storytelling rules)

- Camera = **witness**, not cinematographer (no zoom/shake; held frames valid)
- One **disclosure beat** per scene: mark + ≥600ms bed-only silence
- Each scene names its **light noun** (hearth, lake-light, fluorescent leak)
- P0: **no score** — room sound is score (diegetic audio)
- Three UI **regimes**: Ironwood/folk, Wittehaven/sanctioned, Paradise/sacred

---

## World geography

Post-**Turn** Michigan — damp November, rusted trusses, lake-effect clouds, snow that does not stay.

| Place | Real anchor | Narrative function |
|---|---|---|
| **Ironwood** | UP town + tree species | Wilderness; cabin; *Tohu* (author only) |
| **Bethany** | First town | Lazarus mirror; triage; Lena |
| **Wittehaven** | Holland, MI echo | False haven; Continuance Hospital; *Bohu* |
| **Mackinac** | Five-mile bridge | Threshold; notebook lost |
| **Mount Arvon** | Michigan high point (UP) | Rafe encounter |
| **Paradise** | UP near Tahquamenon Falls | Rubedo; graveyard; page 77 |
| **Office of Continuance** | State agency | Child separation; rationing |

**Atmosphere phrase:** *Michigan icon-manuscript pixel art* — damaged vellum framing, graphite marginalia, damp materials (cedar, wool, iodine, road salt, lake water).

---

## Iteration ledger

Major narrative forks across project history. **Current active row** wins for new work unless a new ADR says otherwise.

| Era | Document / gate | Opening cast | Act 2 food | Death beat | Combat | Bethany payoff |
|---|---|---|---|---|---|---|
| **v0.3 deep lore** | `docs/lore/tincture_of_mercy_v0_3.md` | Boy (prose); full cast | — | Cabin + long arc | No conventional combat | Recognition / Paradise |
| **v0.6 packet** | `docs/lore/tincture_of_mercy_packet_v0_6.md` | Open questions | Crafting central | Prototype triage | Deferred post-P0 | Names over metrics |
| **v0.7 handoff** | `docs/lore/..._v0_7.md` | **Eli Keene** boy | Porridge era | Eli cabin death | **None** in prototype | Triage end-state |
| **v0.8.1 P0** | `design_system/v0_8_1/` | Eli + Bethany triage | Porridge in sources | Eli + Miriam fixed | **Out of P0** | Presence in triage |
| **Source v2** | `opening_slice_design_v2.md` | Mother + boy | **Porridge** | Mother Glance death | Wolves + borrowed mercy | **Corrected recipe cures** |
| **v0.9 active** | ADRs + opening bible | **Anna + Iiro** | **Bread** | Anna gravity encounter | **First-class** violent lootable | **Recognition**; recipe subordinate |
| **Runtime fixture** | `opening_act_cabin_prologue_events.json` | Anna + Iiro | Bread event | After wolves in replay | Wolf hide loot | Borrowed mercy depart |

### Resolved conflicts (ADR ledger)

| ADR | Narrative lock |
|---|---|
| 0001 | Combat first-class; shared event truth with care |
| 0004 | Hesychasm replaces Pastoral |
| 0005 | Voice registers ≠ latent paths |
| 0006 | Bread replaces porridge |
| 0007 | Mother/Anna death = gravity encounter |
| 0008 | Wolf combat violent and lootable; Iiro safety = objective |
| 0002 | v0.8.1 care-only P0 is scoped provenance, not eternal ban |
| 0003 | Source intake is evidence, not contract |

### Deepest live seams (still documented, not fully merged)

1. **Page 66 = Eli Keene** (v0.8.1 lock) vs **opening play = Anna/Iiro** (v0.9) — treat page 66 as in-world notebook history.
2. **Source v2 recipe-corrected Bethany** vs **ADR recognition payoff** — active docs reject recipe victory.
3. **Storyboard deck** narrative order vs **runtime** wolves-before-Anna — deck allows cross-cut; fixture implements it.

---

## Open questions

### Narrative lines (still open across sources)

- Exact mother/Anna line before death
- Exact notebook line after death (bewilderment vs recipe correction)
- Exact Bethany recognition scene wording
- Boy/Iiro recognition timing: immediate / late / after fever breaks
- Whether public story includes **Eli prologue** (card 00) or lean Anna/Iiro open

### Long-arc (v0.3 — not scoped in active packet)

- Birdie's off-screen Wittehaven fate (player cannot save)
- Lena's path past Wittehaven
- Wife's name visibility rules before page 77
- Ambiguity of who is "alive" at Paradise graveyard

### Parked in handoff (`docs/source/.../04_OPEN_QUESTIONS.md`)

- Hesychasm unlock without tutorial feel
- Iconographic controller verbs
- Burden/Pressure/Numbness × each path
- Safe citation policy for herbal and Orthodox source texts

---

## Mechanics vs lore boundary

**Lore** = what the story *means*, who people are, what objects signify, what the arc promises.

**Mechanics** = how the substrate *records* and *resolves* actions. Mechanics serve lore; they are not lore.

| Lore concept | Mechanical expression | Keep separate because… |
|---|---|---|
| Presence | `SitNear`, `KeepWatch`, Hesychasm path tags | Path IDs are implementation; presence is meaning |
| Gravity encounter | `fixed_death`, `death_kind=fixed_death` | Fixed outcome is design truth, not "unfair game" |
| Recognition | `bethany.recognition` projection seeds | Payoff is relational, not a flag popup |
| Ember temptation | FSR/Vigil, Numbness step, Strange Fire notebook entry | Substance is morally neutral; misuse has cost |
| Wolf protection | Threat table, aggro, leash, loot tables | Combat is real RPG; objective is child safety |
| Notebook memory | `SimEvent` append, page/line copy keys | Notebook is person record, not quest log |
| Bread mercy | `receptivity` profile, food inventory | Ordinary scarcity, not crafting victory |
| Bethany cure | Receptivity + presence verbs | Recipe correction is optional learning artifact |

**Do not import into lore surface:** resolver primitive catalogs (`02-substrate-primitives.md`), Epic B pipeline graphs, CI gates, sprite pipeline tooling, WoW primitive research stubs.

**Runtime narrative truth:** `data/opening/opening_act_cabin_prologue_events.json` and `Tincture.Tests/Fixtures/opening_act_*.json` — use to verify what the engine actually logs vs what prose claims.

---

## Assets vs lore boundary

**Assets** embody lore; they do not define it. A sprite sheet is evidence of a narrative beat, not a substitute for reading the arc.

### Character → narrative identity

| Character | Lore identity (short) | Primary visual anchors |
|---|---|---|
| Kalev | Burdened healer; notebook + pouch | `art/characters/kalev/kalev_design_asset.png`, `sheets/kalev_{care,tincture,combat}_64x96.png` |
| Anna | Dying mother; dignity without gore | `art/characters/anna/sheets/anna_bedside_96x48.png` |
| Iiro | Frightened child; recognition seed | `art/characters/iiro/sheets/iiro_locomotion_48x64.png` |
| Wolf | Real predator; material consequence | `art/characters/wolf/sheets/wolf_full_sheet_96x64.png` |
| Lena | Presence; stained hands | `art/characters/lena/sheets/lena_*_64x96.png` |
| Birdie | Holy fool; apple refusal | `art/characters/birdie/birdie_design_asset.png` |
| Bethany triage | Miriam, Nora, Dr. Amos | `art/characters/{miriam_toll,nora_finch,dr_amos}/*_design_asset.png` |

*Full runtime list:* `art/characters/cabin_cast_manifest.md`

### Environment → narrative beat

| Beat | Visual anchors |
|---|---|
| Cabin / hearth | `art/environment/source/.../interior-cabin.png` |
| Ironwood road | `art/environment/source/.../ironwood-envrionment.png` |
| Wolf yard | `art/environment/source/.../yard-combat-slice.png` |
| Wittehaven regime | `design_system/preview/colors-wittehaven.html` |
| Notebook page 66 | `design_system/preview/notebook-entry.html` |

### Audio → narrative grammar

| Beat | Sonic rule |
|---|---|
| Acts 1–3 | Hearth, clock ~60 BPM, no score |
| Act 4 death | Breath layer stops; hearth continues |
| Act 5 wolves | Far howl → close; no victory fanfare |
| Burden / Pressure / Numbness | Footstep weight, thin ring, world quiet (−6 dB) |

*Sources:* `docs/source/sound_design_brief.md` · `docs/source/tincture_of_mercy_audio_generation_workflow.md`

### Art prompts (identity locks, not lore authority)

`design_system/v0_9_mercy_rpg_substrate/prompts/` — use for **visual continuity** when generating images; narrative claims still defer to this surface + ADRs.

---

## Complete source index

Every lore-bearing surface discovered in Phase 1 audit (2026-06-11). Tier = suggested read order for narrative work.

### Tier 1 — Active narrative authority

| Path | Tier |
|---|---|
| `CONTEXT.md` | 1 |
| `docs/adr/0001`–`0016` | 1 |
| `design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md` | 1 |
| `design_system/v0_9_mercy_rpg_substrate/04-latent-paths-receptivity.md` | 1 |
| `design_system/v0_9_mercy_rpg_substrate/05-rpg-economy-progression.md` | 1 |
| `design_system/v0_9_mercy_rpg_substrate/07-anti-drift-vocabulary.md` | 1 |
| `data/opening/opening_act_cabin_prologue_events.json` | 1 |

### Tier 2 — Consolidated + deep lore

| Path | Tier |
|---|---|
| `docs/lore/INDEX.md` | 2 |
| `docs/lore/CONSOLIDATED_LORE_SURFACE.md` | 2 |
| `docs/lore/tincture_of_mercy_v0_3.md` | 2 |
| `docs/lore/tincture_of_mercy_packet_v0_6.md` | 2 |
| `docs/lore/tincture_of_mercy_godot_design_handoff_v0_7.md` | 2 |

### Tier 3 — Source intake + story production

| Path | Tier |
|---|---|
| `docs/source/2026-05-09-tincture-codex-handoff/primary_sources/opening_slice_design_v2.md` | 3 |
| `docs/source/.../primary_sources/latent_paths.md` | 3 |
| `docs/source/.../primary_sources/three_registers.md` | 3 |
| `docs/source/.../handoff_pack/docs/04_OPEN_QUESTIONS.md` | 3 |
| `docs/source/sound_design_brief.md` | 3 |
| `docs/source/tincture_of_mercy_audio_generation_workflow.md` | 3 |
| `docs/story/SOURCE_ORE_MAP.md` | 3 |
| `docs/story/STORYBOARD_BIBLE.md` | 3 |
| `docs/story/NARRATIVE_STORYBOARD_DECK_V0_1.md` | 3 |
| `docs/story/COUNCIL_COMPARISON_NOTES.md` | 3 |
| `docs/story/AI_PRODUCTION_PIPELINE.md` | 3 |

### Tier 4 — Visual / regime provenance (v0.8.1)

| Path | Tier |
|---|---|
| `design_system/v0_8_1/aesthetic_bible_v0_8_1.md` | 4 |
| `design_system/v0_8_1/scene_composition_bible_v0_8_1.md` | 4 |
| `design_system/v0_8_1/micro_symbol_register_v0_8_1.md` | 4 |
| `design_system/v0_8_1/canonical_locks_v0_8_1.md` | 4 |
| `design_system/v0_8_1/errata_v0_8_to_v0_8_1.md` | 4 |
| `design_system/v0_8_1/ui_regime_system_v0_8_1.md` | 4 |
| `design_system/v0_9_mercy_rpg_substrate/prompts/*.md` | 4 |
| `design_system/Kalev Ward - character design.html` | 4 |
| `concept_packet.html` | 4 (generated review) |
| `art_direction_review.html` | 4 (generated review) |

### Tier 5 — Implementation evidence + prototypes

| Path | Tier |
|---|---|
| `Tincture.Substrate/Data/ActCatalog.cs` | 5 |
| `Tincture.Tests/Fixtures/opening_act_*.json` | 5 |
| `art/characters/cabin_cast_manifest.md` | 5 |
| `Tincture.AiMock/WorldRules.md` | 5 |
| `Tincture.AiMock/Characters/FatherIlarion/persona.md` | 5 |
| `design_system/v0_9_mercy_rpg_substrate/EPIC_C_*_REPORT.md` | 5 |

### Tier 6 — Referenced but not locally readable

| Path | Notes |
|---|---|
| `_archive/superseded/v0_8/` | Whole v0.8 packet archived |
| `_archive/superseded/kalev_concept_iterations/` | Older Kalev concept art |
| User scratchpad `tincture-of-mercy-v0.7` | Not found on disk; repo has `docs/lore/..._v0_7.md` instead |

---

## One-line canon spine (implementation + story)

**Medicine works but cannot redeem. Care and combat share one remembered truth. Anna dies after meaningful witness. Iiro escapes through violent protection. Kalev survives on borrowed mercy and leaves with names in the notebook — toward a Bethany where presence, not recipe, is recognized.**

---

## Long-horizon phases (status)

| Phase | Status | Artifact |
|---|---|---|
| **3 — Runtime sync** | Complete | `docs/story/NARRATIVE_STORYBOARD_DECK_V0_1.md` v0.2 |
| **4 — Long-arc cards** | Complete | `docs/story/NARRATIVE_STORYBOARD_DECK_V0_2_LONG_ARC.md` |
| **5 — Archive recovery** | Complete | `docs/lore/ARCHIVE_RECOVERY_REPORT.md` |
| **6 — Cast bible** | Complete | `docs/lore/CAST_BIBLE.md` |
| **7 — Memoir boundaries** | Complete | `docs/story/MEMOIR_TRANSMUTATION_BOUNDARIES.md` |

### Next optional passes

| Pass | Goal |
|---|---|
| **8** | Generate `art/storyboard/` stills from cards 00–07 per `AI_PRODUCTION_PIPELINE.md` |
| **9** | Sync `concept_packet.html` cast labels (Mother → Anna) |
| **10** | Father Ilarion Godot NPC — engine scope, not lore |

*Maintainers: update § Iteration ledger when narrative claims change; link ADR numbers.*