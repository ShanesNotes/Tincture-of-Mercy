# Narrative Storyboard Deck v0.2 — Opening Spine + Candidate Prologue

Status: production storyboard deck (runtime-synced)  
Owner lane: narrative/storyboard + AI image/video production  
Authority: support artifact; compare with council-agent alternatives before locking  
Created: 2026-05-13 · **v0.2 sync: 2026-06-11** (Phase 3 — matches `opening_act_cabin_prologue_events.json`)  
Companion docs: `docs/story/STORYBOARD_BIBLE.md`, `docs/story/SOURCE_ORE_MAP.md`, `docs/story/NARRATIVE_STORYBOARD_DECK_V0_2_LONG_ARC.md`

## Deck premise

This opening deck turns the game/lore project into a short-film/storyboard spine. It starts in the cabin because the core image is already strongest there: a named person fading in a cold room, a healer with medicine that works but cannot redeem, and a notebook that remembers what success cannot.

Council integration adds a **candidate prologue** from v0.7/v0.8.1: Eli Keene at page 66 line 7. Use it when the storyboard needs a precedent death and first self-Ember wound before Anna. Omit it when the first public piece needs a lean active-v0.9 opening.

Default continuity choice: active v0.9 names and terms (`Anna`, `Iiro`, `Hesychasm`, bread). Older `Eli Keene` remains a supported prologue/provenance thread, not a forced replacement for Iiro.

## Canonical replay order (runtime truth)

**Narrative weight** (importance): Water → Bread → Tincture → Anna Witness → Wolves → Borrowed Mercy.

**Replay chronology** (Epic C fixture + `data/opening/opening_act_cabin_prologue_events.json`):

| Order | Card | Act beat | Notes |
|---|---|---|---|
| 0 | 00 | (optional prologue) | Eli Keene / page 66 — not in runtime fixture |
| 1 | 01 | `act.cinematic_two_breaths` + bedside | Anna labored; Iiro on cot; notebook page 66 open |
| 2 | 02 | `act.water` | Water to Iiro; glance on Anna |
| 3 | 03 | `act.bread` | Bread ordinary mercy; notebook seed |
| 4 | 04 | `act.tincture` | Iiro fever eased; Anna tincture glance only |
| 5 | **05** | **`act.wolves_hold_line`** | **Anna still alive (breath thin) on cot** |
| 6 | **06** | **`act.mother_witness`** | **After Iiro at woodline** |
| 7 | 07 | `act.borrowed_mercy_depart` | Self-dose; threshold crossing |

Cards 05 and 06 below follow **replay order**, not narrative-weight order.

## Global still-image style prefix

Use before each image prompt unless a card overrides it:

```text
Tincture of Mercy, Michigan icon-manuscript pixel art translated into cinematic storyboard concept art, damp November Michigan, damaged vellum manuscript framing, graphite marginalia, flat symbolic Orthodox icon-panel composition, tactile post-Turn materials, ash light, lake-slate shadows, cedar brown, damp vellum, ink, candle-white, restrained palette, named-person intimacy, no gore, no generic fantasy, no glossy modern stock medical imagery, no triumphant game UI
```

## Global video style prefix

```text
Slow restrained animatic shot, fixed manuscript-page composition, minimal camera movement, tactile foley-led motion, animate only breath, candle, snow, hands, page, doorway, or wolf movement as specified; no dramatic zoom, no victory flourish, no cinematic swell
```

---

## 00 — Candidate Prologue: Eli Keene / Page 66

- **Narrative beat:** Before Anna, the notebook already carries a precedent death: Eli Keene, page 66 line 7. Kalev writes the name, then reaches for Ember to steady himself.
- **Emotional wound:** The audience sees the first version of the wound before the opening slice repeats it under greater pressure.
- **Visible action:** A still boy's hand, Kalev's pencil, the page header, one ember-red vial mark. The room is almost empty of color.
- **Source ore:** `docs/lore/tincture_of_mercy_godot_design_handoff_v0_7.md` Scene 1; `design_system/v0_8_1/scene_composition_bible_v0_8_1.md` Cabin Beat 3; `design_system/preview/notebook-entry.html`; `docs/lore/tincture_of_mercy_v0_3.md` seed scene.
- **Characters:** Kalev, Eli Keene.
- **Location:** Prior cabin call; Ironwood folk regime.
- **Light noun:** The hearth, dimmed.
- **HOLD:** 1.4s tight on Eli's hand after breath ceases; 600ms hearth-bed only after notebook write.
- **Visual anchor:** Notebook page 66 line 7 previews; Kalev identity anchor `art/characters/kalev/kalev_design_asset.png`; cabin interior/environment source.
- **Image prompt:** Global style prefix + `prologue bedside death, close manuscript panel of a still child's hand near a leather notebook reading page 66 line 7, name Eli Keene written in graphite, Kalev's rough hand holding pencil, one small ember-red vial glint near the edge of frame, hearth dimmed, no gore, no triumph, the breath left before the name did.`
- **Video prompt:** Global video prefix + `6 seconds. Child hand is still. Pencil writes Eli Keene. Hearth dims by a fraction. Kalev's other hand finds the vial but does not yet lift it. End on page 66 line 7.`
- **Voice-over seed:**
  ```text
  The breath left before the name did.
  I wrote Eli Keene where my hand could still obey me.
  Then I mistook steadiness for mercy.
  ```
- **Sound cue:** Dim hearth, pencil, cork click withheld until cut. No score.
- **Continuity notes:** Candidate prologue from v0.7/v0.8.1, not a replacement for active Anna/Iiro opening.
- **Council comparison notes:** Strong addition from the external report; compare whether it clarifies or over-frontloads the wound.

---

## 01 — Bedside Before Explanation

- **Narrative beat:** Kalev is already beside Anna before the story explains the world. Iiro is nearby, watching. The room tells us she is worse than any remedy can fully reach.
- **Emotional wound:** The old professional reflex returns: assess, sequence, intervene. Under it is dread that procedure cannot absolve him.
- **Visible action:** Kalev kneels at the cot. Anna's breath is labored. Iiro sits half-hidden near the hearth. The notebook lies open but unwritten.
- **Source ore:** `03-opening-act-bible.md` Act 1; `opening_slice_design_v2.md` Act 1; `aesthetic_bible_v0_8_1.md`; `docs/lore/tincture_of_mercy_v0_3.md` Chapter 1 draft.
- **Characters:** Kalev, Anna, Iiro.
- **Location:** Ironwood cabin, folk/Ironwood regime.
- **Light noun:** The hearth.
- **HOLD:** 6.0s arriving-wide feel; end with 600ms bed-layer only.
- **Visual anchor:** `art/characters/kalev/portraits/`, `art/characters/anna/sheets/anna_bedside_96x48.png`, `art/characters/iiro/iiro_reference.png`, `art/environment/source/downloads_20260510_first_drafts/interior-cabin.png`.
- **Image prompt:** Global style prefix + `Kalev Ward kneeling beside a dying mother on a low cabin cot, a frightened boy near the hearth, chipped cup and folded cloth on a cedar table, open leather notebook in foreground, cold ash light through a small window, candle warmth failing to fill the room, Anna dignified and visibly fading, no horror framing, composition centered like a damaged manuscript bedside icon panel.`
- **Video prompt:** Global video prefix + `8 seconds. Anna's chest rises slowly. Candle flame trembles. Iiro's eyes shift from Anna to Kalev. Kalev's hand hovers over the cloth and stops. End on the open notebook.`
- **Voice-over seed:**
  ```text
  The room had already made its diagnosis.
  I was late in the way a man is late when he still has tools.
  The boy watched my hands.
  I tried to make them useful.
  ```
- **Sound cue:** Cabin interior day/dusk loop; hearth low; cloth movement; one uneven breath. No score.
- **Continuity notes:** Do not imply Anna can be saved by the right recipe. Establish gravity before mechanics.
- **Council comparison notes:** Compare whether another pass starts with hospital/COVID memory. This pass starts mythically in-world.

---

## 02 — Water

- **Narrative beat:** Kalev fetches and offers water. Small care is real care, but it is not control.
- **Emotional wound:** He wants the smallest act to prove the world is still negotiable.
- **Visible action:** A tin cup touches Anna's lips; she accepts a little and turns away. Iiro receives water differently.
- **Source ore:** `03-opening-act-bible.md` Act 1 Water; `CONTEXT.md`; audio workflow care foley.
- **Characters:** Kalev, Anna, Iiro.
- **Location:** Cabin bedside; implied well/threshold.
- **Light noun:** The hearth.
- **HOLD:** 600ms on water after Anna turns away.
- **Visual anchor:** Kalev care sheet `art/characters/kalev/sheets/kalev_care_64x96.png`; cabin environment masters; water/cup props from environment drafts.
- **Image prompt:** Global style prefix + `close storyboard panel of Kalev's rough hands holding a chipped tin cup to Anna, water catching candle-white, Iiro's small hands around another cup in the background, damp wool blanket, cedar table, graphite notebook edge visible, the act humble and bodily, no glowing magic, no success icon.`
- **Video prompt:** Global video prefix + `6 seconds. Water surface shakes once. Anna sips, then her head turns a fraction away. Iiro drinks in the background and steadies. End on a single drop running down the cup.`
- **Voice-over seed:**
  ```text
  Water is honest.
  It does not promise resurrection.
  She took enough to tell me she was still here.
  The boy drank like he wanted to stay.
  ```
- **Sound cue:** Tin cup, swallow, cloth, hearth, no music.
- **Continuity notes:** The water beat is not failure; it records presence and state.
- **Council comparison notes:** Check whether alternate decks make care too symbolic. This card keeps it tactile.

---

## 03 — Bread

- **Narrative beat:** Bread becomes ordinary mercy under scarcity. Kalev must decide when and how to offer it.
- **Emotional wound:** The simplest nourishment becomes a test of attention: is he feeding a person or solving a need tag?
- **Visible action:** Kalev breaks bread, moistens it, waits for Iiro's fear to settle before offering.
- **Source ore:** `03-opening-act-bible.md` Act 2 Bread; `04-latent-paths-receptivity.md`; `CONTEXT.md` bread beat.
- **Characters:** Kalev, Iiro, Anna in background.
- **Location:** Cabin hearth/table.
- **Light noun:** The hearth.
- **HOLD:** 600ms on offered bread before Iiro receives or refuses.
- **Visual anchor:** `art/characters/iiro/sheets/iiro_locomotion_48x64.png`; `art/characters/kalev/sheets/kalev_care_64x96.png`; cabin interior source.
- **Image prompt:** Global style prefix + `Kalev breaking a small piece of dark bread at a cedar table, moistening it with a few drops of water, Iiro watching from the hearth edge, Anna blurred but present on the cot, scarce food treated with reverence but not glow, manuscript margin showing graphite crumbs, palette of bread brown, vellum, ash blue, candle white.`
- **Video prompt:** Global video prefix + `8 seconds. Bread breaks with crumbs. Kalev pauses instead of pushing it forward. Iiro leans in slowly. Hearth light breathes once. End on the offered bread between them.`
- **Voice-over seed:**
  ```text
  Bread asks a slower question than medicine.
  Not can I fix you.
  Will you receive this from my hand.
  I waited until the boy could answer.
  ```
- **Sound cue:** Bread break, faint cup water, hearth, quiet child breath.
- **Continuity notes:** Active v0.9 uses bread, not porridge. Do not turn it into a cooking minigame.
- **Council comparison notes:** Compare whether bread becomes Eucharistic too early. This pass keeps it ordinary mercy first.

---

## 04 — Tincture

- **Narrative beat:** Medicine becomes visible as craft: real, costly, and tempting. Kalev prepares what may ease but cannot redeem.
- **Emotional wound:** Technical competence returns, and with it the illusion that competence can cancel grief.
- **Visible action:** Herbs, glass, mortar, candle, and the red Ember vial sit on the apothecary table. Kalev's hand is steadier than his face.
- **Source ore:** `03-opening-act-bible.md` Act 3; `docs/lore/tincture_of_mercy_packet_v0_6.md` Tincture Wheel; `docs/lore/tincture_of_mercy_v0_3.md` Ember/Strange Fire.
- **Characters:** Kalev; Anna and Iiro implied by room context.
- **Location:** Cabin apothecary table.
- **Light noun:** The hearth, with one ember-red mark.
- **HOLD:** 600ms on the measured dose; no success chime.
- **Visual anchor:** `art/characters/kalev/sheets/kalev_tincture_64x96.png`; tincture/craft audio workflow; UI/manuscript grammar.
- **Image prompt:** Global style prefix + `Kalev at a rough apothecary table preparing tincture, mortar and pestle, dried leaves, glass vial, candle, notebook recipe page, one small ember-red vial mark in the pouch, his face half in ash light and half candle warmth, no magic glow except the restrained dangerous red, composition like a manuscript craft diagram haunted by a bedside scene.`
- **Video prompt:** Global video prefix + `10 seconds. Pestle grinds once. Glass catches candle light. Kalev's fingers hover near the ember-red vial but choose the tincture bottle. Page edge trembles. End on the measured dose.`
- **Voice-over seed:**
  ```text
  Medicine works.
  That was the mercy and the accusation.
  The measure could be clean.
  The world after it would not be.
  ```
- **Sound cue:** Mortar, dried leaf grind, glass setdown, cork, small water pour. No crafting success chime.
- **Continuity notes:** Ember is effective and tempting, not cartoon evil. Tincture is not final salvation.
- **Council comparison notes:** Compare whether other pass foregrounds Ember earlier. This pass lets temptation appear before naming it.

---

## 05 — Wolves / Iiro Flight *(replay: before Anna witness)*

- **Narrative beat:** Wolves press the yard while Anna still breathes thin on the cot inside. Iiro must run. Kalev buys the boy's escape by drawing the wolf gaze onto himself — care becomes violence without ceasing to be care.
- **Emotional wound:** The body must become a door before the heart can become a witness.
- **Visible action:** Kalev places himself between wolves and the fleeing boy. Threat snaps from Iiro to Kalev after the cudgel hit. Iiro reaches the woodline; one wolf may die with recoverable hide; a second may leash when the boy is safe.
- **Source ore:** `03-opening-act-bible.md` Act 5; `data/opening/opening_act_cabin_prologue_events.json` (`act.wolves_hold_line`); `docs/adr/0008-wolf-combat-is-violent-and-lootable.md`.
- **Characters:** Kalev, Iiro, wolves (`wolf_01`–`wolf_03`). Anna implied inside (still alive).
- **Location:** Cabin yard / Ironwood road edge at night.
- **Light noun:** The receding light outside; hearth spill from the door.
- **HOLD:** 600ms on the wolf gaze snapping from Iiro to Kalev.
- **Visual anchor:** `art/characters/wolf/sheets/wolf_full_sheet_96x64.png`, `art/characters/kalev/sheets/kalev_combat_64x96.png`, `art/environment/source/downloads_20260510_first_drafts/yard-combat-slice.png`.
- **Image prompt:** Global style prefix + `night cabin yard, Kalev with cudgel braced between snarling wolves and Iiro fleeing toward the dark woodline, snow and road salt underfoot, cabin door open behind with candle light and Anna's cot barely visible inside, wolves dangerous and bodily not demonic, composition shows the boy's route as the true objective, no kill-count framing, no heroic power pose.`
- **Video prompt:** Global video prefix + `10 seconds. Iiro runs from cabin light toward the back/north treeline while wolves press from the east. One wolf turns toward him; Kalev steps into the line and draws the gaze back. Snow crosses the frame. End with wolf eyes locked on Kalev and Iiro clearing the woodline.`
- **Voice-over seed:**
  ```text
  The boy did not need me gentle then.
  He needed distance.
  I made my body the door.
  The wolves understood doors.
  ```
- **Sound cue:** `yard_holds_start`; howl, claw scrape, boy running, cudgel swing, growl; no victory music.
- **Continuity notes:** Runtime fixture runs this **before** Anna's fixed death. Anna breath state remains `thin`, not `stopped`. Loot (wolf hide) only when body recoverable; leashed wolf withholds loot.
- **Council comparison notes:** Compare whether other pass softens combat or places wolves after death. Runtime and v0.2 deck place wolves first.

---

## 06 — Anna Death / Witness *(replay: after Iiro safe)*

- **Narrative beat:** Iiro is safe at the woodline. Kalev returns to the cot. Anna's breath is thin. He sits near, keeps watch (Hesychasm), and her breath stops with him still beside her — a gravity encounter, not a recipe failure.
- **Emotional wound:** Kalev learns the unbearable distinction between easing suffering and defeating death.
- **Visible action:** Kalev sits close instead of doing one more procedure. Sacred register keep-watch. Fixed death: *"Anna's breath stops with Kalev still beside her."* Notebook receives her name on page 66.
- **Source ore:** `03-opening-act-bible.md` Act 4; `data/opening/opening_act_cabin_prologue_events.json` (`act.mother_witness`); `docs/adr/0007-mother-death-is-a-gravity-encounter.md`.
- **Characters:** Anna, Kalev. Iiro absent (fled).
- **Location:** Cabin bedside, night, after yard combat.
- **Light noun:** The hearth dimming toward the receding light.
- **HOLD:** Final exhale plus 1.4s bed-only disclosure (`long_pour_start` audio cue).
- **Visual anchor:** Anna bedside sheets; Kalev care sheets; notebook visual grammar.
- **Image prompt:** Global style prefix + `Anna's final breath in the Ironwood cabin after the yard fight, Kalev seated beside her holding her hand, empty doorway where the boy fled, leather notebook open with graphite name beginning, hearth and candle continue after breath stops, no dramatic light beam, no gore, no victory, fixed manuscript composition with wide margins and unbearable quiet.`
- **Video prompt:** Global video prefix + `12 seconds. Kalev sits near. Breath animation slows: thin, brief stillness, final exhale. All outside sound drops for the disclosure hold. Hearth continues. Notebook receives Anna's name. End on pencil line 3, page 66.`
- **Voice-over seed:**
  ```text
  The boy was gone.
  I came back with blood on my coat and nothing left to sequence.
  Her breath stopped with me still beside her.
  I wrote her name because I could not keep her breath.
  ```
- **Sound cue:** `long_pour_start`; breath stop; hearth/clock/pencil only after disclosure. No sting, no chord.
- **Continuity notes:** Gravity encounter — fixed `death_kind=fixed_death`. Player verbs `presence.sit_near`, `witness.keep_watch` matter for seeds; death is not avoidable. **Not** a cross-cut with wolves; wolves already resolved in card 05.
- **Council comparison notes:** Key comparison card. Runtime order makes witness a return beat, not simultaneous combat.

---

## 07 — Borrowed Mercy

- **Narrative beat:** Wounded and alone after Iiro escapes, Kalev drinks the remaining tincture/relief to survive. He begins the pilgrimage on mercy that was not cleanly his.
- **Emotional wound:** Survival itself becomes debt. Addiction/despair enters as relief that works.
- **Visible action:** Kalev returns to the cabin, wounded. Anna is still. The bottle remains. He drinks, then writes; a small charcoal cross is marked beside his own name as moral accounting.
- **Source ore:** `opening_slice_design_v2.md` Act 5 borrowed mercy; `docs/lore/tincture_of_mercy_v0_3.md` Ember and Grey Stone; `03-opening-act-bible.md` order mentions Borrowed Mercy/departure.
- **Characters:** Kalev; Anna's body present; Iiro absent.
- **Location:** Cabin after wolves.
- **Light noun:** The hearth before dawn; Numbness desaturation after self-dose.
- **HOLD:** 600ms on the charcoal cross beside Kalev's own name after the dose.
- **Visual anchor:** Kalev tincture/combat sheets; Anna bedside; ember-red one-mark rule; notebook.
- **Image prompt:** Global style prefix + `Kalev wounded at the cabin table after the wolf fight, Anna still on the pallet in background, the boy gone, a half-used tincture bottle in Kalev's hand, one ember-red glint in the room, notebook open under his elbow with a small charcoal cross beside Kalev's own name, ash light before dawn, survival as debt not triumph, no power-up glow.`
- **Video prompt:** Global video prefix + `10 seconds. Kalev's shaking hand lifts the bottle. He drinks. His breath steadies too quickly. The room desaturates and his eyes flatten. He writes one line and marks the charcoal cross. End on the empty doorway where Iiro ran.`
- **Voice-over seed:**
  ```text
  I lived.
  That was the first debt north.
  Relief entered like mercy and left like smoke.
  I wrote: he ran, and I will follow when I can stand.
  ```
- **Sound cue:** Cork, swallow, sharp inhale, ambient duck/low-pass for Numbness, pencil.
- **Continuity notes:** Keep substance morally neutral; misuse/self-use carries cost. Do not portray addiction as spectacle.
- **Council comparison notes:** Strong autobiographical transmutation card. Compare whether other agent names addiction explicitly here or leaves it symbolic.

---

## 08 — Wittehaven Relief

- **Narrative beat:** Wittehaven first appears as salvation: clean beds, warm food, working systems, someone else taking responsibility.
- **Emotional wound:** The institution offers what Kalev lost: competence, order, chartable mercy, and a place to stand.
- **Visible action:** Kalev, Lena, and Birdie enter a clean blue-white interior. A chart is ready before a name is spoken.
- **Source ore:** `docs/lore/tincture_of_mercy_v0_3.md` Phase II; `aesthetic_bible_v0_8_1.md` Wittehaven regime; v0.7 handoff Wittehaven foreshadow.
- **Characters:** Kalev, Lena, Birdie, Wittehaven staff silhouettes.
- **Location:** Wittehaven intake / Continuance Hospital threshold.
- **Light noun:** Fluorescent leak becoming sanctioned Wittehaven light.
- **HOLD:** 1.5s on fluorescent hum before dialogue resumes.
- **Visual anchor:** Wittehaven regime scaffold; Lena/Birdie art; hospital linen material rules.
- **Image prompt:** Global style prefix modified for Wittehaven + `Wittehaven intake hall as seductive relief, clean hospital linen, blue-white fluorescent light, straight grids, readable charts, warm food station, doors that close properly, Kalev and Lena entering with road-worn coats, Birdie small at the edge, cross shape converted into institutional signage, beautiful but spiritually airless, no cartoon villainy.`
- **Video prompt:** Global video prefix + `8 seconds. Fluorescent hum rises. A clean door opens smoothly. A chart slides into frame before anyone asks a name. Birdie looks at the warm food, then at the door latch. If Bethany preceded this shot, Kalev's fingers briefly work a dark wool komboskini. End on the case-number line.`
- **Voice-over seed:**
  ```text
  Wittehaven was warm.
  That is the part I must tell truthfully.
  The beds were clean.
  The chart knew where to put us before we knew where to stand.
  ```
- **Sound cue:** Fluorescent hum, paper-feed, plastic/clipboard click; no ominous sting.
- **Continuity notes:** Wittehaven must first feel like relief and be partly right.
- **Council comparison notes:** Compare whether another pass makes institution villainous too early.

---

## 09 — Iron Ledger / Exile

- **Narrative beat:** Wittehaven opens the ledger. The system's accusation is partly true. Kalev recognizes himself in the record and is cast outside the camp.
- **Emotional wound:** The old identity cannot save him. The chart knows his failures but not the names.
- **Visible action:** A clean institutional table, ledger pages, case marks, missed names, undocumented doses. Kalev stands before Halloway and the room.
- **Source ore:** `docs/lore/tincture_of_mercy_v0_3.md` Iron Ledger trial; `aesthetic_bible_v0_8_1.md` Wittehaven; `CONTEXT.md` names over metrics relationship.
- **Characters:** Kalev, Halloway, Wittehaven staff/residents, possibly Lena watching.
- **Location:** Continuance Hospital / civic-medical hearing room.
- **Light noun:** Wittehaven blue-white; no hearth warmth.
- **HOLD:** 600ms on name half-covered by case number.
- **Visual anchor:** Wittehaven blue-white, ledger material, graphite vs printed case IDs.
- **Image prompt:** Global style prefix modified for Wittehaven + `Iron Ledger trial, Halloway seated behind a clean institutional desk, ledger open with case IDs and red rejection stamps, Kalev road-worn before blue-white grids, Lena half-visible at room edge, no snarling villain, the accusation calm and partly true, names in graphite ghosting under printed metrics, composition symmetrical and sterile.`
- **Video prompt:** Global video prefix + `10 seconds. Ledger page turns with crisp sound. Red stamp lowers once. Kalev's hand moves toward his notebook and stops. Fluorescent hum steadies. End on a name half-covered by a case number.`
- **Voice-over seed:**
  ```text
  The ledger did not lie.
  That was its power.
  It counted every shortcut except the ones that had names.
  When they sent me out, part of me agreed to go.
  ```
- **Sound cue:** Paper, stamp, fluorescent hum, no crowd murmur swell.
- **Continuity notes:** Halloway must be hollow, not cartoon evil. The ledger must be partly true.
- **Council comparison notes:** Compare whether other pass makes this too legalistic or too supernatural. This pass keeps it institutional and intimate.

---

## 10 — Paradise / Notebook Returned

- **Narrative beat:** At the end, the notebook returns. The names were already known. Kalev writes the name he could not write.
- **Emotional wound:** The whole pilgrimage resolves as recognition, not achievement.
- **Visible action:** Birdie holds out the warped notebook near a graveyard gate. Kalev writes his wife's name. Family presence is felt without over-explaining whether they are alive, dead, or received.
- **Source ore:** `docs/lore/tincture_of_mercy_v0_3.md` final scene; `CONTEXT.md` recognition/presence; `aesthetic_bible_v0_8_1.md` Paradise regime.
- **Characters:** Kalev, Birdie/Ruth, priest implied or previous shot, wife/children presence ambiguous.
- **Location:** Paradise church/graveyard threshold.
- **Light noun:** Paradise candle-white with restrained earned gold.
- **HOLD:** 1.4s on graphite shining in damp paper after the wife's name is written.
- **Visual anchor:** Paradise regime: old wood, candle white, smoke-dark icons, earned gold; notebook motif.
- **Image prompt:** Global style prefix shifted to Paradise + `Paradise graveyard gate after rain, Birdie holding out a warped leather notebook, Kalev kneeling or standing with pencil in hand, wet boots near a church threshold in background, smoke-dark icons and old wood, very restrained earned gold on page edge only, family presence suggested by hands/shadows/light not explained, recognition not reward, no heavenly spectacle.`
- **Video prompt:** Global video prefix + `12 seconds. Birdie extends the notebook. Kalev opens to a page. Pencil writes one unseen name. Candle-white light holds still. A hand rests on his shoulder at the edge of frame. End on graphite shining in damp paper.`
- **Voice-over seed:**
  ```text
  The pages had been wet and had dried.
  The pencil was where I had not left it.
  I wrote the name I had carried by not writing.
  Then I heard my son say Dad, as if I had only turned away.
  ```
- **Sound cue:** Wet boots, page creak, pencil, distant quiet chant or breath-like room tone. Almost still.
- **Continuity notes:** This is recognition/presence payoff, not victory, cure, or recipe success.
- **Council comparison notes:** Compare whether alternate ending explains too much. This pass preserves ambiguity and recognition.

---

## Council comparison scorecard

Use after reviewing the other agent's deck.

| Criterion | This deck's default | Compare against |
|---|---|---|
| Opening | Active cut starts in-world cabin; optional Eli prologue adds a precedent death. | Hospital/COVID literal opening, road/exile opening, or no prologue. |
| Lived source | Mythic transmutation. | Direct memoir, allegory, or hidden-only source. |
| First seven scenes | Opening act + borrowed mercy. | Broader campaign montage. |
| Institution | Wittehaven as seductive relief first. | Wittehaven as immediate villain. |
| Addiction | Ember/borrowed mercy symbolic first. | Explicit confession or avoided theme. |
| Visual strategy | Pixel-art continuity + icon-panel cinematic concepts. | Pure cinematic, pure pixel, or generic fantasy. |
| Ending | Recognition and names. | Cure, victory, or doctrinal explanation. |

## Immediate next production pass

1. Generate three still concepts each for cards 00, 01, 05, 07, 08, and 10, then decide whether 00 belongs in the public cut.
2. Assemble a contact sheet beside existing pixel-art references.
3. Record temporary VO for those six candidate cards only.
4. Build a 60–90 second animatic before expanding to all ten.
