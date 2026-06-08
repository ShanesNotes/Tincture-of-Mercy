## AudioStreamPlaybackPolyphonic <- AudioStreamPlayback

Playback instance for AudioStreamPolyphonic. After setting the `stream` property of AudioStreamPlayer, AudioStreamPlayer2D, or AudioStreamPlayer3D, the playback instance can be obtained by calling `AudioStreamPlayer.get_stream_playback`, `AudioStreamPlayer2D.get_stream_playback` or `AudioStreamPlayer3D.get_stream_playback` methods.

**Methods:**
- IsStreamPlaying(int stream) -> bool - Returns `true` if the stream associated with the given integer ID is still playing. Check `play_stream` for information on when this ID becomes invalid.
- PlayStream(AudioStream stream, float fromOffset = 0, float volumeDb = 0, float pitchScale = 1.0, int playbackType = 0, StringName bus = &"Master") -> int - Play an AudioStream at a given offset, volume, pitch scale, playback type, and bus. Playback starts immediately. The return value is a unique integer ID that is associated to this playback stream and which can be used to control it. This ID becomes invalid when the stream ends (if it does not loop), when the AudioStreamPlaybackPolyphonic is stopped, or when `stop_stream` is called. This function returns `INVALID_ID` if the amount of streams currently playing equals `AudioStreamPolyphonic.polyphony`. If you need a higher amount of maximum polyphony, raise this value.
- SetStreamPitchScale(int stream, float pitchScale) - Change the stream pitch scale. The `stream` argument is an integer ID returned by `play_stream`.
- SetStreamVolume(int stream, float volumeDb) - Change the stream volume (in db). The `stream` argument is an integer ID returned by `play_stream`.
- StopStream(int stream) - Stop a stream. The `stream` argument is an integer ID returned by `play_stream`, which becomes invalid after calling this function.

**Enums:**
**Constants:** INVALID_ID=-1
  - INVALID_ID: Returned by `play_stream` in case it could not allocate a stream for playback.

