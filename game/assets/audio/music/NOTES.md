# Music notes (s29)

ElevenLabs `music_v2` composition plans → MP3 takes → conformed 44.1 kHz 16-bit mono PCM WAV.

**Register law:** ART_BIBLE restraint; znamenny / Valaam-adjacent modal austerity; tin, iron, breath. Never Hollywood-epic, never Elden-bombast. ENCOUNTERS: P1 sparse (space for telegraphs); ceremony holds its breath; P2 narrows like his speech. The road's default is silence.

**Mix law:** music sits under SFX. Peak-normalized below s26 impact beds (−1 dBFS) and at or under ambience beds (−8 dBFS). Bus `music` 0.20 is composed on top of `audio_params` master — impacts always read.

**Conform:** stereo MP3 → mono 44.1k; one-pole HPF (70–90 Hz) to strip sub rumble; equal-power loop crossfade on looping beds; peak cap as below. WebAudio `source.loop = true` uses these files as-is; loop points in `music_params.json` match whole-file duration.

`force_instrumental` is rejected by the API when a composition plan is supplied, so plans themselves carry `instrumental only` / `no vocals`.

## Loudness (shipped)

| track | peak | RMS | loop | wrap Δ | HPF |
|---|---:|---:|---|---:|---:|
| `hearth_theme` | −10.0 | −25.4 | 73.024 s | 0.00009 | 70 Hz |
| `warden_p1` | −12.0 | −25.5 | 70.524 s | 0.00034 | 80 Hz |
| `warden_ceremony` | −18.0 | −33.0 | 15.232 s | 0.00034 | 70 Hz |
| `warden_p2` | −12.0 | −27.2 | 62.532 s | 0.00037 | 80 Hz |
| `road_motif` | −12.0 | −22.5 | no (14.040 s) | n/a (ends at 0) | 90 Hz |

Wrap Δ is `|first − last|` of the shipped PCM. Join first-diff is at or below mid-file first-diff on every looping bed.

## Picks

### hearth_theme — t1
- **Plan:** three solo chunks, 25s each, 56 BPM. A gusli/kantele single-note Dorian line; B wooden flute, long pauses, no vibrato; C gusli return, two-note motif, notes decay fully. Negative: piano, guitar, orchestra, choir, pad, Celtic, New Age, swells.
- **Seed:** 2901. Duration 75.02s before loop crop.
- **Why:** spectrogram is three sparse solo blocks (pluck / breath-reed / pluck). Energy in 80–2000 Hz, zero sub-80, zero glitter above 2 kHz. The one licensed tenderness — small, not lush.
- **Rejected:** none. One take. Peak was −0.1 dBFS raw; pulled to −10.

### warden_p1 — t2 / 2
- **Plan t2:** four 18s chunks, 56 BPM. Ison drone pitched 110–160 Hz, tin/iron ostinato in the midrange, empty bars, loop-prep return. Negative: vocals, choir, brass, taiko, risers, sub rumble, braam, 808.
- **Seed:** 2912.
- **Why:** band energy 0% <80 Hz, 16% 80–180 (ison), 83% 180–400 (iron). Space is the point — a cold pulse, not a trailer bed.
- **Rejected t1 (seed 2902):** 97.6% of energy below 80 Hz. A sub drone. Procedure as rumble. Unusable under combat telegraphs.

### warden_ceremony — t2 / 2
- **Plan t2:** 16s near-silence. Held ~110 Hz ison as pressure; two or three pressed-tin tag chimes far apart; breath; no pulse, no melody.
- **Seed:** 2913. 90t = 1.5s; the 15.2s loop is a bed the 90-tick vigil can sit on without a phrase change.
- **Why:** after 70 Hz HPF the file is a felt drone plus sparse tin. Peak −18 / RMS −33 — heard only because everything else has left.
- **Rejected t1 (seed 2903):** 96% of energy in 400–2000 Hz, almost no ison. Tags without the held breath.

### warden_p2 — t1
- **Plan:** same modal material as P1, hollowed. Three chunks, 56 BPM. Single iron drone; ostinato reduced to two notes, then one, then gone. More metal, not more loud.
- **Seed:** 2904. Duration 64.03s → 62.532s looped.
- **Why:** 80% mid, 19% low-mid, almost no presence. Narrower than P1 t2, quieter RMS (−27 vs −25). The theme reduced, not a new anthem.
- **Rejected:** none. One take.

### road_motif — t1
- **Plan:** 14s unaccompanied monophonic incipit. Wooden flute or reed, znamenny-adjacent, free rhythm, no drone, no accompaniment, not a loop.
- **Seed:** 2905.
- **Why:** spectrogram is one harmonic stack in two phrases, then decay to digital silence. Presence-band only. The road stays silent unless `zone === "threshold"`, and even then the motif fires once per entry.

## State mapping (see `music_params.json` rules)

First match wins: ceremony → hearth rest → arena P2 → arena P1 (phase or combat) → threshold motif → **silence**.

Wolf combat on the road does not earn a theme. Death sting ducks music by 0.05 (same number as ambience under sting) via `setDeathSting` — s18 binds.

## Playback

`game/src/app/audio/music.ts` is a new file. It does not edit buses, clock, runtime, or `audio_params.json`. Music gain is `master × buses.music × track.gain × fade × duck`. Fades are tick-linear and deterministic given a state timeline. Loop periods are `round((loopEnd − loopStart) × 60)` on the existing tick clock.
