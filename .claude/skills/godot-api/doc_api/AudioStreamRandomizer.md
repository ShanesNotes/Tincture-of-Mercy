## AudioStreamRandomizer <- AudioStream

Picks a random AudioStream from the pool, depending on the playback mode, and applies random pitch shifting and volume shifting during playback.

**Props:**
- PlaybackMode: int (AudioStreamRandomizer.PlaybackMode) = 0
- RandomPitch: float = 1.0
- RandomPitchSemitones: float = 0.0
- RandomVolumeOffsetDb: float = 0.0
- Stream{index}/stream: AudioStream
- Stream{index}/weight: float = 1.0
- StreamsCount: int = 0

- **playback_mode**: Controls how this AudioStreamRandomizer picks which AudioStream to play next.
- **random_pitch**: The largest possible frequency multiplier of the random pitch variation. Pitch will be randomly chosen within a range of [code skip-lint]1.0 / random_pitch[/code] and [code skip-lint]random_pitch[/code]. A value of `1.0` means no variation. A value of `2.0` means pitch will be randomized between double and half. **Note:** Setting this property also sets `random_pitch_semitones`.
- **random_pitch_semitones**: The largest possible distance, in semitones, of the random pitch variation. A value of `0.0` means no variation. **Note:** Setting this property also sets `random_pitch`.
- **random_volume_offset_db**: The intensity of random volume variation. Volume will be increased or decreased by a random value up to [code skip-lint]random_volume_offset_db[/code]. A value of `0.0` means no variation. A value of `3.0` means volume will be randomized between `-3.0 dB` and `+3.0 dB`.
- **stream_{index}/stream**: The AudioStream at `index`. **Note:** `index` is a value in the `0 .. streams_count - 1` range.
- **stream_{index}/weight**: The probability weight of the AudioStream at `index`. **Note:** `index` is a value in the `0 .. streams_count - 1` range.
- **streams_count**: The number of streams in the stream pool.

**Methods:**
- AddStream(int index, AudioStream stream, float weight = 1.0) - Insert a stream at the specified index. If the index is less than zero, the insertion occurs at the end of the underlying pool.
- GetStream(int index) -> AudioStream - Returns the stream at the specified index.
- GetStreamProbabilityWeight(int index) -> float - Returns the probability weight associated with the stream at the given index.
- MoveStream(int indexFrom, int indexTo) - Move a stream from one index to another.
- RemoveStream(int index) - Remove the stream at the specified index.
- SetStream(int index, AudioStream stream) - Set the AudioStream at the specified index.
- SetStreamProbabilityWeight(int index, float weight) - Set the probability weight of the stream at the specified index. The higher this value, the more likely that the randomizer will choose this stream during random playback modes.

**Enums:**
**PlaybackMode:** PLAYBACK_RANDOM_NO_REPEATS=0, PLAYBACK_RANDOM=1, PLAYBACK_SEQUENTIAL=2
  - PLAYBACK_RANDOM_NO_REPEATS: Pick a stream at random according to the probability weights chosen for each stream, but avoid playing the same stream twice in a row whenever possible. If only 1 sound is present in the pool, the same sound will always play, effectively allowing repeats to occur.
  - PLAYBACK_RANDOM: Pick a stream at random according to the probability weights chosen for each stream. If only 1 sound is present in the pool, the same sound will always play.
  - PLAYBACK_SEQUENTIAL: Play streams in the order they appear in the stream pool. If only 1 sound is present in the pool, the same sound will always play.

