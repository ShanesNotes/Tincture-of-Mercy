## VideoStreamPlayback <- Resource

This class is intended to be overridden by video decoder extensions with custom implementations of VideoStream.

**Methods:**
- GetChannels() -> int - Returns the number of audio channels.
- GetLength() -> float - Returns the video duration in seconds, if known, or 0 if unknown.
- GetMixRate() -> int - Returns the audio sample rate used for mixing.
- GetPlaybackPosition() -> float - Return the current playback timestamp. Called in response to the `VideoStreamPlayer.stream_position` getter.
- GetTexture() -> Texture2D - Allocates a Texture2D in which decoded video frames will be drawn.
- IsPaused() -> bool - Returns the paused status, as set by `_set_paused`.
- IsPlaying() -> bool - Returns the playback state, as determined by calls to `_play` and `_stop`.
- Play() - Called in response to `VideoStreamPlayer.autoplay` or `VideoStreamPlayer.play`. Note that manual playback may also invoke `_stop` multiple times before this method is called. `_is_playing` should return `true` once playing.
- Seek(float time) - Seeks to `time` seconds. Called in response to the `VideoStreamPlayer.stream_position` setter.
- SetAudioTrack(int idx) - Select the audio track `idx`. Called when playback starts, and in response to the `VideoStreamPlayer.audio_track` setter.
- SetPaused(bool paused) - Set the paused status of video playback. `_is_paused` must return `paused`. Called in response to the `VideoStreamPlayer.paused` setter.
- Stop() - Stops playback. May be called multiple times before `_play`, or in response to `VideoStreamPlayer.stop`. `_is_playing` should return `false` once stopped.
- Update(float delta) - Ticks video playback for `delta` seconds. Called every frame as long as both `_is_paused` and `_is_playing` return `true`.
- MixAudio(int numFrames, float[] buffer = PackedFloat32Array(), int offset = 0) -> int - Render `num_frames` audio frames (of `_get_channels` floats each) from `buffer`, starting from index `offset` in the array. Returns the number of audio frames rendered, or -1 on error.

