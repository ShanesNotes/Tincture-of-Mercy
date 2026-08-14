# Content audio notes (s26)

ElevenLabs `eleven_text_to_sound_v2` → 44.1 kHz 16-bit mono PCM WAV in `content/`.
`placeholder/` is untouched (fallback). Mapping swap is the `file` field only.

**Register law:** ART_BIBLE damp November / liturgical restraint; GATES F4 (no shake — weight is sample + hitstop); wolves are real animals; tag-chime is tin, small, cold; flask is Anna's medicine; sting is a held breath + low iron tone, not an orchestra.

**Conform:** stereo MP3 downmix → mono; silence trim; short fades; peak ≤ −1 dBFS (beds −8 dBFS); impact layer high-passed at 140 Hz (anti-braam); hit/sting at 90 Hz. Beds equal-power crossfaded and wrap-forced.

**Takes:** 2–3 first-pass per cue (93), plus regen on cues the first pass turned into sub rumble. Picks below are against spectrograms + energy (low80 / mid / high), not Hollywood loudness.

**Gain trims** (only these moved; mix still lives in params):

| cue | was | now | why |
|---|---:|---:|---|
| `impact.light` | 0.34 | 0.30 | t5 is a bright iron tick |
| `impact.charged` | 0.44 | 0.40 | long iron ring |
| `impact.critical` | 0.46 | 0.42 | kitchen-thud already has body |
| `wolf.howl` | 0.32 | 0.28 | source was hot |
| `ambience.wither_drone` | 0.18 | 0.14 | RMS ~18 dB hotter than forest |
| `sting.death` | 0.40 | 0.34 | restraint |

No new cues. No music / Warden theme (later composition slice).

## Beds (loop)

| cue | take | duration | seam |
|---|---|---|---|
| `ambience.hearth` | t1 | 4.910 s | 40 ms MAE 0.016; ember ticks at ~0.4 / 1.3 / 2.8 s, low fire bed. Cabin, not a hymn. |
| `ambience.forest_damp` | t1 | 4.910 s | MAE 0.024; wet-pine broadband + drip transients. No birdsong chorus. |
| `ambience.wither_drone` | t1 | 4.780 s | 220 ms equal-power crossfade + wrap force. Residual phase tick at the loop (~4.78 s) is a thin vertical on a 2× spectrogram — under bus 0.14 it is a pressure, not a click. Liturgical fifth, no riser. |

WebAudio `source.loop = true` uses these files as-is.

## Per cue

### impact.light — t5 / 6
- **Prompt (t5):** Single dry metal-on-wood tick. Kitchen poker on timber. Bright short click, no low end, no trailer boom.
- **Rejected:** t1–t3 almost pure sub; t4 four-click rattle; t6 clipped hiss.
- **Why:** spectrogram is one 2–18 kHz tick at ~32 ms. Dry iron, not a boom.

### impact.heavy — t1 / 5
- **Prompt (t1):** Heavier dry iron fire-poker striking wood and wool cloth. Weight and body, not Hollywood explosion.
- **Rejected:** t3 sine-drone; t4–t5 sub rumble. Auto-trim ate t1's tail (44 ms) — **manual 220 ms window** kept.
- **Why:** midrange thud 0–3 kHz with decay. Distinct from light.

### impact.charged — t2 / 3
- **Prompt:** A held fire-iron driven home. Dry parchment-and-iron, short metallic ring that dies.
- **Rejected:** t1 100% sub; t3 clipped + harsh highs.
- **Why:** iron harmonic stack with a decaying ring. Weight without a braam.

### impact.blocked — t2 / 3
- **Prompt:** Dry blocked-weapon clash, iron on iron, muted by damp air.
- **Rejected:** t1 more sub; t3 clickier.
- **Why:** short iron-on-iron, cold, no cathedral clang.

### impact.guard_break — t5 / 5
- **Prompt:** Iron slips past iron, a dry crack and cloth. Midrange only, no bass drop.
- **Rejected:** t1–t2 clipped glass; t3–t4 almost all air/hiss.
- **Why:** scrape then mid-high break at 140–260 ms.

### impact.critical — t8 / 8
- **Prompt:** Chopping block: a dull iron bar hits a side of beef wrapped in cloth. Kitchen Foley, midrange thud. No cinematic boom.
- **Rejected:** t1–t6 Hollywood sub / braam (low80 0.47–1.00). Kitchen metaphor was the first take that stayed midrange (low80 0.02).
- **Why:** attack + decaying harmonics. Weight from the body, not the boom.

### hit.light — t1 / 2 · hit.heavy — t1 / 2 · hit.charged — t2 / 2
Body layer (wool/cloth). Midrange thuds, no metal. Charged t2 has more lung-emptying body than t1.

### hit.blocked — t1 / 2 · hit.guard_break — t1 / 2
Guarded cloth/bone. Metal lives on the impact layer.

### whiff.hearth_iron.light — t2 / 2 · heavy — t2 / 2 · charged — t1 / 2
Air + wool + thin iron. No sword ring.

### whiff.wolf — t1 / 2
Fur/body miss, no vocal (vocals are their own cues).

### whiff.warden_axe — t1 / 2
Woodsman's axe air cut, oilcloth. Not a greatsword trailer whoosh.

### footstep.needle — t1 / 2 · wood — t1 / 2 · damp_snow — t1 / 2 · stone — t1 / 2
Single steps, damp November. Snow is slush, not powder. Stone has no hall.

### foley.roll — t1 / 2
Wool coat on wet ground, 678 ms. Physical, not a cartoon tumble.

### flask.startup — t3 / 3
- **Prompt:** Tiny cork easing from a small glass bottle. Soft, careful, no pop flourish.
- **Rejected:** t1–t2 over-quiet / sub, silence-trim murdered them.

### flask.drink — t1 / 3
Soft liquid then swallow pulses 300–600 ms. Medicine, not a potion sparkle.

### flask.recovery — t3 / 3
Cork seat, 156 ms. Short is correct.

### wolf.stalk_growl — t1 / 3
Chest rumble 0–2 kHz. Living animal, low commitment (Baiter).

### wolf.lunge_snarl — t2 / 3
Harmonic canine stack, wet breath. Not a werewolf.

### wolf.flinch — t1 / 3
Short yelp, dog-family, no human scream.

### wolf.death — t1 / 3
Last exhale + broken whimper. No gore, no death-howl.

### wolf.howl — t2 / 3
One animal, falling harmonic howl ~3.2 s. Pack call, candle-raised, not a horror choir.

### world.tag_chime — t1 / 4
- **Prompt:** A single small pressed tin tag chiming against another tin tag on a wire. Small, cold, thin metal. Not a bell, not a church, not pretty wind chimes.
- **Rejected:** t2 clipped sparkle; t3 late; t4 (MCP regen) inverted into sub.
- **Why:** decaying tin partials 5–13 kHz. Small enough to menace by repetition (ENCOUNTERS / ART_BIBLE PR5).

### sting.death — t3 / 3
- **Prompt:** A breath held and released into one low iron tone. Quiet death sting. No orchestra.
- **Rejected:** t2 clipped boom; t1 too much sub.
- **Why:** one held low tone, 1.12 s. Candle pinched.

### meta.page_drop — t2 / 2 · meta.page_recover — t1 / 2
Vellum on needles / gathered back. No book slam.

### meta.names_bank_scritch — t1 / 2
Graphite on damp vellum. Close, intimate, no chalk.

## Missing cues

None. All 37 `audio_params.json` cues have a `content/` wav.

## Verify note

s17's params test asserted `file.startsWith("placeholder/")`. This slice's contract is the path swap, so that one assertion now checks `content/` and existence. No scheduler/runtime changes.
