# v1.0 Art Bible — characters & world, Ironwood slice

Status: binding visual law for all v1.0 asset authoring (Meshy generation, Blender fine-tune, pattern atlases, staged frames, HUD). Sits below `DECISIONS.md` (L1–L12, D4), `PRD.md`, `GATES.md`, `TUNING_V0.md`, `ENCOUNTERS.md`; above every generator prompt and art ticket. Grammar sources: `/home/ark/symbolic-world/DESIGN.md` + the seven grammar files (composition, silhouette, posture, garment, face, color, authority-scale); exemplar plates `/home/ark/gizmo-design-system/art reference/` (study-only). Canon lore: `docs/lore/CAST_BIBLE.md`, `CONSOLIDATED_LORE_SURFACE.md`; v0.9 sprite prompts carry forward as silhouette/palette provenance.

The standing order: **emulate the hand, never copy the page.** Translate operations, not motifs.

Rule IDs are stable and citable (P3, WR6, AD12…). A judge cites a rule ID, never an adjective. An art worker checks their asset against the numbered rule before submission.

## 0. The binding test

G1. Every asset answers five questions before review: What is the symbolic verb? What is the before/after state? What object/surface enforces the rule? What material remembers the cost? What is the smallest emblem that carries the verdict? (DESIGN.md acceptance test.)
G2. An asset that answers "none" to any G1 question is rejected without further review.
G3. Every rule in this file derives from packet law (D/L/A/F rows), a grammar file, or observed plate practice; the derivation is cited inline.
G4. Where this bible and a generator (Meshy, Blender auto-rig, any AI front-end) disagree, this bible wins; generations are re-prompted or resculpted until they pass (D4).
G5. Nothing in this file authorizes 1:1 derivation from the plates; composition recipes may be translated, page layouts may not be traced (PRD non-goals).

## 1. Proportion sheet

P1. Adults stand 1:7.5–8 head:body, elongated (D4). Kalev is authored at the 1:8 end; no adult under 1:7.5.
P2. Iiro (apparent age 7–9) stands ~1:5–5.5 with a slightly oversized head and thin limbs; he must never read as a scaled-down adult (v0.9 boy acceptance #5 carried up).
P3. Wolves keep real-animal proportion: withers height ≈ two-thirds of nose-to-tail-base body length, long-bodied quadruped, visible spine/shoulder definition; no dire-wolf fantasy scale (ENCOUNTERS wolf law; v0.9 wolf sheet provenance).
P4. Hands are long-fingered and oversized relative to a naturalistic wrist: hand length = 0.9–1.0× head height (chin to crown). Hands carry gesture; wrists stay thin (plate figure law).
P5. Necks run long (~+0.5 head over naturalistic); shoulders narrow and sloped on all humans, including the Warden (plate figure law).
P6. Gameplay capsule (r=0.35, h=1.7–1.8, D8) is collision truth; the visual mesh is taller (~1.9–2.0m at 1:8) by design. Hurtboxes follow capsule + sidecar data, never visual extremities — coat hems, scarf, sleeves, and hair are exempt from hurt.
P7. Silhouette width does not inflate to match combat presence: capsule stays slim truth, silhouette stays elongated art. Divergence is declared here so no artist "fixes" it (D8 "visuals taller — deliberate").
P8. Faces carry at most five marks: brow line, nose line, closed or downcast eye curve, small mouth, optional cheek tone. Red lips are the only red permitted on a face (plate synthesis; face-restraint grammar).
P9. Deaths are authored directional crumple clips (≥4 directions per enemy class, D4); carved figures fall, they do not flop. No ragdoll-written locomotion anywhere.
P10. Role must read from a pure-ink silhouette still before any costume detail is considered (silhouette grammar core rule; gate A10).

## 2. Character sheets

Each sheet assigns: role silhouette (silhouette grammar's role modes), garment mode (garment grammar's 9 canon modes), palette (L2 tokens + declared ramps), face restraint spec (face grammar), and signature poses (posture grammar).

### 2.1 Kalev Ward — the route body

KA1. Role: **A — Axis Figure.** The named center and route body of every scene he is in; compositions organize around him without making him a glamour portrait (silhouette grammar mode A).
KA2. Garment: **W — Workwear Conversion.** The nurse's competence converted to woodsmanship: long cedar-brown coat to mid-thigh, scarf mass framing the face, practical boots and gloves (CAST_BIBLE silhouette; v0.9 Kalev plan).
KA3. Silhouette anchors: coat A-line + scarf block at the neck + pouch right hip + notebook left breast + Cedar Dog charm at pouch slot 1. These five masses must survive pure-ink reduction (A10).
KA4. Palette: ink `#211b17` line and deep coat shadow; dark green `#365a49` scarf/pine-shadow mass; parchment `#f8f1e5` ramp for skin and vellum highlights; muted `#6b6156` midtones. No oxblood anywhere on his person. Gold is never painted into the base model — his one licensed warm accent is the vial's jewel glint, runtime emblem light only (v0.9 earned-colors law: runtime, never painted).
KA5. Face restraint: default gaze `downcast` or `withheld`; five-mark face (P8); state marks limited to forehead lines and the lowered face. No blendshape expression sheets (D4).
KA6. Idle: weight slightly forward, hands resting near pouch and notebook — competence at rest, not heroic neutral.
KA7. Walk: measured, head level, no swagger; displacement reads as per-tick authored curves (F8), and the posture sells that the ground costs something.
KA8. Attack anticipation: the hearth iron's wind-up is a measured tool-raise, not a brandish — the object is lifted into ritual focus with a worker's economy (posture grammar verb 2 read through labor, not menace). Telegraph reads through the iron's line and shoulder set; never a "dramatic pose" (posture grammar hard avoid).
KA9. Material memory: after Anna's death the vial rides at his chest and the coat carries the hearth's soot mark permanently; any repair adds a seam, never a reset (L11).

### 2.2 Anna — the kept body

AN1. Posture verb: **Horizontal Body — Keep Presence** (posture grammar verb 3). The bed is her threshold; she does not leave it; the room's verticals (Kalev, Iiro, door posts) stand as witnesses around her horizontal line.
AN2. Garment: **V — Protective Veil.** A thin wool blanket to mid-chest keeps suspended life and controls approach; linen nightgown collar visible above the blanket line (garment grammar mode V; v0.9 mother sheet).
AN3. Silhouette: long hair fanned on the pillow, unstyled; head tilted slightly toward the approach side; one hand visible on the blanket — the hand opens in the fading state and does the narrative work (v0.9 row law carried to 3D).
AN4. Palette: white mercy field — parchment/vellum ramp dominant on linen and skin, shifting toward damp-ash dominance as the state thins; blanket in cedar/ink ramp. No red on her body; no theatrical pallor.
AN5. Face restraint: eyes `closed` or `downcast`; mouth slightly parted only in the final still. Never a deathbed icon before the beat lands: no halo, no flowers placed on the body, no praying-hands pose (v0.9 avoid list, binding here).
AN6. State arc: alive → thinning → fading-into-still is carried by breath amplitude, hand position, and mouth seam — never by camera move or light show. The one licensed light change is the hearth dim (EN9).
AN7. Scale: she runs true scale but frame-small; witnesses (the cup, the kettle, Iiro) carry the margin around her (L7; authority grammar mode W).

### 2.3 Iiro — the carried fear

II1. Proportion per P2; slim, upright, narrow silhouette.
II2. Garment: **O — Ordinary Repair.** Oversized rot-brown hand-me-down coat to mid-thigh, sleeves slightly past the hands, tight wool cap, tucked linen scarf, scuffed boots — humble, durable cloth (garment grammar mode O; v0.9 boy sheet).
II3. Silhouette tell: **one shoulder raised** — the carried-fear posture. It persists subtly through every locomotion clip; losing it in any clip fails review (v0.9 acceptance #7 carried up).
II4. Palette: ink/rot-brown ramp for the coat, pine-shadow green scarf, parchment-ramp skin; cold-breath puff in parchment white, two or three motes maximum, fading fast (v0.9 breath-puff law).
II5. Face restraint: `calm child gaze` is his licensed state mark (face grammar). Never cute, never oversized eyes, never smile-as-default (v0.9 avoid list).
II6. Signature pose: hands clasped or held close to the body. The bread receipt — hands extend, draw the bread to the chest, kneel on heels, head bowed — is the recognition seed; hands and head angle do the work, no halo, no glow (v0.9 acceptance #6).
II7. Flight route: he runs small, slightly behind or away from adult silhouettes, looking back once per cycle; he is never a babysat escort object (ENCOUNTERS beat 4).

### 2.4 Birdie — the admissible stranger

BD1. Role: **T — Threshold Bearer.** The extended gift hand at the road threshold; her scene is the offer that must be refused (silhouette grammar mode T; ENCOUNTERS beat 9).
BD2. Garment: **D — Disguise Shell.** Layered mismatch, false age, hood/scarf lowering the face — a known unknown made admissible. Her layers are intentional, not poverty aesthetic (garment grammar mode D + hard avoid).
BD3. Silhouette anchors: small body, slight head tilt, the open palm with the apple. Her wrongness reads through stillness, never clowning or comic-relief energy.
BD4. Palette: parchment and muted ramp with dusty rose `#b07a83` as her accent (tenderness, human warmth — color grammar). The apple is her only oxblood carrier and the coda scene's entire red budget (L8).
BD5. Face restraint: gaze `withheld` until the refusal, then `viewer-facing` for one held beat. Misnaming Kalev "Caleb" is a text event, not a face event — the face stays restrained while the word does the work (CAST_BIBLE tell).
BD6. Scale: witness-small (L7). She never dominates the frame; the road and the threshold dominate.

### 2.5 The Warden of the Ironwood — procedure as a person

WR1. Role: **K — Keeper Mourner fused with C — Enemy As Procedure.** The silhouette must read "keeper of a line" before it reads "boss"; he is a checkpoint keeper whose keeping outlived the asking (ENCOUNTERS ⚓-adjacent).
WR2. Garment: **W — Workwear Conversion + S — Stripped Insignia** (ENCOUNTERS lock): warden's oilcloth, insignia stripped to a pale ghost-patch where rank fell off the body, tin-tagged snare belt.
WR3. Silhouette anchors: lantern left hand, felling axe right, hood block, the tag-belt reading as a second hem. Role legible in pure ink at gameplay distance (A10).
WR4. Scale: ~1.3× Kalev's height — authority enlargement (authority grammar mode R: size means permission pressure), elongated and gaunt like all cast; never stock-boss mass (silhouette grammar hard avoid).
WR5. Palette: ink + dark green dominance (vigil and custody), oilcloth in the muted ramp; gold only on the lantern — named carrier, verb `guide` turned `accuse` (L9, L4). Tin tags are dulled grey metal, never gold: dulled material memory (L11).
WR6. Face restraint: half-shadowed under the hood; gaze `cold`/`withheld`. Phase 2 face-fade advances — features flatten toward silhouette, the plates' omen law — never gore, never glow (ENCOUNTERS; face grammar).
WR7. Anticipation language: deliberate woodman's arcs. The overhead fell reads as a committed stroke telegraphed by tool line and stance width (≥30t heavy tells, F3); the step-back lantern raise (the declared bait) is posture verb 2 — the offered object.
WR8. The ceremony: hanging the lantern on the snare line is a threshold act; his 90-tick stillness is a vigil posture and the arena holds its breath — no damage, no cheap hit (ENCOUNTERS lock).
WR9. Aftermath: the body relaxes procedure into rest without gore; his belt tag is the arena's smallest bright object and carries the whole verdict — authority mode B, Tiny Origin Cost (ENCOUNTERS aftermath).

### 2.6 Wolves — real animals

WF1. Proportion per P3; withers below an adult's hip line. The natural world keeps true scale — that honesty is the baseline against which authority-bent scale reads (SC3).
WF2. Eyes are ink: no glow, no catchlight, no white sclera (D4; face grammar hard avoid). The v0.9 single ember-eye pixel is retired in 3D — see Disputes D-2.
WF3. The pack's "face" is ear and tail grammar: ears pinned + crouch = Lunger pounce tell; low head, weight back, circling = Baiter feint; fast low flank with tail level = Harrier. Every attack telegraphs ≥12t through body language alone (F3).
WF4. Fur: damp-ash muted ramp base, pine-shadow deep spine line, parchment belly highlight in small coverage; detail is directional hatch along fur growth, never noise spray (L6).
WF5. Tail grammar: low hang in idle; rises in alert and howl; between the legs in flee (<25% Pulse, ENCOUNTERS).
WF6. Death: collapse on side, legs folded — the recoverable-body pose. No gore, no blood spray; loot (hide/sinew/tooth/meat) is consequence recorded in the notebook, not painted on the carcass (ADR 0008 spirit; v0.9 wolf law).
WF7. The howl: head lifted vertical, posture compressed — the one permitted upward wolf silhouette. It is a pack-state event (token escalation), staged like a candle being raised, not a monster roar.

## 3. Weapons & props — material memory

PR1. Universal: every tool shows its first use; conversion and repair keep seams, scars, dulled surfaces (L11). Repaired ≠ new, anywhere in the slice.
PR2. **Hearth iron** (opening weapon): soot-darkened lower half, grip polished by years of hands, heat-blued tip gone dull. A warming tool turned weapon — it must never be resculpted toward a sword silhouette (ENCOUNTERS beat 6).
PR3. **Felling axe** (Warden): poll worn, haft grain raised, edge maintained. The horror is that the tool is well-kept — procedure cares for its instruments (WR1).
PR4. **Lantern**: named gold carrier (L9), verb `guide` — `accuse` in the Warden's hands. Flat disk flame + scalloped halo, tin-and-mica construction, no volumetrics (L4). Hangs on the snare line during the ceremony (WR8).
PR5. **Snare line + tin tags**: wire strung with pressed tin tags, each stamped with a line-mark — a name filed down to procedure. Tags are witness-small, enumerable, and chime on contact (audio tell; root 45t). Count made visible as pattern (plate law).
PR6. **The vial** (Anna's medicine, the flask): the one licensed PBR-gloss object on Kalev (L3). Oxblood-family glass with a parchment-bone stopper; half-full at inheritance. The fill line is material memory — a Hearth refill never renders it "clean new" (D6 borrowed mercy; L11).
PR7. **Notebook**: leather cover, damp vellum pages, graphite hand. Page 66 line 7 read-only (Eli precedent); page 77 line 7 reserved — never rendered in the slice (CAST_BIBLE locks). Names appear as hand-written entries, not UI list items.
PR8. **Pouch**: 8×2 slots. Slot 1 Cedar Dog — locked, matte cedar, no gold paint ever (v0.9 law). Slot 16 Ember — always last; Ember glow is runtime emblem light, never painted (v0.9 earned-colors law).
PR9. **Bread & water**: ordinary mercy props. Bread is broken, never sliced; water is carried open with readable slosh risk. Parchment/ochre ramps; zero glow (ENCOUNTERS beat 1).
PR10. **The apple**: the coda's single red carrier. Offered open-palmed; refusal leaves it in her hand — the red stays unspent, and that is the point of the scene (BD4).
PR11. **Bedside witnesses** (cup, kettle, night-table): witness objects run small and are placed with intent; a single moved cup carries more lore than a crowd (composition grammar; AN7).

## 4. Environment law — the Ironwood

EN1. **Pine colonnade**: old-growth trunks are vertical witness columns in ink; canopy masses are serrated flat dark pattern. Trunks frame the shallow frontal bowls that stage the free camera like a plate (D2 staging by geometry).
EN2. Tree pattern families: bark = vertical hatch + spiral grain knots; canopy = repeating needle-scale fill. No photoreal bark, no fifth texture family (L6; plate pattern law).
EN3. Ground: needle-floor as directional hatch bands + damp stipple; undergrowth (fern, thistle) as flat cutout pattern clusters. One oxblood thistle or berry sprig per scene at most, always a named carrier (L8).
EN4. Snow that does not stay: damp November. Snow is stipple patches on north faces and branch tops with melting edges — never blanket white, never cozy (lore: damp November, snow that does not stay).
EN5. Cabin exterior: log gable grammar — log-end spiral rings, carved diamond frieze on the lintel only; dark damp cedar ramp.
EN6. Cabin interior: shrine staging — one frontal plane, the hearth as the room's axis; witnesses placed (bed, table, kettle, cup, woodpile). Domestic quiet earns open parchment wall space, but damp: vellum carries 1–3% noise grain; pure flat color reads as Wittehaven and is a defect here (v0.8.1 regime law).
EN7. Hearth unlit: ink geometry, ash bed, cold iron; the HUD border shows the unlit verdict state (L10).
EN8. Hearth lit: gold ray-fan + scalloped halo disk, flat flame teardrops; warmth is declared by gold budget, never orange bloom; verbs `warm`/`vigil` (L4).
EN9. Anna's death dims the hearth ~18% (ENCOUNTERS ⚓), rendered as exactly one declared ramp step down, not a continuous fade (L3 stepped shading). See Disputes D-1.
EN10. Depth bands: 3–4 quantized bands toward muted blue `#263d5e`; each farther band is flatter and more patterned; band edges follow terrain planes (L5; gate A8).
EN11. Painted backdrop: the far field is flat pattern — serrated tree-line silhouettes over a temperature-zoned parchment/teal field, star-rosettes and faced moon disk where authored. No physical sky, no volumetric clouds (L5; plate sky law).
EN12. Water: the thin Gerstner layer is styled as woodcut wave curls — engraved parallel curve families, ink crests, jewel-tone override in the declared blue-green ramp; streams read as route signs; no foam-spray particles (R9; plate water line-work).
EN13. Emblem light: every light is a visible diegetic emitter with a registered verb — candle=`vigil`, hearth=`warm`, lantern=`guide`, moon=`hide`; arena light shafts render as ray fans, not volumetrics (L4).
EN14. Wither rendering: ambient Wither off-path is margin-and-mote language — a desaturation band plus sparse ink motes. Never green fog, never corruption-splash VFX (color grammar hard avoid; D6 margin law).

## 5. Scale by authority — slice table

SC1. Scale is assigned by authority, never camera realism (L7; authority grammar core rule).
SC2. The slice scale table:

| Figure / object | Scale law | Authority mode |
|---|---|---|
| Kalev | 1.00 reference (~1.9–2.0m visual) | A — axis figure |
| The Warden | ~1.3× Kalev | R — relic approach enlargement |
| Wolves | true animal scale (withers ~0.8m) | realism baseline |
| Anna (abed) | true scale, frame-small | horizontal kept body |
| Iiro | child ratio, small | M — measure |
| Birdie | small | W — marginal witness |
| Birds, cups, Cedar Dog, tin tags | small, enumerable | W — marginal witness |
| Vial / apple / Warden's tag in staged frames | may enlarge past realism | B — tiny origin cost |

SC3. The natural world (wolves, trees, terrain) keeps true scale; only verdict-bearing things bend scale. The bend reads because the baseline is honest (authority grammar).
SC4. Bosses and verdict objects exceed camera realism; witnesses run small (L7).
SC5. The snare ring reads larger than its geometry at the arena edge — boundary pressure is authored scale, not collision (ENCOUNTERS Living Boundary).
SC6. No toy-world miniatures, no uniform icon sizing, no dramatic close-up scale (authority grammar hard avoids).
SC7. Scale bends live in staged frames and HUD only; in free combat camera, world scale stays sim-true (D2).

## 6. Staged-scene compositions — seven slots per staged moment

CM1. Every staged frame names all seven slots — field / axis / threshold / witness / light / memory / border — before approval (gate A13; composition grammar core rule).
CM2. Staged frontal framing exists only in no-damage moments; the camera releases to free orbit the instant verbs are combat verbs (D2).
CM3. The field is chosen before the character; the field declares state faster than pose or prop (composition grammar layer 1).
CM4. One small witness carries the verdict; symbols never compete equally (composition grammar review gate).
CM5. The HUD border is part of the composition — in a staged frame the border is the plate's margin and its verdict state is designed with the frame (L10; CM5).

**Scene 1 — Anna's death (⚓ canon-locked):**
CM6. Field: white mercy field tilting toward vigil — parchment dominant, hearth gold reduced one ramp step (EN9).
CM7. Axis: the bed's horizontal line against the room's verticals; the kept body is the still center.
CM8. Threshold: the bed itself; Kalev has crossed to it and does not cross back within the scene.
CM9. Witness: Iiro small at the margin; the cup on the night-table; the border's waking ornament.
CM10. Light: hearth, verb `warm`, dimmed one declared step; no other emitter wakes.
CM11. Memory: the vial — her remaining doses pass to Kalev; borrowed mercy stated in one notebook line (ENCOUNTERS beat 5).
CM12. Border: footer verdict band records the death line in graphite hand; the margin narrows one step as the world's Turn advances.

**Scene 2 — Hearth rest (keeping vigil):**
CM13. Field: black vigil field (color grammar Vigil Contrast: black keeps grief, gold marks permitted attention).
CM14. Axis: the flame vertical; Kalev low beside it, kneel posture available — approach requires permission (posture verb 4).
CM15. Threshold: the hearth's stone ring; sitting at it is the crossing.
CM16. Witness: the Cedar Dog at pouch slot 1 — the smallest emblem in the frame.
CM17. Light: hearth, verbs `warm`/`vigil`; gold ray-fan per EN8.
CM18. Memory: the notebook opened, Names written; pages keep every prior mark — append-only truth (PR7).
CM19. Border: lit-state ornament wakes; the vigil seal appears in the footer (HB3).

**Scene 3 — the Warden's ceremony intro (single held frontal frame):**
CM20. Field: custody green — old-growth colonnade enclosing (color grammar Custody Green: green feeds and encloses).
CM21. Axis: the light shaft he stands into; the hung lantern after the transition (ray fans, not volumetrics).
CM22. Threshold: the snare-line ring — the Living Boundary and Beautiful Hazard (ENCOUNTERS).
CM23. Witness: the tin tags, enumerable, chiming when touched.
CM24. Light: lantern, verb `guide` turned `accuse`; the shaft as emblem light.
CM25. Memory: the well-kept axe and the stripped-insignia ghost patch (WR2, PR3).
CM26. Border: boss-phase verdict state; no title card — the UI never names him until the player writes his name (ENCOUNTERS lock).

**Scene 4 — item revelation (generic spec; instance: the vial inheritance):**
CM27. Field: parchment field with one state-bearing focal object (DESIGN.md layout grammar).
CM28. Axis: the object itself, slightly enlarged past realism — relic approach (SC2 mode B).
CM29. Threshold: the act of taking; the hand crosses to the object and the frame holds until it does.
CM30. Witness: one small emblem only — a bird, a cup, the Cedar Dog; never a crowd (CM4).
CM31. Light: one named emitter; the object never self-glows (L4).
CM32. Memory: the object shows prior use — soot, wear, dulled metal, a fill line (PR1).
CM33. Border: footer cartouche carries the item's folk name; Numbness may degrade it one register toward State language (D6; HB8).

**Scene 5 — Birdie's threshold (⚓ apple-refusal coda):**
CM34. Field: route conversion — cool field warming toward gold at the road's bend toward Bethany (color grammar Route Conversion).
CM35. Axis: the road's S-curve — the one permitted diagonal energy (plate law).
CM36. Threshold: the bend/fork where the offer happens; crossing is the slice's exit.
CM37. Witness: Birdie small at the margin of the road; one black bird emblem.
CM38. Light: late overcast gold break, verb `guide`; no sun spectacle.
CM39. Memory: the apple — offered, refused, unspent; the red stays in her hand (PR10).
CM40. Border: if the Warden's name is unwritten, the footer holds the unwritten mark — the border accuses gently until the player writes it (ENCOUNTERS aftermath).

## 7. HUD / border — the manuscript apparatus

HB1. The HUD is a diegetic manuscript border, not an overlay (L10).
HB2. Anatomy: outer rule line, corner flourishes, a left margin ornament column whose character matches zone state (bare thorn for danger, carved warmth for domestic), a footer verdict band, and a colophon mark (plate border anatomy).
HB3. Enumerable verdict states, image-diffable (gate A5): Hearth lit / unlit; Turn advance (the margin narrows from all four sides — the page closing in — never a green bar, D6); boss phase; the unwritten-tag mark; Numbness register steps.
HB4. Where things live: **Pulse** = the left margin column's lit vellum height; **Breath** = the right margin's shorter responding measure; **doses** = countable drop emblems along the footer left; **Names** = graphite tally marks at the colophon position — hand-counted, never digits.
HB5. All border meters are stepped (2–3 stops), never continuous gradients (L3).
HB6. The Turn at cap renders the actor as Turned by border verdict + world desaturation, never a flash (D6; EN14).
HB7. Typography, folk register: IM Fell English for names and titles, EB Garamond for body, Caveat for the notebook hand and tiny pouch labels, Cinzel small-caps wide-tracked for border labels (v0.8.1 regime system carried; `fonts/`).
HB8. State register (IBM Plex Mono caps, institutional blue) appears only as Numbness degradation — each Ember stack drops one more element to State language until a Hearth partially restores it. Cross-regime contamination otherwise is a defect, not a flourish (D6; v0.8.1 contamination law).
HB9. Gold in the border is reserved for the lit-Hearth seal and earned halo moments; never button fill, never headline color, never premium-UI shine (L9).
HB10. Counts render as countable emblems (plate law: number made visible as pattern); bare numerals never appear in the world frame.
HB11. Border pattern cells come from the Ironwood atlas family (filigree, thorn, pine-scale) so HUD and world are one workshop — see `PATTERN_ATLAS_PLAN.md`.

## 8. Anti-drift — the numbered reject list

Reject on sight; the derivation is cited so the citation, not taste, does the work.

AD1. Glowing eyes, on any actor (face grammar hard avoid; D4; ENCOUNTERS wolf law).
AD2. Blendshape expression sheets, reaction faces, mood-face UI (D4; face grammar).
AD3. Open-mouthed emotion, grins, more than five facial marks (P8; plate face law).
AD4. Stock-boss proportions, monsterification, giant-with-no-authority-job scale (silhouette grammar hard avoids; authority grammar mode X).
AD5. Sexy villain dress, glamour portraits, princess glamour (garment + face grammar hard avoids).
AD6. Victory gold, loot-rarity gold, premium-UI gold, victory-glow of any kind (L9; color grammar gold instability).
AD7. Washed or spread red, gore-scale blood, red on landscape or innocents (L8; color grammar precision red).
AD8. Photoreal normal/roughness maps or any photoreal texture source (L6).
AD9. Generic glow, fog, particles where material evidence could carry the state (DESIGN.md hard avoids; L4).
AD10. Camera shake or FOV punch — impact is hitstop + border/ink pulse + audio, never shake (L1).
AD11. DoF/bokeh, motion blur, lens flare, continuous haze (L1, L5).
AD12. Cast shadows and optical light modeling; light is iconic — disks, halos, ray fans, teardrop flames (plate light law; L4).
AD13. Any fifth texture family outside hatch / scroll-filigree / mosaic band / stipple-grain (plate pattern law; L6).
AD14. Aerial perspective — distance goes flatter and more patterned, never hazier (L5; gate A8).
AD15. Cute or mascot wolves, anthropomorphism, dire-wolf scale (v0.9 wolf avoid list; ENCOUNTERS).
AD16. Horror clutter, skull masks, zombie-horror Turned — the Halloway rule: wounded, plausible, partly right (ENCOUNTERS; DESIGN.md hard avoids).
AD17. Copied icons, saints, halos-as-decoration, vestments, liturgical text, devotional objects — borrow structure (stillness, frontality, threshold, witness), never sanctity (sacred boundary, all grammar files).
AD18. Spotless restoration — repaired that reads as new (L11; DESIGN.md principle 7).
AD19. Toy-world miniatures, dollhouse scale, uniform icon sizing that erases rank (authority grammar hard avoids).
AD20. Literal source-prop leakage — apples as brand, hair-climbing, storybook cameos; translate the operation (offer, tether, threshold), never the motif (DESIGN.md principle 0).
AD21. Waypoint glow, quest arrows, route VFX — routes are gold seed-marks and material signs (color grammar Route Conversion; witness navigation recipe).

## 9. Disputes

Packet files are law and are not edited here (slice non-goals). Recorded disagreements, for the council's next round:

D-1. ENCOUNTERS ⚓ dims the hearth "~18%" at Anna's death; L3 mandates 2–3 stop stepped shading. This bible renders the dim as one declared ramp step (EN9) and treats "~18%" as the target value of that step. If the art gate reads the step as too coarse, the fix belongs in TUNING/GATES (a declared half-step), not in a continuous fade.
D-2. The v0.9 wolf sheet licensed a 1px ember-red eye as the "earned colors" exception; D4/L8 ban glowing eyes outright. This bible retires the pixel in 3D (WF2). If the council wants a living/downed eye tell, the legal form is a hitstop-frame ink inversion on the death crumple, not an ember pixel.
D-3. D8's capsule (h=1.7–1.8) against 1:8 elongation (~1.9–2.0m visual) is declared deliberate, but the divergence invites artists to thicken silhouettes toward capsule width. P7 legislates against that; flagging so the feel gate watches for capsule-vs-silhouette readability complaints before any proportion retreat.
