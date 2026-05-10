# Scene Composition Bible — v0.8.1

How each prototype-slice scene is composed at the camera level: framing, blocking, lighting, audio, beat structure, and the perceptual rules that make the icon-manuscript reading land. Reads after `art_direction_v0_8_1.md`.

This document covers the three scenes that land in the prototype slice:

1. **Cabin (Day 1, Eli)** — opening; loss; the fact of practice without rescue.
2. **Ironwood Road (Day 1→2 transition)** — corridor; first contact with Birdie; first Wittehaven foreshadow.
3. **Bethany Triage (Day 2)** — the field; three beds; the choice that shapes the player's relationship to the Ember.

Future scenes (Mackinac, Wittehaven Block 0044) are noted at the end as composition-reservations only.

---

## 1. Composition vocabulary (used throughout)

| Term | Meaning |
|---|---|
| **Frame** | Camera viewport at native resolution (480×270 design canvas). |
| **Stage band** | Horizontal slice of the frame: *sky* (top 25%), *world* (middle 50%), *underworld/water* (bottom 25%). Major beats use all three; ordinary play uses *world* only. |
| **Vertical anchor** | The single line in the frame the eye returns to (a wall plane, a hearth, a bed-edge). One per scene. Never moved during a beat. |
| **Eye-line** | Where Kalev is looking. The camera respects it; never crosses it during a beat. |
| **Beat** | A composed moment with a single emotional value. Bethany is six beats. The Cabin scene is four. |
| **Held frame** | A composition the camera does not move within. Length measured in seconds. |
| **Manuscript intercut** | A still icon-panel inserted between beats. Always framed in the manuscript double-frame. Always silent for ≥600ms before the next beat resumes. |
| **Cold breath** | Particle: 1–2px `--vellum-bone` at 24% opacity, drifting up. Triggered on idle in cold scenes. The only weather particle in the game. |

---

## 2. Camera laws

The camera is a witness, not a cinematographer.

- **No zoom.** Camera is fixed-scale at 1× during play. Scale changes only between scenes (cut to icon-panel, cut back).
- **No shake.** Pressure tremor lives on the cursor and on Kalev's hand sprites — never the camera.
- **Slow pan only.** When the camera moves during a beat, it moves at ≤ 12px/second.
- **Cuts, not dissolves.** Scene transitions are hard cuts with a 320ms vellum-bone fade-from-black. No dissolves between gameplay frames.
- **Held frames are valid.** A 4-second still on Eli's hand is a beat. Do not "fix" it with motion.
- **The camera respects the eye-line.** It does not cross Kalev's gaze axis during a beat.
- **Player camera = Kalev camera.** Player input cannot move the camera independently. The player follows the witness; the witness does not follow the player.

---

## 3. Lighting laws

Light is a noun. Each scene names its light.

| Scene | Light name | Source | Color | Behavior |
|---|---|---|---|---|
| Cabin | *the hearth* | Hearth | `--ember-red` warm + `--vellum-warm` ambient | Flickers 4-frame, 480ms; brightest at frame center. Fades by 18% during Eli's death beat. |
| Ironwood Road (day) | *the lake-light* | Sky | `--lake-slate` ambient | Flat, gray, no flicker. Snow patches reflect 6% brighter than ground. |
| Ironwood Road (dusk) | *the receding light* | West sky | `--rot-brown` warm horizon, `--ink` zenith | Vignette 12% darker at frame edges. |
| Bethany sickroom | *the working light* | Three candles + window | `--vellum-warm` warm, `--lake-slate` cool from window | Window light cooler than candle; the two zones never blend. Patient beds are lit by candle; door is lit by window. |
| Wittehaven prop (foreshadow) | *fluorescent leak* | Off-frame | `--witte-cool` cold | Visible only as a 4px-wide cool rim on the paint cans. Never lights Kalev. |

### Forbidden lighting
- No god-rays.
- No bloom.
- No lens flare.
- No colored shadows except in Bethany window-zone (the lake-cool shadow is the diegetic cue).
- No screen-wide flash on Ember administration. Ember flashes locally on the patient panel (220ms, single instance).

---

## 4. Audio composition (camera-level)

Audio is composed per beat. The mix has three layers and only three.

| Layer | Function | Examples |
|---|---|---|
| **Bed** | Ambient sustain. One sound, very low. | hearth crackle, wind in pines, sickroom murmur, pencil scratch in notebook. |
| **Mark** | Single discrete event tied to a player or world action. | kettle whistle, vial uncork, breath cease, name written. |
| **Disclosure** | A held quiet that follows a mark. ≥600ms of bed-only. The disclosure layer is silence-with-bed; this is where the player feels what happened. |

**No music in the prototype slice.** Score belongs to v0.9+. The room sound is the score.

### Caption requirements
Every gameplay-affecting audio mark carries a caption (low-contrast vellum text, bottom of frame, fades 1.6s). Forbidden as caption: the word "fail." Forbidden as caption mark: any sound that affects gameplay without a caption.

---

## 5. Scene 1 — Cabin (Day 1, Eli)

**Emotional value:** the practice survives the loss. The player learns that *Sit · Observe · Warm · Write the name* are the verbs of the game.

**Duration:** ~4–6 minutes player time across four beats.

**Vertical anchor:** the bed.

**Eye-line:** Kalev → Eli, fixed.

### 5.1 Layout

Cabin interior, 480×270 frame. Single room. Hearth left, bed center, window right, table front-right with notebook. Door rear-right (locked for the scene). Kalev enters from the door at scene start.

```
   [hearth]   [window]
   [    bed    ]
   [   table+notebook   ]
                        [door]
```

Foreground occluder: a low ceiling beam at top of frame, 50% opacity over Kalev when he passes under.

### 5.2 Beats

#### Beat 1 — *Arriving* (held 6s)
- Kalev stands at the door. The room is silent except for hearth bed.
- The pouch is shown for the first time at his hip.
- Bethany resident not present in this scene.
- **Held frame.** No prompt. After 6s, a faint Caveat label appears at the bed: *"Eli."*
- Player input enabled after the label.

#### Beat 2 — *Practice* (player-driven, ~3 minutes)
- Player moves Kalev to the bed; the **patient panel** opens (folk register).
- Available verbs: *Sit · Observe · Warm · Administer… (pulseleaf-water, salt-wash, honey-water) · Write the name*. *(v0.8.1: bitterleaf removed; solve through locked craftables.)*
- **Ember is in the pouch but cannot target Eli.** During Beats 1–3 the patient-panel Ember verb is greyed when Eli is selected. The label reads *"ember — not for the boy."* This establishes Ember as not-the-answer for the dying child, without removing the temptation entirely.
- The Tincture Wheel is available for one craft (warming tea). Quality reads tactile.
- Symptom labels update by sentence: *"thin · cold"* → *"thinner · colder"* → *"thin · still."*
- **There is no save here.** The player cannot rescue Eli. Whatever they do, the breath quiets.

#### Beat 3 — *Cease* (mark + disclosure)
- The mark: a single soft exhale. 240ms.
- The bed-layer hearth dims by 18%.
- The patient panel symptom row collapses to one line: *"still."*
- Disclosure: 1.4s of hearth-bed only. No prompt. The player can do nothing. **This is intentional.**

#### Beat 4 — *The notebook* (held 8s + manuscript intercut)
- The notebook auto-opens to a fresh page.
- Kalev's hand (sprite) lifts a pencil. Player presses any key once to write.
- The line fills via 320ms pencil-stroke: *"Eli Keene."*
- Below it, faint Caveat italic appears *(unprompted, written by the game itself)*: *"The breath left before the name did."*
- **Manuscript intercut:** icon panel — Cabin death composition (see §11). Held 4s. Vellum-bone fade. Cut to next scene.

### 5.3 Anti-drift rules
- Do not allow Ember to be administered.
- Do not allow Eli to live.
- Do not show numerical readouts.
- Do not let the player skip beat 4.
- Do not play music. Do not show a "scene complete" card.
- Do not award anything. Beat 4 ends with the cut. The notebook page persists.

---

## 6. Scene 2 — Ironwood Road (Day 1→2)

**Emotional value:** the corridor between losses. First contact with Birdie. First Wittehaven contrast.

**Duration:** ~3–5 minutes.

**Vertical anchor:** the road.

**Eye-line:** Kalev → north (forward).

### 6.1 Layout

Horizontal corridor, scrolls left-to-right. Three composed segments:

| Segment | Length (tiles) | Notable props |
|---|---|---|
| **A — Cabin exit** | 24 tiles | Last view of the cabin (offscreen left at segment end); cedar fence; one Pulseleaf cluster. |
| **B — Birdie's tree** | 12 tiles | A pine off-road right; Birdie sitting beneath it; a single small `--ember-red` apple in the snow. |
| **C — Crossroads** | 16 tiles | Road forks (north to Bethany, east is locked); a sanctioned Wittehaven paint-can prop at the east-fork barricade; a torn ribbon snagged on the post. |

### 6.2 Beats

#### Beat 1 — *Walking out* (player-driven, ~90s)
- Kalev walks from cabin exit. The bed-layer is wind-in-pines.
- Cold breath particles enabled.
- Burden meter overlay shows *carried*. Pressure: *tight*. Numbness: *fully present.*
- Pulseleaf cluster offers a *gather* verb. Optional.

#### Beat 2 — *The apple* (player-driven, hold-or-leave choice)
- Birdie sits beneath the pine. She does not look up.
- An interaction prompt appears: *"offer something."*
- **The apple in the snow is the test.** If the player offers the apple to Birdie, she pushes it back. Dialogue: *"not the apple. it has a worm."*
- If the player offers Pulseleaf or salt or water, she takes it without speaking and tucks it in her too-large coat.
- If the player offers Ember (now selectable from the pouch) — Birdie freezes for 800ms, looks up, and the apple disappears. The dialogue line: *"that's the wrong one."* Ember returns to pouch unspent.
- **No verb resolves into a stat.** No relationship score. The notebook records: *"Birdie. The apple had a worm."* (This is canonical regardless of what the player offered.)

#### Beat 3 — *The barricade* (held 6s + sound mark)
- At the crossroads, the sanctioned paint cans are visible but not interactable.
- The torn ribbon flutters once (3-frame, 240ms).
- **Sound mark:** a faint fluorescent hum, 1.5s, fades. No source on screen.
- Caveat label, low: *"don't go that way yet."*
- Player must take the north fork to continue. East fork shows a manuscript-rule barrier with the Cinzel label *"AHEAD — RECEIVING."*

### 6.3 Wittehaven contrast rules in this scene
- The paint cans are the first time the Wittehaven palette appears.
- They sit *alone* in the frame; no Wittehaven character, signage, or dialogue.
- The hum is the only audio cue; do not score it.
- After Kalev passes the crossroads, the cans never appear again until v0.9+.

### 6.4 Anti-drift rules
- Do not let the east fork open.
- Do not give Birdie a name yet — she is *Birdie* until Bethany.
- Do not let the player drop the cedar dog.
- Do not turn the apple into an item.

---

## 7. Scene 3 — Bethany Triage (Day 2)

**Emotional value:** the field. Three beds. The Ember tempts. The notebook records. *Sit · Write the name* is the practice that survives the day.

**Duration:** ~10–14 minutes across six beats.

**Vertical anchor:** the long table at the back wall (where Lena prepares).

**Eye-line:** changes per bed.

### 7.1 Layout

Bethany sickroom, 480×270 frame. Three beds in a row, candle between each. Door front-right. Window left (cold zone). Long prep table back wall.

```
   [window]                        [prep table — Lena here]
   [ Miriam ] [ Nora ] [ Dr. Amos Bell ]
       c        c         c
                           [door]
```

Lena stands at the prep table from beat 1. Birdie enters at beat 4 carrying water. A bell hangs by the door (rings when a new patient arrives — does not ring in this scene).

### 7.2 Patients (folk register)

| Bed | Name | Symptoms (folk) | Internal state | What the player can do |
|---|---|---|---|---|
| Left | **Miriam Toll** (elder; unavoidable death) | *thin · cold · quiet · fading* | terminal | warm; sit; *write the name* |
| Center | **Nora Finch** (recoverable) | *bitter cough · warm-then-cold · alert* | recoverable with **Pulseleaf Draught + Cedar-Wool Compress + warm + sit** | craft, administer, sit, write |
| Right | **Dr. Amos Bell** (elderly physician) | *fevered · murmuring · afraid* | recoverable with sit + warm + a long quiet; **vulnerable to Ember misuse — Ember will calm him but not heal him** | sit, warm, write, withhold-Ember |

### 7.3 Beats

#### Beat 1 — *The room* (held 4s + Lena greeting)
- Camera pans slowly left-to-right across the three beds (12px/sec). 4 seconds.
- Lena, at the prep table, says: *"three. start with the one who needs you. not the one who frightens you."*
- Patient panels do **not** open until the player walks to a bed.

#### Beat 2 — *Choosing* (player-driven)
- Player approaches a bed; patient panel opens. Other beds dim 12% and are interactable but visually deprioritized.
- The Ember is in the pouch and selectable.
- **Tincture Wheel is available** for crafts at the prep table. Lena helps if approached: she nudges proportions toward *sound*.

#### Beat 3 — *Care* (player-driven, branches)
- Player chooses interventions per bed. Three sub-outcomes per bed.

**Miriam (left).** Whatever the player does, Miriam dies. The Ember will *calm her face* but not save her — and if used here, the Tincture Wheel goes briefly hospital-language (§4.6 of `ui_regime_system_v0_8_1.md`).
- *Sit + Warm + Write* → Miriam dies; her hands warm before they cool. Folk-register summary.
- *Ember + Sit + Write* → Miriam dies; her face is still. Sanctioned-fragment summary. Notebook entry adds an underline: *"used Ember on the dying."*
- *No action* → Miriam dies; Lena writes the name. Notebook entry: *"Lena wrote her name."*

**Nora (center).** The Ember **will calm her cough but not cure it**, and will mask the fever spike that needs Pulseleaf. **Pulseleaf Draught + Cedar-Wool Compress + warm + sit = recovery.** *(v0.8.1: bitterleaf removed; recovery is now via locked craftables only.)*
- Correct sequencing → Nora recovers; symptom row simplifies to *"breathing."*
- Ember → Nora goes quiet, then worse by morning. Notebook records: *"Nora. quieter than was good."*

**Dr. Amos Bell (right).** The Ember will calm his murmuring but not his fear. Sit + warm + the long quiet (4s held) is the cure.
- Sit + Warm + 4s held + Write → Dr. Amos Bell recovers; he says: *"thank you, son."*
- Ember → Dr. Amos Bell sleeps; recovers physically. He does not say thank you. Notebook records: *"Dr. Amos Bell. quiet. did not look at me."*

#### Beat 4 — *Birdie enters* (mid-care, mark)
- Around the time the player has handled two beds, Birdie enters carrying water.
- She places a cup beside Dr. Amos Bell (always Dr. Amos Bell, regardless of player attention order).
- She does not speak. She leaves.
- **Notebook auto-records:** *"Birdie brought water. She knew which one needed it."*

#### Beat 5 — *Lena's hand* (mark + disclosure)
- After the third bed resolves, Lena walks to whichever bed Kalev is at.
- She places a hand on his shoulder. 1.6s held.
- Caveat dialogue: *"you sat with them. write their names."*
- Disclosure: 800ms of bed-layer only.

#### Beat 6 — *The notebook + manuscript intercut*
- Notebook opens, all three names are written by the player one-at-a-time.
- For each name, a graphite underrule appears faintly **only on Bethany names whose patient became still** (Miriam canonically; Dr. Amos Bell or Nora if Ember was misused). Page 77 line 7 remains reserved outside P0.
- **Manuscript intercut:** Bethany triage icon panel (see §11). Held 5s. Vellum-bone fade. Day 2 ends.

### 7.4 Anti-drift rules
- Do not show outcomes as success/fail.
- Do not gate Beat 6 by who survived.
- Do not let the player skip writing the names.
- Do not let Lena tell the player which bed to handle first; her line is fixed.
- Do not let Birdie speak in this scene.
- Do not show the Iron Ledger here — it does not exist yet in the world the player is in.
- Do not let *correct* and *incorrect* tinctures read as scoring. The notebook records what happened in plain language.

---

## 8. Beat-structure rules (every scene)

Across all three scenes:

1. **Every scene opens with a held frame ≥ 3 seconds.** The player learns the room before acting.
2. **Every scene closes with a manuscript intercut.** Held ≥ 4 seconds. Vellum fade.
3. **Every scene contains exactly one disclosure beat** — a held silence after a mark. ≥ 600ms.
4. **Every scene writes at least one name to the notebook.** The notebook is the record.
5. **Every scene contains at most one earned color mark** beyond the base palette (the apple, the ember vial, Miriam's blanket).
6. **No scene contains all three regimes' UI registers simultaneously** (the §4.6 fragment is a 1-second flicker, not a sustained mode).

---

## 9. Held-frame catalogue

A held frame is a composition the camera does not move within. These are the canonical held frames in the prototype slice. Length given in seconds.

| Scene | Held | Length | Composition |
|---|---|---|---|
| Cabin | Beat 1 — Arriving | 6s | Wide of room; Kalev at door; bed center. |
| Cabin | Beat 3 — Cease | 1.4s | Tight on Eli's hand on the blanket. |
| Cabin | Beat 4 — Notebook | 8s | Over-shoulder of Kalev writing. |
| Ironwood | Beat 2 — Apple | up to player | Mid-shot Birdie + tree + apple. |
| Ironwood | Beat 3 — Barricade | 6s | Mid-shot crossroads; Wittehaven cans visible at margin. |
| Bethany | Beat 1 — The room | 4s | Slow pan across three beds. |
| Bethany | Beat 5 — Lena's hand | 1.6s | Mid-shot Kalev shoulder; Lena's hand. |
| Bethany | Beat 6 — Notebook | up to player | Over-shoulder writing. |

---

## 10. Sound composition tables

### 10.1 Cabin

| Beat | Bed | Mark | Disclosure |
|---|---|---|---|
| 1 Arriving | hearth crackle | door close (240ms) | — |
| 2 Practice | hearth crackle | kettle whistle when sound-quality reached | — |
| 3 Cease | hearth (dimmer) | breath cease (240ms) | 1.4s hearth-only |
| 4 Notebook | hearth + pencil-on-page | — | 600ms after write |

### 10.2 Ironwood Road

| Beat | Bed | Mark | Disclosure |
|---|---|---|---|
| 1 Walking | wind in pines | crunch of step on snow | — |
| 2 Apple | wind | apple drop / cedar-dog click in pouch | 600ms after Birdie's line |
| 3 Barricade | wind | fluorescent hum (1.5s) | 1s wind-only after hum fades |

### 10.3 Bethany

| Beat | Bed | Mark | Disclosure |
|---|---|---|---|
| 1 The room | sickroom murmur + 3 candle flickers | Lena's line | 400ms |
| 2 Choosing | bed | footsteps on wood | — |
| 3 Care | bed | kettle whistle / vial uncork / breath change | per intervention |
| 4 Birdie | bed | door open + cup placed | 600ms after exit |
| 5 Lena | bed | Lena's line | 800ms |
| 6 Notebook | bed + pencil | — | 600ms after each name |

---

## 11. Manuscript intercut compositions

Three icon panels in the prototype slice. Composed once, rendered as still frames at 480×300 inside the manuscript double-frame.

### 11.1 Cabin death panel
- Sky band: vellum-bone with a single bare branch.
- World band: Eli on the bed; Kalev seated beside; hearth at margin; one `--ember-red` glint on the cooled vial on the table — **the only color** beyond ink and vellum.
- Underworld band: not present (this panel uses only sky + world).
- Marginalia: cedar twigs, one small dog motif at lower-left margin.

### 11.2 Birdie apple-refusal panel (mandatory)
- Sky: bare pine canopy.
- World: Birdie seated beneath the pine after refusing the apple; Kalev walking past at frame-right edge as she follows anyway.
- Underworld: snow with a single `--ember-red` apple half-buried.
- Marginalia: small worm motif at lower-right.

### 11.3 Bethany triage panel
- Sky: candlelight; faint window cross at left.
- World: three beds in a row; Kalev seated at the bed where the player ended; Lena's hand on his shoulder; Birdie at door-frame at right.
- Underworld: Bethany's manuscript water motif.
- Marginalia: three small motifs — a cup (Birdie), a leaf (Lena), an open notebook (Kalev). One per side margin.
- Earned colors: at most three small marks — Miriam's `--dragon-red` blanket if she died, Lena's `--pale-heal-deep` apron, the cedar-brown of the notebook.

---

## 12. Future scene reservations

Documented to lock visual language; **do not implement in P0.**

- **Mackinac crossing** — frozen lake; horizontal corridor; the lake-light flat; the bridge truss as occluder; one icon-panel beat at mid-crossing showing patterned water under the ice. No combat. No chase. Threshold beat only.
- **Wittehaven Block 0044** — sanctioned palette dominant; Iron Ledger introduced as separate panel; patient panels in case-language; the *one* fragment of folk language is a child's drawing taped to a window. Numbers visible. The seduction of legibility lands here for the first time.
- **Paradise narthex** — single scene; one beat; no verbs except *Sit · Write the name* on the cedar dog itself. IC XC NIKA plate appears only in this post-P0 Paradise reservation. The Ember is no longer in the pouch. The cedar dog has a halo. Held frame: 12s. No music. No dialogue from Kalev — only Lena, only one line.

These three reservations exist so future development cannot drift the world's visual contract without amending this document.

---

## 13. Composition acceptance gates (camera-level)

A scene cannot ship without all of the following passing:

1. **Vertical anchor present.** One identifiable line the eye returns to.
2. **Eye-line respected.** Camera does not cross Kalev's gaze during a beat.
3. **One disclosure beat.** Held silence + bed-only ≥ 600ms.
4. **At most one earned color mark beyond base palette per beat.**
5. **Manuscript intercut at scene close.** ≥ 4 seconds.
6. **Forbidden lighting absent.** No god-rays, bloom, lens flare, screen flash.
7. **Notebook records at least one name.**
8. **No scoring language anywhere on screen.**
9. **Cold breath visible on idle in cold scenes.**
10. **Captions on every gameplay-affecting audio mark.**

A scene that fails any of these is not ready. Fix the composition before fixing the code.
