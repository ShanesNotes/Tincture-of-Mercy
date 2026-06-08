## AudioServer <- Object

AudioServer is a low-level server interface for audio access. It is in charge of creating sample data (playable audio) as well as its playback via a voice interface.

**Props:**
- BusCount: int = 1
- InputDevice: string = "Default"
- OutputDevice: string = "Default"
- PlaybackSpeedScale: float = 1.0

- **bus_count**: Number of available audio buses.
- **input_device**: Name of the current device for audio input (see `get_input_device_list`). On systems with multiple audio inputs (such as analog, USB and HDMI audio), this can be used to select the audio input device. The value `"Default"` will record audio on the system-wide default audio input. If an invalid device name is set, the value will be reverted back to `"Default"`. **Note:** `ProjectSettings.audio/driver/enable_input` must be `true` for audio input to work. See also that setting's description for caveats related to permissions and operating system privacy settings.
- **output_device**: Name of the current device for audio output (see `get_output_device_list`). On systems with multiple audio outputs (such as analog, USB and HDMI audio), this can be used to select the audio output device. The value `"Default"` will play audio on the system-wide default audio output. If an invalid device name is set, the value will be reverted back to `"Default"`.
- **playback_speed_scale**: Scales the rate at which audio is played (i.e. setting it to `0.5` will make the audio be played at half its speed). See also `Engine.time_scale` to affect the general simulation speed, which is independent from `AudioServer.playback_speed_scale`.

**Methods:**
- AddBus(int atPosition = -1) - Adds a bus at `at_position`.
- AddBusEffect(int busIdx, AudioEffect effect, int atPosition = -1) - Adds an AudioEffect effect to the bus `bus_idx` at `at_position`.
- GenerateBusLayout() -> AudioBusLayout - Generates an AudioBusLayout using the available buses and effects.
- GetBusChannels(int busIdx) -> int - Returns the number of channels of the bus at index `bus_idx`.
- GetBusEffect(int busIdx, int effectIdx) -> AudioEffect - Returns the AudioEffect at position `effect_idx` in bus `bus_idx`.
- GetBusEffectCount(int busIdx) -> int - Returns the number of effects on the bus at `bus_idx`.
- GetBusEffectInstance(int busIdx, int effectIdx, int channel = 0) -> AudioEffectInstance - Returns the AudioEffectInstance assigned to the given bus and effect indices (and optionally channel).
- GetBusIndex(StringName busName) -> int - Returns the index of the bus with the name `bus_name`. Returns `-1` if no bus with the specified name exist.
- GetBusName(int busIdx) -> string - Returns the name of the bus with the index `bus_idx`.
- GetBusPeakVolumeLeftDb(int busIdx, int channel) -> float - Returns the peak volume of the left speaker at bus index `bus_idx` and channel index `channel`.
- GetBusPeakVolumeRightDb(int busIdx, int channel) -> float - Returns the peak volume of the right speaker at bus index `bus_idx` and channel index `channel`.
- GetBusSend(int busIdx) -> StringName - Returns the name of the bus that the bus at index `bus_idx` sends to.
- GetBusVolumeDb(int busIdx) -> float - Returns the volume of the bus at index `bus_idx` in dB.
- GetBusVolumeLinear(int busIdx) -> float - Returns the volume of the bus at index `bus_idx` as a linear value. **Note:** The returned value is equivalent to the result of `@GlobalScope.db_to_linear` on the result of `get_bus_volume_db`.
- GetDriverName() -> string - Returns the name of the current audio driver. The default usually depends on the operating system, but may be overridden via the `--audio-driver` . `--headless` also automatically sets the audio driver to `Dummy`. See also `ProjectSettings.audio/driver/driver`.
- GetInputBufferLengthFrames() -> int - Returns the absolute size of the microphone input buffer. This is set to a multiple of the audio latency and can be used to estimate the minimum rate at which the frames need to be fetched.
- GetInputDeviceList() -> string[] - Returns the names of all audio input devices detected on the system. **Note:** `ProjectSettings.audio/driver/enable_input` must be `true` for audio input to work. See also that setting's description for caveats related to permissions and operating system privacy settings.
- GetInputFrames(int frames) -> Vector2[] - Returns a PackedVector2Array containing exactly `frames` audio samples from the internal microphone buffer if available, otherwise returns an empty PackedVector2Array. The buffer is filled at the rate of `get_input_mix_rate` frames per second when `set_input_device_active` has successfully been set to `true`. The samples are signed floating-point PCM values between `-1` and `1`.
- GetInputFramesAvailable() -> int - Returns the number of frames available to read using `get_input_frames`.
- GetInputMixRate() -> float - Returns the sample rate at the input of the AudioServer.
- GetMixRate() -> float - Returns the sample rate at the output of the AudioServer.
- GetOutputDeviceList() -> string[] - Returns the names of all audio output devices detected on the system.
- GetOutputLatency() -> float - Returns the audio driver's effective output latency. This is based on `ProjectSettings.audio/driver/output_latency`, but the exact returned value will differ depending on the operating system and audio driver. **Note:** This can be expensive; it is not recommended to call `get_output_latency` every frame.
- GetSpeakerMode() -> int - Returns the speaker configuration.
- GetTimeSinceLastMix() -> float - Returns the relative time since the last mix occurred, in seconds.
- GetTimeToNextMix() -> float - Returns the relative time until the next mix occurs, in seconds.
- IsBusBypassingEffects(int busIdx) -> bool - If `true`, the bus at index `bus_idx` is bypassing effects.
- IsBusEffectEnabled(int busIdx, int effectIdx) -> bool - If `true`, the effect at index `effect_idx` on the bus at index `bus_idx` is enabled.
- IsBusMute(int busIdx) -> bool - If `true`, the bus at index `bus_idx` is muted.
- IsBusSolo(int busIdx) -> bool - If `true`, the bus at index `bus_idx` is in solo mode.
- IsStreamRegisteredAsSample(AudioStream stream) -> bool - If `true`, the stream is registered as a sample. The engine will not have to register it before playing the sample. If `false`, the stream will have to be registered before playing it. To prevent lag spikes, register the stream as sample with `register_stream_as_sample`.
- Lock() - Locks the audio driver's main loop. **Note:** Remember to unlock it afterwards.
- MoveBus(int index, int toIndex) - Moves the bus from index `index` to index `to_index`.
- RegisterStreamAsSample(AudioStream stream) - Forces the registration of a stream as a sample. **Note:** Lag spikes may occur when calling this method, especially on single-threaded builds. It is suggested to call this method while loading assets, where the lag spike could be masked, instead of registering the sample right before it needs to be played.
- RemoveBus(int index) - Removes the bus at index `index`.
- RemoveBusEffect(int busIdx, int effectIdx) - Removes the effect at index `effect_idx` from the bus at index `bus_idx`.
- SetBusBypassEffects(int busIdx, bool enable) - If `true`, the bus at index `bus_idx` is bypassing effects.
- SetBusEffectEnabled(int busIdx, int effectIdx, bool enabled) - If `true`, the effect at index `effect_idx` on the bus at index `bus_idx` is enabled.
- SetBusLayout(AudioBusLayout busLayout) - Overwrites the currently used AudioBusLayout.
- SetBusMute(int busIdx, bool enable) - If `true`, the bus at index `bus_idx` is muted.
- SetBusName(int busIdx, string name) - Sets the name of the bus at index `bus_idx` to `name`.
- SetBusSend(int busIdx, StringName send) - Connects the output of the bus at `bus_idx` to the bus named `send`.
- SetBusSolo(int busIdx, bool enable) - If `true`, the bus at index `bus_idx` is in solo mode.
- SetBusVolumeDb(int busIdx, float volumeDb) - Sets the volume in decibels of the bus at index `bus_idx` to `volume_db`.
- SetBusVolumeLinear(int busIdx, float volumeLinear) - Sets the volume as a linear value of the bus at index `bus_idx` to `volume_linear`. **Note:** Using this method is equivalent to calling `set_bus_volume_db` with the result of `@GlobalScope.linear_to_db` on a value.
- SetEnableTaggingUsedAudioStreams(bool enable) - If set to `true`, all instances of AudioStreamPlayback will call `AudioStreamPlayback._tag_used_streams` every mix step. **Note:** This is enabled by default in the editor, as it is used by editor plugins for the audio stream previews.
- SetInputDeviceActive(bool active) -> int - If `active` is `true`, starts the microphone input stream specified by `input_device` or returns an error if it failed. If `active` is `false`, stops the input stream if it is running.
- SwapBusEffects(int busIdx, int effectIdx, int byEffectIdx) - Swaps the position of two effects in bus `bus_idx`.
- Unlock() - Unlocks the audio driver's main loop. (After locking it, you should always unlock it.)

**Signals:**
- BusLayoutChanged - Emitted when an audio bus is added, deleted, or moved.
- BusRenamed(int busIndex, StringName oldName, StringName newName) - Emitted when the audio bus at `bus_index` is renamed from `old_name` to `new_name`.

**Enums:**
**SpeakerMode:** SPEAKER_MODE_STEREO=0, SPEAKER_SURROUND_31=1, SPEAKER_SURROUND_51=2, SPEAKER_SURROUND_71=3
  - SPEAKER_MODE_STEREO: Two or fewer speakers were detected.
  - SPEAKER_SURROUND_31: A 3.1 channel surround setup was detected.
  - SPEAKER_SURROUND_51: A 5.1 channel surround setup was detected.
  - SPEAKER_SURROUND_71: A 7.1 channel surround setup was detected.
**PlaybackType:** PLAYBACK_TYPE_DEFAULT=0, PLAYBACK_TYPE_STREAM=1, PLAYBACK_TYPE_SAMPLE=2, PLAYBACK_TYPE_MAX=3
  - PLAYBACK_TYPE_DEFAULT: The playback will be considered of the type declared at `ProjectSettings.audio/general/default_playback_type`.
  - PLAYBACK_TYPE_STREAM: Force the playback to be considered as a stream.
  - PLAYBACK_TYPE_SAMPLE: Force the playback to be considered as a sample. This can provide lower latency and more stable playback (with less risk of audio crackling), at the cost of having less flexibility. **Note:** Only currently supported on the web platform. **Note:** AudioEffects are not supported when playback is considered as a sample.
  - PLAYBACK_TYPE_MAX: Represents the size of the `PlaybackType` enum.

