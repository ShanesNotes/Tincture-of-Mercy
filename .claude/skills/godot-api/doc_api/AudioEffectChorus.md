## AudioEffectChorus <- AudioEffect

A "chorus" effect creates multiple copies of the original audio (called "voices") with variations in pitch, and layers on top of the original, giving the impression that the sound comes from multiple sources. This creates spectral and spatial movement. Each voice is played a short period of time after the original audio, controlled by `delay`. An internal low-frequency oscillator (LFO) controls their pitch, and `depth` controls the LFO's maximum amount. In the real world, this kind of effect is found in pianos, choirs, and instrument ensembles. This effect can also be used to widen mono audio and make digital sounds have a more natural or analog quality.

**Props:**
- Dry: float = 1.0
- Voice/1/cutoffHz: float = 8000.0
- Voice/1/delayMs: float = 15.0
- Voice/1/depthMs: float = 2.0
- Voice/1/levelDb: float = 0.0
- Voice/1/pan: float = -0.5
- Voice/1/rateHz: float = 0.8
- Voice/2/cutoffHz: float = 8000.0
- Voice/2/delayMs: float = 20.0
- Voice/2/depthMs: float = 3.0
- Voice/2/levelDb: float = 0.0
- Voice/2/pan: float = 0.5
- Voice/2/rateHz: float = 1.2
- Voice/3/cutoffHz: float
- Voice/3/delayMs: float
- Voice/3/depthMs: float
- Voice/3/levelDb: float
- Voice/3/pan: float
- Voice/3/rateHz: float
- Voice/4/cutoffHz: float
- Voice/4/delayMs: float
- Voice/4/depthMs: float
- Voice/4/levelDb: float
- Voice/4/pan: float
- Voice/4/rateHz: float
- VoiceCount: int = 2
- Wet: float = 0.5

- **dry**: The volume ratio of the original audio. Value can range from 0 to 1.
- **voice/1/cutoff_hz**: The frequency threshold of the voice's low-pass filter in Hz.
- **voice/1/delay_ms**: The delay of the voice in milliseconds, compared to the original audio.
- **voice/1/depth_ms**: The depth of the voice's low-frequency oscillator in milliseconds.
- **voice/1/level_db**: The gain of the voice in dB.
- **voice/1/pan**: The pan position of the voice.
- **voice/1/rate_hz**: The rate of the voice's low-frequency oscillator in Hz.
- **voice/2/cutoff_hz**: The frequency threshold of the voice's low-pass filter in Hz.
- **voice/2/delay_ms**: The delay of the voice in milliseconds, compared to the original audio.
- **voice/2/depth_ms**: The depth of the voice's low-frequency oscillator in milliseconds.
- **voice/2/level_db**: The gain of the voice in dB.
- **voice/2/pan**: The pan position of the voice.
- **voice/2/rate_hz**: The rate of the voice's low-frequency oscillator in Hz.
- **voice/3/cutoff_hz**: The frequency threshold of the voice's low-pass filter in Hz.
- **voice/3/delay_ms**: The delay of the voice in milliseconds, compared to the original audio.
- **voice/3/depth_ms**: The depth of the voice's low-frequency oscillator in milliseconds.
- **voice/3/level_db**: The gain of the voice in dB.
- **voice/3/pan**: The pan position of the voice.
- **voice/3/rate_hz**: The rate of the voice's low-frequency oscillator in Hz.
- **voice/4/cutoff_hz**: The frequency threshold of the voice's low-pass filter in Hz.
- **voice/4/delay_ms**: The delay of the voice in milliseconds, compared to the original audio.
- **voice/4/depth_ms**: The depth of the voice's low-frequency oscillator in milliseconds.
- **voice/4/level_db**: The gain of the voice in dB.
- **voice/4/pan**: The pan position of the voice.
- **voice/4/rate_hz**: The rate of the voice's low-frequency oscillator in Hz.
- **voice_count**: The number of voices in the effect. Value can range from 1 to 4.
- **wet**: The volume ratio of all voices. Value can range from 0 to 1.

**Methods:**
- GetVoiceCutoffHz(int voiceIdx) -> float - Returns the frequency threshold of a given `voice_idx`'s low-pass filter in Hz. Frequencies above this value are removed from the voice.
- GetVoiceDelayMs(int voiceIdx) -> float - Returns the delay of a given `voice_idx` in milliseconds, compared to the original audio.
- GetVoiceDepthMs(int voiceIdx) -> float - Returns the depth of a given `voice_idx`'s low-frequency oscillator in milliseconds.
- GetVoiceLevelDb(int voiceIdx) -> float - Returns the gain of a given `voice_idx` in dB.
- GetVoicePan(int voiceIdx) -> float - Returns the pan position of a given `voice_idx`. Negative values mean the left channel, positive mean the right.
- GetVoiceRateHz(int voiceIdx) -> float - Returns the rate of a given `voice_idx`'s low-frequency oscillator in Hz.
- SetVoiceCutoffHz(int voiceIdx, float cutoffHz) - Sets the frequency threshold of a given `voice_idx`'s low-pass filter in Hz. Frequencies above `cutoff_hz` are removed from `voice_idx`. Value can range from 1 to 20500.
- SetVoiceDelayMs(int voiceIdx, float delayMs) - Sets the delay of a given `voice_idx` in milliseconds, compared to the original audio. Value can range from 0 to 50.
- SetVoiceDepthMs(int voiceIdx, float depthMs) - Sets the depth of a given `voice_idx`'s low-frequency oscillator in milliseconds. Value can range from 0 to 20.
- SetVoiceLevelDb(int voiceIdx, float levelDb) - Sets the gain of a given `voice_idx` in dB. Value can range from -60 to 24.
- SetVoicePan(int voiceIdx, float pan) - Sets the pan position of a given `voice_idx`. Negative values pan the sound to the left, positive pan to the right. Value can range from -1 to 1.
- SetVoiceRateHz(int voiceIdx, float rateHz) - Sets the rate of a given `voice_idx`'s low-frequency oscillator in Hz. Value can range from 0.1 to 20.

