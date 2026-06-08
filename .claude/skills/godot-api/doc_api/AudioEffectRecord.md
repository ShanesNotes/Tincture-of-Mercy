## AudioEffectRecord <- AudioEffect

Allows the user to record the sound from an audio bus into an AudioStreamWAV. When used on the Master audio bus, this includes all audio output by Godot. Unlike AudioEffectCapture, this effect encodes the recording with the given format (8-bit, 16-bit, or compressed) instead of giving access to the raw audio samples. Can be used (with an AudioStreamMicrophone) to record from a microphone. **Note:** `ProjectSettings.audio/driver/enable_input` must be `true` for audio input to work. See also that setting's description for caveats related to permissions and operating system privacy settings.

**Props:**
- Format: int (AudioStreamWAV.Format) = 1

- **format**: Specifies the format in which the sample will be recorded.

**Methods:**
- GetRecording() -> AudioStreamWAV - Returns the recorded sample.
- IsRecordingActive() -> bool - Returns whether the recording is active or not.
- SetRecordingActive(bool record) - If `true`, the sound will be recorded. Note that restarting the recording will remove the previously recorded sample.

