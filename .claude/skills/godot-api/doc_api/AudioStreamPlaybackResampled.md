## AudioStreamPlaybackResampled <- AudioStreamPlayback

Playback class used to mix an AudioStream's audio samples to `AudioServer.get_mix_rate` using cubic interpolation.

**Methods:**
- GetStreamSamplingRate() -> float - Returns an AudioStream's sample rate, in Hz. Used to perform resampling.
- MixResampled(AudioFrame* dstBuffer, int frameCount) -> int - Called by `begin_resample` to mix an AudioStream to `AudioServer.get_mix_rate`. Uses `_get_stream_sampling_rate` as the source sample rate. Returns the number of mixed frames.
- BeginResample() - Called when an AudioStream is played. Clears the cubic interpolation history and starts mixing by calling `_mix_resampled`.

