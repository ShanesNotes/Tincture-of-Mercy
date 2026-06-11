# Narrative Storyboard Deck v0.2 — Long-Arc Pilgrimage (Phase II–IV)

Status: long-arc expansion from v0.3 prose  
Owner lane: narrative/storyboard + AI image/video production  
Authority: support artifact; v0.3 deep lore ore distilled — active v0.9/ADRs arbitrate conflicts  
Created: 2026-06-11 (Phase 4)  
Companion: `NARRATIVE_STORYBOARD_DECK_V0_1.md` (opening cards 00–07), `docs/lore/tincture_of_mercy_v0_3.md` §VIII–IX

## Scope

Cards **11–22** cover Phase I remainder (Ironwood → Bethany) and Phases II–IV (Wittehaven → Mackinac → Paradise). Opening cards **08–10** in the opening deck remain the short-film Wittehaven/Paradise compression; this deck **expands** the middle with Bethany, institutional capture, exile, straits, and Rafe.

Use the same global style prefixes from the opening deck.

---

## 11 — Ironwood Road / Apple Refusal

- **Narrative beat:** Birdie offers an apple on the road north. Kalev refuses for her. She follows anyway.
- **Emotional wound:** Eden's bribe rejected; loyalty without classification.
- **Visible action:** Single-pixel ember-red worm in snow on the apple; Birdie's small hand; Kalev's refusal panel; notebook records *"Birdie. The apple had a worm."*
- **Source ore:** `docs/lore/tincture_of_mercy_v0_3.md` Phase I; `micro_symbol_register_v0_8_1.md` §3; `scene_composition_bible_v0_8_1.md` §6.
- **Characters:** Kalev, Birdie.
- **Location:** Ironwood Road, folk regime.
- **Light noun:** Lake-light through bare branches.
- **HOLD:** 600ms on refused apple in snow.
- **Visual anchor:** `art/characters/birdie/birdie_design_asset.png`; Ironwood environment drafts.
- **Image prompt:** Global style prefix + `Ironwood road in damp November, Birdie offering a small apple in snow, Kalev refusing without cruelty, one restrained ember-red pixel in the apple worm, manuscript margin, no mascot cuteness, holy-fool inconvenience.`
- **Video prompt:** Global video prefix + `8 seconds. Apple offered. Kalev shakes head once. Birdie pockets apple and follows two steps behind. End on notebook graphite line forming.`
- **Voice-over seed:**
  ```text
  She offered what the road always offers.
  I said no.
  She came anyway.
  That was the kind of person she was.
  ```
- **Sound cue:** Road bed, snow crunch, no score.
- **Continuity notes:** Apple refusal is **mandatory** (v0.8.1 lock). Birdie calls Kalev *Caleb* in first shared scenes.
- **Memoir boundary:** mythic (see `MEMOIR_TRANSMUTATION_BOUNDARIES.md` §11).

---

## 12 — Bethany Arrival / Lazarus Mirror

- **Narrative beat:** Three sick in Bethany; one is the village doctor. Kalev arrives as healer; the mirror is *physician, heal thyself.*
- **Emotional wound:** Competence meets its own limit in another healer's body.
- **Visible action:** Triage layout; three patient panels; Dr. Amos Bell with glasses and stethoscope; Miriam Toll elder under dragon-red blanket if dying.
- **Source ore:** `docs/lore/tincture_of_mercy_v0_3.md` Phase I; v0.7 handoff Bethany scenes; `art/characters/{miriam_toll,nora_finch,dr_amos}/*`.
- **Characters:** Kalev, Dr. Amos Bell, Miriam Toll, Nora Finch, Birdie (silent in triage).
- **Location:** Bethany clinic, folk regime shifting toward sanctioned pressure.
- **Light noun:** The working light over the prep table.
- **HOLD:** 600ms wide triage frame before first verb.
- **Visual anchor:** Bethany design assets; `scene_composition_bible_v0_8_1.md` §7.
- **Image prompt:** Global style prefix + `Bethany triage icon panel, three bedside patients, village doctor among the sick, Kalev entering with road-worn coat and notebook, Miriam elder dignified, no success panels, manuscript framing.`
- **Video prompt:** Global video prefix + `10 seconds. Kalev reads the room. Doctor coughs. Miriam's breath labored. Nora restless. End on Kalev's hand hesitating over pouch.`
- **Voice-over seed:**
  ```text
  Three sick.
  One of them kept everyone else's charts.
  I had come to do what I knew.
  The room already knew more than I did.
  ```
- **Sound cue:** Clinic bed loop, pencil, cloth.
- **Continuity notes:** Birdie does not speak in Bethany triage. Recognition payoff for Iiro is **later**, not here.

---

## 13 — Lena Hart / Presence Without Tincture

- **Narrative beat:** Lena treats with stained fingers and repaired gloves — no Tincture wheel, only presence.
- **Emotional wound:** Kalev sees an alternative to bypass and numbness.
- **Visible action:** Lena's hand on shoulder (recognition gesture seed); candlelit stitching; she asks about Kalev's vial without lecturing.
- **Source ore:** `docs/lore/tincture_of_mercy_v0_3.md` §VI Lena; `prompts/02-lena-64x96.md`; `micro_symbol_register_v0_8_1.md` §2.
- **Characters:** Kalev, Lena Hart, patients implied.
- **Location:** Bethany side room.
- **Light noun:** Candle over stitching table.
- **HOLD:** 600ms on hand-on-shoulder before release.
- **Visual anchor:** `art/characters/lena/sheets/lena_locomotion_64x96.png`.
- **Image prompt:** Global style prefix + `Lena Hart with cut-fingertip gloves and stained fingers, candlelit repair work, Kalev watching, no aura buff, presence as embodied competence, max twelve words if she speaks.`
- **Video prompt:** Global video prefix + `8 seconds. Needle pulls thread. Lena glances at Kalev's pouch without accusation. End on shoulder touch held one beat.`
- **Voice-over seed:**
  ```text
  She did not use my wheel.
  Her hands knew the wound anyway.
  I wanted to ask how.
  I did not want to hear the answer.
  ```
- **Sound cue:** Thread, candle, quiet breath.
- **Continuity notes:** Lena is not a lecturer. No Tincture bypass aura.

---

## 14 — Father Ilarion / Wayhouse Threshold

- **Narrative beat:** Outside Bethany proper, Father Ilarion offers seat, bread, or silence — not cure promises.
- **Emotional wound:** First sanctioned sacred voice that witnesses instead of consoles.
- **Visible action:** Lean priest (~60) on wayhouse porch; ink-stained copywork hands; optional komboskini after Bethany losses; points toward Bethany, north road, or monastery without quest-register.
- **Source ore:** `Tincture.AiMock/Characters/FatherIlarion/persona.md`; `latent_paths.md` §Hesychasm unlock; `docs/lore/CAST_BIBLE.md`.
- **Characters:** Kalev, Father Ilarion.
- **Location:** Wayhouse porch outside Bethany.
- **Light noun:** Porch lamp; road dusk.
- **HOLD:** 600ms `keep_silence` bed-only if chosen.
- **Visual anchor:** No dedicated sprite yet — generate from persona + sanctioned regime palette.
- **Image prompt:** Global style prefix + `Hesychast priest Father Ilarion on a rough wayhouse porch outside Bethany, lean sixty-year-old, ink-stained hands, simple black cassock, offers bench not answers, Michigan damp dusk, no quest-giver pose.`
- **Video prompt:** Global video prefix + `8 seconds. Priest gestures to bench. Kalev sits. Bread breaks or silence holds. End on road pointer toward Bethany.`
- **Voice-over seed:**
  ```text
  He did not tell me it would be all right.
  He gave me a seat.
  That was closer to mercy than most speeches I had heard.
  ```
- **Sound cue:** Porch wood creak, distant Bethany bed loop.
- **Continuity notes:** Use **Hesychasm** not Pastoral. Verbs: `offer_seat`, `share_bread`, `keep_silence`, `name_in_book`, `point_to_path`, `refuse_request`, `bless_for_road`.

---

## 15 — Iiro Recognition / Fever Break *(Bethany payoff seed)*

- **Narrative beat:** Boy from cabin arrives sick at Bethany. After trust and presence, fever breaks; recognition — not recipe victory.
- **Emotional wound:** Presence remembered across hours; corrected recipe subordinate.
- **Visible action:** Administer care; refusals until trust; line: *"you were the one in the cabin."*
- **Source ore:** `04-latent-paths-receptivity.md` §Bethany payoff; `opening_slice_design_v2.md` §171–179 (distill, reject recipe-as-salvation); `CONTEXT.md`.
- **Characters:** Kalev, Iiro, Lena optional witness.
- **Location:** Bethany patient room.
- **Light noun:** Working light softening.
- **HOLD:** 1.4s on recognition line after fever break.
- **Visual anchor:** `art/characters/iiro/iiro_reference.png`.
- **Image prompt:** Global style prefix + `Iiro in Bethany cot recognizing Kalev after fever breaks, recognition not reward glow, notebook nearby with cabin entries, presence payoff not cure fireworks.`
- **Video prompt:** Global video prefix + `10 seconds. Boy's eyes clear. Pause. He names Kalev. Kalev does not explain. End on held eye contact.`
- **Voice-over seed:**
  ```text
  He did not say thank you.
  He said you were the one in the cabin.
  That was the whole sentence.
  It was enough.
  ```
- **Sound cue:** Fever bed easing; single pencil scratch optional.
- **Continuity notes:** **Recognition/presence** primary; corrected recipe is Apothecary learning only.

---

## 16 — Wittehaven Relief *(expanded)*

- **Narrative beat:** Clean beds, warm food, charts ready before names — salvation that costs the soul slowly.
- **Emotional wound:** Institution offers what Kalev lost: order, competence, relief.
- **Visible action:** Fluorescent hum; Faith over Fear banner peeling; case ID before folk name.
- **Source ore:** `docs/lore/tincture_of_mercy_v0_3.md` Phase II opening; opening deck card 08 (compressed).
- **Characters:** Kalev, Lena, Birdie, staff silhouettes, Halloway implied.
- **Location:** Wittehaven intake / Continuance Hospital threshold.
- **Light noun:** Fluorescent leak → sanctioned Wittehaven light.
- **HOLD:** 1.5s fluorescent hum before dialogue.
- **Visual anchor:** `design_system/preview/colors-wittehaven.html`; regime scaffolds.
- **Image prompt:** (See opening deck 08 — expanded with Faith over Fear banner and E-7 sanctioned Ember mention in props only.)
- **Video prompt:** (See opening deck 08.)
- **Voice-over seed:** (See opening deck 08.)
- **Sound cue:** Fluorescent hum, paper-feed; no ominous sting.
- **Continuity notes:** Wittehaven must first feel like relief and be partly right.

---

## 17 — Patient Dies Well / Protocol Failure

- **Narrative beat:** Kalev brings a woman through peaceful death with presence; hospital files biological failure.
- **Emotional wound:** Medicine works; institution measures the wrong success.
- **Visible action:** Soul-intact death at bedside; chart stamped failure; cross logo on wall as signage.
- **Source ore:** `docs/lore/tincture_of_mercy_v0_3.md` Phase II beats.
- **Characters:** Kalev, dying patient (unnamed), Wittehaven staff.
- **Location:** Continuance Hospital room.
- **Light noun:** Fluorescent leak; no hearth.
- **HOLD:** 600ms after stamp sound.
- **Visual anchor:** Wittehaven regime; patient panel sanctioned copy.
- **Image prompt:** Global style prefix modified Wittehaven + `peaceful bedside death filed as protocol failure, cross as hospital logo signage, Kalev present, chart stamp, no villain sneer.`
- **Video prompt:** Global video prefix + `10 seconds. Breath stops peacefully. Stamp hits chart. Kalev's notebook open with a name. End on case number over folk name.`
- **Voice-over seed:**
  ```text
  She died well.
  The chart said otherwise.
  I had learned which book the room believed.
  ```
- **Sound cue:** Stamp, fluorescent hum, breath stop.
- **Continuity notes:** Cross converted to signage, not denied.

---

## 18 — Repainting Ritual / Birdie Gone

- **Narrative beat:** Civic repainting covers rot; Birdie disappears into foster classification while Kalev charts.
- **Emotional wound:** Misplaced trust — warm building replaced kinship.
- **Visible action:** Children painting curbs; paint smell; empty foster bed; notebook lacks Birdie's new address.
- **Source ore:** `docs/lore/tincture_of_mercy_v0_3.md` Phase II; `micro_symbol_register_v0_8_1.md`.
- **Characters:** Kalev, Lena, Birdie (departed), town children.
- **Location:** Wittehaven streets / foster house threshold.
- **Light noun:** Sanctioned white paint catching fluorescent leak.
- **HOLD:** 600ms on empty cot in foster room.
- **Visual anchor:** Wittehaven environment; Birdie design asset for memory cut.
- **Image prompt:** Global style prefix Wittehaven + `repainting ritual covering rot, children with brushes, Kalev realizing Birdie gone from foster house, classification replacing kinship.`
- **Video prompt:** Global video prefix + `10 seconds. Paint roller passes. Kalev opens foster door. Empty bed. End on his notebook: Birdie.`
- **Voice-over seed:**
  ```text
  The house was warm.
  That was the trap.
  I was busy making names fit their charts.
  When I looked up, she was already gone.
  ```
- **Sound cue:** Paint roller, fluorescent hum, door latch.
- **Continuity notes:** Departure indicts optimization, not cartoon cruelty.

---

## 19 — Iron Ledger Trial / Scapegoat Exile

- **Narrative beat:** Halloway opens the ledger; accusation partly true; Kalev cast outside the camp.
- **Emotional wound:** Self-recognition in the record; exile as accepted role.
- **Visible action:** Clean desk; red stamps; graphite names ghosting under metrics; road north.
- **Source ore:** `docs/lore/tincture_of_mercy_v0_3.md` Phase II; opening deck card 09.
- **Characters:** Kalev, Director Cornelius Halloway, Lena watching, townspeople anxiety.
- **Location:** Continuance Hospital hearing room → town edge.
- **Light noun:** Wittehaven blue-white; no hearth.
- **HOLD:** 600ms name half-covered by case number; then 1.4s on threshold crossing.
- **Visual anchor:** (See opening deck 09.)
- **Image prompt:** (See opening deck 09 + exile road beyond town gate.)
- **Video prompt:** Global video prefix + `14 seconds. Ledger pages. Stamp. Kalev walks out past last lit window. End on road north in snow.`
- **Voice-over seed:**
  ```text
  The ledger did not lie.
  That was its power.
  When they sent me out, part of me agreed to go.
  Outside the camp is where some things die.
  ```
- **Sound cue:** Paper, stamp, door, wind on road.
- **Continuity notes:** Halloway hollow not evil; ledger partly true. *Heb 13:13 / scapegoat* shape.

---

## 20 — Mackinac Crossing / Notebook Lost

- **Narrative beat:** At the bridge, Kalev tries to write his wife's name; wind takes the notebook.
- **Emotional wound:** Gethsemane — names cannot be gripped by force.
- **Visible action:** Five-mile bridge fog; pencil shaking; book lost to water (ambiguous how).
- **Source ore:** `docs/lore/tincture_of_mercy_v0_3.md` Phase III.
- **Characters:** Kalev, Lena possibly, Bridgekeepers implied.
- **Location:** Mackinac Bridge threshold.
- **Light noun:** Lake-light through fog; receding light on water.
- **HOLD:** 1.4s on empty hands after splash or wind.
- **Visual anchor:** Environment concept — generate; no dedicated asset yet.
- **Image prompt:** Global style prefix + `Mackinac bridge fog crossing, Kalev's notebook leaving his hands into grey water, wife's name unwritten, Bridgekeeper silhouette with bread optional, Gethsemane not spectacle.`
- **Video prompt:** Global video prefix + `12 seconds. Wind rises. Page flutters. Book gone. Kalev stands empty-handed. End on far shore without notebook.`
- **Voice-over seed:**
  ```text
  I opened the book in the wind.
  Her name would not stay on the page.
  The water took the ledger I had trusted.
  I crossed anyway.
  ```
- **Sound cue:** Wind, water, fog horn distant; no score swell.
- **Continuity notes:** Page 77 still reserved; loss is diegetic shock, not punishment UI.

---

## 21 — Mount Arvon / Rafe Carver

- **Narrative beat:** Icon-carver hermit names the passion without curing it; repairs an icon board throughout.
- **Emotional wound:** Naming is not fixing; cross as center not periphery.
- **Visible action:** Rafe carving; line about climbing through the center; Kalev exhausted.
- **Source ore:** `docs/lore/tincture_of_mercy_v0_3.md` §VI Rafe; Phase III.
- **Characters:** Kalev, Rafe Carver.
- **Location:** Mount Arvon hermitage (UP).
- **Light noun:** Working light on icon board; lake-light below.
- **HOLD:** 600ms after Rafe's cross line.
- **Visual anchor:** `design_system/assets/reference/` icon references (use sparingly).
- **Image prompt:** Global style prefix + `Mount Arvon hermitage, Rafe Carver repairing smoke-dark icon board, Kalev seated like a pilgrim not a hero, Michigan modest summit, riddles land without exposition.`
- **Video prompt:** Global video prefix + `10 seconds. Chisel taps. Rafe speaks once. Kalev does not stand. End on unfinished icon face.`
- **Voice-over seed:**
  ```text
  You are trying to climb up the outside of the mountain, Kalev.
  The only way up is through the center, and the center is a cross.
  He kept carving while he said it.
  I believed him and could not yet live it.
  ```
- **Sound cue:** Chisel, wind, sparse room tone.
- **Continuity notes:** Turn theology may arrive here late — Mercy as constraint, not early justification.

---

## 22 — Paradise / Page 77 / Notebook Returned *(expanded)*

- **Narrative beat:** Church register holds names already; Birdie returns warped notebook; wife's name writable at line 7 page 77; family presence ambiguous.
- **Emotional wound:** Recognition not achievement; both always/unable to write — both true.
- **Visible action:** Wet boots in narthex; priest writes *Caleb*; Birdie at graveyard gate; graphite shines; son says *We've been here the whole time.*
- **Source ore:** `docs/lore/tincture_of_mercy_v0_3.md` §IX final scene; opening deck card 10; `CONTEXT.md` Bethany payoff.
- **Characters:** Kalev, Birdie/Ruth, priest, wife/children presence (ambiguous), son's cedar smell in daughter's hair.
- **Location:** Paradise church → graveyard threshold.
- **Light noun:** Paradise candle-white; restrained earned gold on page edge only.
- **HOLD:** 1.4s graphite shining in damp paper; then 600ms on son's hand on shoulder.
- **Visual anchor:** `design_system/preview/colors-earned.html`; Paradise regime.
- **Image prompt:** (See opening deck 10 + expanded register book + page 77 line 7 + family shadows.)
- **Video prompt:** Global video prefix + `16 seconds. Register read. Notebook returned. Name written. Family hands. Full Jesus Prayer on lips without triumph. End on light from no direction.`
- **Voice-over seed:**
  ```text
  The names were already in the book.
  I wrote the one I had carried by not writing.
  My son said Dad as if I had only turned away.
  We had been here the whole time.
  Lord Jesus Christ, Son of God, have mercy on me, a sinner.
  ```
- **Sound cue:** Wet boots, page creak, pencil, near-silent room tone.
- **Continuity notes:** No heavenly spectacle; ambiguity of aliveness held. Ruth name may be spoken by priest.

---

## Production note

Cards 16 and 19–22 overlap opening deck 08–10. Use **opening deck** for 60–90s animatic; use **this deck** for pilgrimage proof board (Pass 3 in `STORYBOARD_BIBLE.md` §10).