# Tincture of Mercy — Ambient & Foley Generation Workflow

This pack turns the sound design brief into a practical production pass for the opening slice:
Water → Bread → Tincture → Mother death / Witness → Wolves / boy flight / combat.

## 1. Production order

### Batch 1 — Ambient foundations
Create these first, because every foreground sound will be judged against them.

1. `AMB_INT_DAY_LOOP` — Cabin Interior Day, 3:00 seamless.
2. `AMB_INT_DUSK_LOOP` — Cabin Interior Dusk, 3:00 seamless.
3. `AMB_EXT_YARD_DAY_LOOP` — Cabin Yard Day, 2:30 seamless.
4. `AMB_EXT_YARD_DUSK_LOOP` — Cabin Yard Dusk, 2:30 seamless.
5. `AMB_FOREST_EDGE_LOOP` — Forest Edge Foraging, 2:30 seamless.

Acceptance check:
- no music, no instruments, no human voices;
- no dramatic stings;
- no obvious loop seam;
- hearth, clock, wind, and cold-air thinness read at low volume;
- animal calls do not steal attention from scripted wolf howls.

Recommended render strategy:
- generate 3–5 candidates per loop;
- keep the best full-bed render;
- where possible, also render/record stems for hearth, clock, wind, wood creaks, birds, and well-pump creak;
- in Reaper/Audition, assemble final loops from stems so scripted moments can mute or preserve individual elements.

### Batch 2 — Load-bearing real foley
Record these before generating optional one-offs.

- Kalev footsteps: wood, dirt, forest; walk and run.
- Kalev cloth: wool, linen, scarf/collar, gloves.
- Kalev breath: calm, working, combat.
- Notebook: open, close, page turns, graphite writing strokes.
- Patient care: tin cup, water, swallow, blanket, fever touch.
- Bread: break, offer, moisten.
- Pouch: open, close, item in/out.

Acceptance check:
- randomized playback for five minutes does not become repetitive;
- close-mic texture feels intimate but not ASMR;
- performance is restrained;
- every material is identifiable at low volume.

### Batch 3 — Crafting and diegetic UI
Build the Act 3 tactile/UI palette from real materials.

Core palette:
- ceramic mortar and pestle;
- dried leaf vs dried root grind;
- glass flask setdown;
- cork/stopper;
- small water pour;
- flint-and-steel;
- candle ignition;
- tincture wheel select/confirm/commit.

Acceptance check:
- select = glass;
- confirm = wood;
- commit = Kalev breath + flint/candle;
- failed craft = glass crack/liquid spill only where the forced-Miss outcome is authored.

### Batch 4 — Act 4 gravity encounter
Author this as a mix scene, not as a dramatic sound cue.

Key rule:
The mother’s breath stops. The hearth, clock, and cabin continue.

Required cues:
- normal administration using existing care assets;
- 15-second breath transition: labored → brief rally → ragged → final exhale;
- breath layer stop;
- notebook writes the name with Kalev’s held-breath choke.

Acceptance check:
- no sting;
- no chord;
- no cinematic swell;
- the absence of breath is noticeable after a few seconds.

### Batch 5 — Wolves and combat
Use real wolf libraries where licensing allows. AI wolves often read as dogs.

Required cues:
- far first howl;
- closer response howl;
- claw scrape at door;
- growl through wood;
- wet sniff at door crack;
- pacing claws outside;
- lunge snarls;
- jaw snaps;
- yelp on hit;
- death cry;
- combat pant/chuff loop;
- cudgel swing and impacts;
- bash taunt signature;
- boy running/door/branches/distant cry;
- retreat pant/footsteps/final howl.

Acceptance check:
- combat is real and dangerous, but not bombastic;
- the boy’s route cues are readable;
- bash has a distinct threat-pull signature;
- encounter resolution sounds like danger receding, not victory fanfare.

### Batch 6 — Body-state automation
Implement these as bus/filter changes.

Burden:
- heavier footstep/breath variants after threshold;
- no obvious UI tone.

Pressure:
- 800–1200 Hz thin stress ring;
- bass drops out of ambient for 2–3 seconds;
- one sharp Kalev inhale.

Numbness:
- ambient duck around -6 dB;
- mild low-pass;
- body sounds dampened;
- faint pink-noise wash.

Acceptance check:
- the player feels the state change before naming it.

---

## 2. File naming convention

Use this shape:

`tom_<domain>_<category>_<cue>_<variant>.wav`

Examples:

- `tom_amb_cabin_day_loop_v01.wav`
- `tom_body_kalev_wood_walk_v03.wav`
- `tom_ui_notebook_page_turn_v02.wav`
- `tom_creature_wolf_first_howl_v01.wav`
- `tom_special_anna_breath_transition_v01.wav`

Suggested folder structure:

```text
audio/
  amb/
    cabin/
    yard/
    forest/
  body/
    kalev/
      footsteps/
      breath/
      cloth/
  foley/
    care/
    craft/
    doors/
    hearth/
    bread/
    pouch/
  ui_diegetic/
    notebook/
    tincture_wheel/
  creature/
    wolf/
    deer/
  combat/
    cudgel/
    thrown_object/
  special/
    act4_death/
    state_fx/
```

---

## 3. Export targets

Recommended raw export:
- WAV;
- 48 kHz;
- 24-bit for source/editing;
- mono for close foley unless stereo image is meaningful;
- stereo for ambient beds.

Recommended Godot import:
- Ambient loops: Ogg Vorbis or WAV depending memory budget; loop enabled; no click at loop boundary.
- Short foley/SFX: WAV for snappy transient playback.
- Long loops: ensure import loop points and crossfades are tested in engine.

Normalization guidance:
- Do not normalize every clip to peak 0 dB.
- Keep natural dynamics.
- Create category loudness references instead:
  - ambient beds quiet;
  - body foley quiet/readable;
  - interaction foley foreground but never huge;
  - SpecialEvents highest priority only briefly.

---

## 4. Godot routing plan

Recommended buses:

```text
Master
  Score
  AMB_Interior
  AMB_Exterior
  SFX_Body
  SFX_Foley
  UI_Diegetic
  Creature
  Combat
  SpecialEvents
  StateFX
```

Implementation principles:
- Audio cues follow game events, not scene-local truth.
- Combat audio should be selected from resolver outcomes.
- The mother’s breath cessation is an event-driven mute/fade of a breath layer.
- Numbness/Pressure/Burden are bus automation, not one-shot fanfare.

Minimal cue definition shape:

```csharp
public sealed record AudioCueDef(
    string CueId,
    string Bus,
    string[] Variants,
    bool Loop,
    float BaseGainDb,
    float PitchJitterCents,
    float VolumeJitterDb,
    string[] Tags
);
```

Minimal event binding shape:

```csharp
public sealed record AudioEventBinding(
    string SimEventVerb,
    string CueId,
    string? RequiredTag = null,
    string? StateGate = null,
    float DelaySeconds = 0f
);
```

Examples:

```text
care.bread.break                 -> BREAD_BREAK
craft.tincture.prepare           -> CRAFT_MORTAR_DRY_LEAF / CRAFT_MORTAR_ROOT
ui.tincture_wheel.commit         -> WHEEL_COMMIT_CRAFT
death.mother.breath_transition   -> ANNA_BREATH_RALLY_STOP
death.mother                     -> stop ANNA_BREATH_LAYER
encounter.wolves.first_howl      -> WOLF_FIRST_DISTANT_HOWL
ability.bash.taunt               -> BASH_TAUNT_SIGNATURE
route.boy.advance                -> IIRO_RUN_DIRT_LEAVES
encounter.wolves.resolved        -> WOLF_RETREAT_PANT + ambient return
```

---

## 5. Loop QA checklist

For each loop:

1. Listen to the loop boundary three times on headphones.
2. Listen with the game’s expected ambient volume, not soloed loud.
3. Check for accidental melody, musical pulse, or repeated “signature” sound.
4. Check whether a rare event repeats too obviously.
5. Test a 10-minute playback with random overlay foley.
6. Confirm that the loop still works under Numbness low-pass and Pressure ducking.
7. Confirm that scripted SpecialEvents can duck or preserve the correct stems.

---

## 6. Emotional restraint rules

Use these as the final pass:

- If a sound says “important moment” too clearly, lower it or remove it.
- If a generated sound sounds like a trailer, reject it.
- If a wolf sounds like a pet dog, reject it.
- If a breath sounds acted, reject it.
- If the notebook sounds like a UI click, replace it with real graphite/paper.
- If Act 4 feels scored by SFX, strip it back to breath, hearth, clock, and pencil.
- If combat sounds heroic, make it smaller, closer, colder, and more desperate.
