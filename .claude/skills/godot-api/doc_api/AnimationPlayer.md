## AnimationPlayer <- AnimationMixer

An animation player is used for general-purpose playback of animations. It contains a dictionary of AnimationLibrary resources and custom blend times between animation transitions. Some methods and properties use a single key to reference an animation directly. These keys are formatted as the key for the library, followed by a forward slash, then the key for the animation within the library, for example `"movement/run"`. If the library's key is an empty string (known as the default library), the forward slash is omitted, being the same key used by the library. AnimationPlayer is better-suited than Tween for more complex animations, for example ones with non-trivial timings. It can also be used over Tween if the animation track editor is more convenient than doing it in code. Updating the target properties of animations occurs at the process frame.

**Props:**
- AssignedAnimation: StringName
- Autoplay: StringName = &""
- CurrentAnimation: StringName = &""
- CurrentAnimationLength: float
- CurrentAnimationPosition: float
- MovieQuitOnFinish: bool = false
- PlaybackAutoCapture: bool = true
- PlaybackAutoCaptureDuration: float = -1.0
- PlaybackAutoCaptureEaseType: int (Tween.EaseType) = 0
- PlaybackAutoCaptureTransitionType: int (Tween.TransitionType) = 0
- PlaybackDefaultBlendTime: float = 0.0
- SpeedScale: float = 1.0

- **assigned_animation**: If playing, the current animation's key, otherwise, the animation last played. When set, this changes the animation, but will not play it unless already playing. See also `current_animation`.
- **autoplay**: The key of the animation to play when the scene loads.
- **current_animation**: The key of the currently playing animation. If no animation is playing, the property's value is an empty string. Changing this value does not restart the animation. See `play` for more information on playing animations. **Note:** While this property appears in the Inspector, it's not meant to be edited, and it's not saved in the scene. This property is mainly used to get the currently playing animation, and internally for animation playback tracks. For more information, see Animation.
- **current_animation_length**: The length (in seconds) of the currently playing animation.
- **current_animation_position**: The position (in seconds) of the currently playing animation.
- **movie_quit_on_finish**: If `true` and the engine is running in Movie Maker mode (see MovieWriter), exits the engine with `SceneTree.quit` as soon as an animation is done playing in this AnimationPlayer. A message is printed when the engine quits for this reason. **Note:** This obeys the same logic as the `AnimationMixer.animation_finished` signal, so it will not quit the engine if the animation is set to be looping.
- **playback_auto_capture**: If `true`, performs `AnimationMixer.capture` before playback automatically. This means just `play_with_capture` is executed with default arguments instead of `play`. **Note:** Capture interpolation is only performed if the animation contains a capture track. See also `Animation.UPDATE_CAPTURE`.
- **playback_auto_capture_duration**: See also `play_with_capture` and `AnimationMixer.capture`. If `playback_auto_capture_duration` is negative value, the duration is set to the interval between the current position and the first key.
- **playback_auto_capture_ease_type**: The ease type of the capture interpolation. See also `Tween.EaseType`.
- **playback_auto_capture_transition_type**: The transition type of the capture interpolation. See also `Tween.TransitionType`.
- **playback_default_blend_time**: The default time in which to blend animations. Ranges from 0 to 4096 with 0.01 precision.
- **speed_scale**: The speed scaling ratio. For example, if this value is `1`, then the animation plays at normal speed. If it's `0.5`, then it plays at half speed. If it's `2`, then it plays at double speed. If set to a negative value, the animation is played in reverse. If set to `0`, the animation will not advance.

**Methods:**
- AnimationGetNext(StringName animationFrom) -> StringName - Returns the key of the animation which is queued to play after the `animation_from` animation.
- AnimationSetNext(StringName animationFrom, StringName animationTo) - Triggers the `animation_to` animation when the `animation_from` animation completes.
- ClearQueue() - Clears all queued, unplayed animations.
- GetBlendTime(StringName animationFrom, StringName animationTo) -> float - Returns the blend time (in seconds) between two animations, referenced by their keys.
- GetMethodCallMode() -> int - Returns the call mode used for "Call Method" tracks.
- GetPlayingSpeed() -> float - Returns the actual playing speed of current animation or `0` if not playing. This speed is the `speed_scale` property multiplied by `custom_speed` argument specified when calling the `play` method. Returns a negative value if the current animation is playing backwards.
- GetProcessCallback() -> int - Returns the process notification in which to update animations.
- GetQueue() -> StringName[] - Returns a list of the animation keys that are currently queued to play.
- GetRoot() -> NodePath - Returns the node which node path references will travel from.
- GetSectionEndTime() -> float - Returns the end time of the section currently being played.
- GetSectionStartTime() -> float - Returns the start time of the section currently being played.
- HasSection() -> bool - Returns `true` if an animation is currently playing with a section.
- IsAnimationActive() -> bool - Returns `true` if the an animation is currently active. An animation is active if it was played by calling `play` and was not finished yet, or was stopped by calling `stop`. This can be used to check whether an animation is currently paused or stopped.
- IsPlaying() -> bool - Returns `true` if an animation is currently playing (even if `speed_scale` and/or `custom_speed` are `0`).
- Pause() - Pauses the currently playing animation. The `current_animation_position` will be kept and calling `play` or `play_backwards` without arguments or with the same animation name as `assigned_animation` will resume the animation. See also `stop`.
- Play(StringName name = &"", float customBlend = -1, float customSpeed = 1.0, bool fromEnd = false) - Plays the animation with key `name`. Custom blend times and speed can be set. The `from_end` option only affects when switching to a new animation track, or if the same track but at the start or end. It does not affect resuming playback that was paused in the middle of an animation. If `custom_speed` is negative and `from_end` is `true`, the animation will play backwards (which is equivalent to calling `play_backwards`). The AnimationPlayer keeps track of its current or last played animation with `assigned_animation`. If this method is called with that same animation `name`, or with no `name` parameter, the assigned animation will resume playing if it was paused. **Note:** The animation will be updated the next time the AnimationPlayer is processed. If other variables are updated at the same time this is called, they may be updated too early. To perform the update immediately, call `advance(0)`.
- PlayBackwards(StringName name = &"", float customBlend = -1) - Plays the animation with key `name` in reverse. This method is a shorthand for `play` with `custom_speed = -1.0` and `from_end = true`, so see its description for more information.
- PlaySection(StringName name = &"", float startTime = -1, float endTime = -1, float customBlend = -1, float customSpeed = 1.0, bool fromEnd = false) - Plays the animation with key `name` and the section starting from `start_time` and ending on `end_time`. See also `play`. Setting `start_time` to a value outside the range of the animation means the start of the animation will be used instead, and setting `end_time` to a value outside the range of the animation means the end of the animation will be used instead. `start_time` cannot be equal to `end_time`.
- PlaySectionBackwards(StringName name = &"", float startTime = -1, float endTime = -1, float customBlend = -1) - Plays the animation with key `name` and the section starting from `start_time` and ending on `end_time` in reverse. This method is a shorthand for `play_section` with `custom_speed = -1.0` and `from_end = true`, see its description for more information.
- PlaySectionWithMarkers(StringName name = &"", StringName startMarker = &"", StringName endMarker = &"", float customBlend = -1, float customSpeed = 1.0, bool fromEnd = false) - Plays the animation with key `name` and the section starting from `start_marker` and ending on `end_marker`. If the start marker is empty, the section starts from the beginning of the animation. If the end marker is empty, the section ends on the end of the animation. See also `play`.
- PlaySectionWithMarkersBackwards(StringName name = &"", StringName startMarker = &"", StringName endMarker = &"", float customBlend = -1) - Plays the animation with key `name` and the section starting from `start_marker` and ending on `end_marker` in reverse. This method is a shorthand for `play_section_with_markers` with `custom_speed = -1.0` and `from_end = true`, see its description for more information.
- PlayWithCapture(StringName name = &"", float duration = -1.0, float customBlend = -1, float customSpeed = 1.0, bool fromEnd = false, int transType = 0, int easeType = 0) - See also `AnimationMixer.capture`. You can use this method to use more detailed options for capture than those performed by `playback_auto_capture`. When `playback_auto_capture` is `false`, this method is almost the same as the following: If `name` is blank, it specifies `assigned_animation`. If `duration` is a negative value, the duration is set to the interval between the current position and the first key, when `from_end` is `true`, uses the interval between the current position and the last key instead. **Note:** The `duration` takes `speed_scale` into account, but `custom_speed` does not, because the capture cache is interpolated with the blend result and the result may contain multiple animations.
- Queue(StringName name) - Queues an animation for playback once the current animation and all previously queued animations are done. **Note:** If a looped animation is currently playing, the queued animation will never play unless the looped animation is stopped somehow.
- ResetSection() - Resets the current section. Does nothing if a section has not been set.
- Seek(float seconds, bool update = false, bool updateOnly = false) - Seeks the animation to the `seconds` point in time (in seconds). If `update` is `true`, the animation updates too, otherwise it updates at process time. Events between the current frame and `seconds` are skipped. If `update_only` is `true`, the method / audio / animation playback tracks will not be processed. **Note:** Seeking to the end of the animation doesn't emit `AnimationMixer.animation_finished`. If you want to skip animation and emit the signal, use `AnimationMixer.advance`.
- SetBlendTime(StringName animationFrom, StringName animationTo, float sec) - Specifies a blend time (in seconds) between two animations, referenced by their keys.
- SetMethodCallMode(int mode) - Sets the call mode used for "Call Method" tracks.
- SetProcessCallback(int mode) - Sets the process notification in which to update animations.
- SetRoot(NodePath path) - Sets the node which node path references will travel from.
- SetSection(float startTime = -1, float endTime = -1) - Changes the start and end times of the section being played. The current playback position will be clamped within the new section. See also `play_section`.
- SetSectionWithMarkers(StringName startMarker = &"", StringName endMarker = &"") - Changes the start and end markers of the section being played. The current playback position will be clamped within the new section. See also `play_section_with_markers`. If the argument is empty, the section uses the beginning or end of the animation. If both are empty, it means that the section is not set.
- Stop(bool keepState = false) - Stops the currently playing animation. The animation position is reset to `0` and the `custom_speed` is reset to `1.0`. See also `pause`. If `keep_state` is `true`, the animation state is not updated visually. **Note:** The method / audio / animation playback tracks will not be processed by this method.

**Signals:**
- AnimationChanged(StringName oldName, StringName newName) - Emitted when a queued animation plays after the previous animation finished. See also `AnimationPlayer.queue`. **Note:** The signal is not emitted when the animation is changed via `AnimationPlayer.play` or by an AnimationTree.
- CurrentAnimationChanged(StringName name) - Emitted when `current_animation` changes.

**Enums:**
**AnimationProcessCallback:** ANIMATION_PROCESS_PHYSICS=0, ANIMATION_PROCESS_IDLE=1, ANIMATION_PROCESS_MANUAL=2
**AnimationMethodCallMode:** ANIMATION_METHOD_CALL_DEFERRED=0, ANIMATION_METHOD_CALL_IMMEDIATE=1

