## Animation <- Resource

This resource holds data that can be used to animate anything in the engine. Animations are divided into tracks and each track must be linked to a node. The state of that node can be changed through time, by adding timed keys (events) to the track. Animations are just data containers, and must be added to nodes such as an AnimationPlayer to be played back. Animation tracks have different types, each with its own set of dedicated methods. Check `TrackType` to see available types. **Note:** For 3D position/rotation/scale, using the dedicated `TYPE_POSITION_3D`, `TYPE_ROTATION_3D` and `TYPE_SCALE_3D` track types instead of `TYPE_VALUE` is recommended for performance reasons.

**Props:**
- CaptureIncluded: bool = false
- Length: float = 1.0
- LoopMode: int (Animation.LoopMode) = 0
- Step: float = 0.033333335

- **capture_included**: Returns `true` if the capture track is included. This is a cached readonly value for performance.
- **length**: The total length of the animation (in seconds). **Note:** Length is not delimited by the last key, as this one may be before or after the end to ensure correct interpolation and looping.
- **loop_mode**: Determines the behavior of both ends of the animation timeline during animation playback. This indicates whether and how the animation should be restarted, and is also used to correctly interpolate animation cycles.
- **step**: The animation step value.

**Methods:**
- AddMarker(StringName name, float time) - Adds a marker to this Animation.
- AddTrack(int type, int atPosition = -1) -> int - Adds a track to the Animation.
- AnimationTrackGetKeyAnimation(int trackIdx, int keyIdx) -> StringName - Returns the animation name at the key identified by `key_idx`. The `track_idx` must be the index of an Animation Track.
- AnimationTrackInsertKey(int trackIdx, float time, StringName animation) -> int - Inserts a key with value `animation` at the given `time` (in seconds). The `track_idx` must be the index of an Animation Track.
- AnimationTrackSetKeyAnimation(int trackIdx, int keyIdx, StringName animation) - Sets the key identified by `key_idx` to value `animation`. The `track_idx` must be the index of an Animation Track.
- AudioTrackGetKeyEndOffset(int trackIdx, int keyIdx) -> float - Returns the end offset of the key identified by `key_idx`. The `track_idx` must be the index of an Audio Track. End offset is the number of seconds cut off at the ending of the audio stream.
- AudioTrackGetKeyStartOffset(int trackIdx, int keyIdx) -> float - Returns the start offset of the key identified by `key_idx`. The `track_idx` must be the index of an Audio Track. Start offset is the number of seconds cut off at the beginning of the audio stream.
- AudioTrackGetKeyStream(int trackIdx, int keyIdx) -> Resource - Returns the audio stream of the key identified by `key_idx`. The `track_idx` must be the index of an Audio Track.
- AudioTrackInsertKey(int trackIdx, float time, Resource stream, float startOffset = 0, float endOffset = 0) -> int - Inserts an Audio Track key at the given `time` in seconds. The `track_idx` must be the index of an Audio Track. `stream` is the AudioStream resource to play. `start_offset` is the number of seconds cut off at the beginning of the audio stream, while `end_offset` is at the ending.
- AudioTrackIsUseBlend(int trackIdx) -> bool - Returns `true` if the track at `track_idx` will be blended with other animations.
- AudioTrackSetKeyEndOffset(int trackIdx, int keyIdx, float offset) - Sets the end offset of the key identified by `key_idx` to value `offset`. The `track_idx` must be the index of an Audio Track.
- AudioTrackSetKeyStartOffset(int trackIdx, int keyIdx, float offset) - Sets the start offset of the key identified by `key_idx` to value `offset`. The `track_idx` must be the index of an Audio Track.
- AudioTrackSetKeyStream(int trackIdx, int keyIdx, Resource stream) - Sets the stream of the key identified by `key_idx` to value `stream`. The `track_idx` must be the index of an Audio Track.
- AudioTrackSetUseBlend(int trackIdx, bool enable) - Sets whether the track will be blended with other animations. If `true`, the audio playback volume changes depending on the blend value.
- BezierTrackGetKeyInHandle(int trackIdx, int keyIdx) -> Vector2 - Returns the in handle of the key identified by `key_idx`. The `track_idx` must be the index of a Bezier Track.
- BezierTrackGetKeyOutHandle(int trackIdx, int keyIdx) -> Vector2 - Returns the out handle of the key identified by `key_idx`. The `track_idx` must be the index of a Bezier Track.
- BezierTrackGetKeyValue(int trackIdx, int keyIdx) -> float - Returns the value of the key identified by `key_idx`. The `track_idx` must be the index of a Bezier Track.
- BezierTrackInsertKey(int trackIdx, float time, float value, Vector2 inHandle = Vector2(0, 0), Vector2 outHandle = Vector2(0, 0)) -> int - Inserts a Bezier Track key at the given `time` in seconds. The `track_idx` must be the index of a Bezier Track. `in_handle` is the left-side weight of the added Bezier curve point, `out_handle` is the right-side one, while `value` is the actual value at this point.
- BezierTrackInterpolate(int trackIdx, float time) -> float - Returns the interpolated value at the given `time` (in seconds). The `track_idx` must be the index of a Bezier Track.
- BezierTrackSetKeyInHandle(int trackIdx, int keyIdx, Vector2 inHandle, float balancedValueTimeRatio = 1.0) - Sets the in handle of the key identified by `key_idx` to value `in_handle`. The `track_idx` must be the index of a Bezier Track.
- BezierTrackSetKeyOutHandle(int trackIdx, int keyIdx, Vector2 outHandle, float balancedValueTimeRatio = 1.0) - Sets the out handle of the key identified by `key_idx` to value `out_handle`. The `track_idx` must be the index of a Bezier Track.
- BezierTrackSetKeyValue(int trackIdx, int keyIdx, float value) - Sets the value of the key identified by `key_idx` to the given value. The `track_idx` must be the index of a Bezier Track.
- BlendShapeTrackInsertKey(int trackIdx, float time, float amount) -> int - Inserts a key in a given blend shape track. Returns the key index.
- BlendShapeTrackInterpolate(int trackIdx, float timeSec, bool backward = false) -> float - Returns the interpolated blend shape value at the given time (in seconds). The `track_idx` must be the index of a blend shape track.
- Clear() - Clear the animation (clear all tracks and reset all).
- Compress(int pageSize = 8192, int fps = 120, float splitTolerance = 4.0) - Compress the animation and all its tracks in-place. This will make `track_is_compressed` return `true` once called on this Animation. Compressed tracks require less memory to be played, and are designed to be used for complex 3D animations (such as cutscenes) imported from external 3D software. Compression is lossy, but the difference is usually not noticeable in real world conditions. **Note:** Compressed tracks have various limitations (such as not being editable from the editor), so only use compressed animations if you actually need them.
- CopyTrack(int trackIdx, Animation toAnimation) - Adds a new track to `to_animation` that is a copy of the given track from this animation.
- FindTrack(NodePath path, int type) -> int - Returns the index of the specified track. If the track is not found, return -1.
- GetMarkerAtTime(float time) -> StringName - Returns the name of the marker located at the given time.
- GetMarkerColor(StringName name) -> Color - Returns the given marker's color.
- GetMarkerNames() -> string[] - Returns every marker in this Animation, sorted ascending by time.
- GetMarkerTime(StringName name) -> float - Returns the given marker's time.
- GetNextMarker(float time) -> StringName - Returns the closest marker that comes after the given time. If no such marker exists, an empty string is returned.
- GetPrevMarker(float time) -> StringName - Returns the closest marker that comes before the given time. If no such marker exists, an empty string is returned.
- GetTrackCount() -> int - Returns the amount of tracks in the animation.
- HasMarker(StringName name) -> bool - Returns `true` if this Animation contains a marker with the given name.
- MethodTrackGetName(int trackIdx, int keyIdx) -> StringName - Returns the method name of a method track.
- MethodTrackGetParams(int trackIdx, int keyIdx) -> Godot.Collections.Array - Returns the arguments values to be called on a method track for a given key in a given track.
- Optimize(float allowedVelocityErr = 0.01, float allowedAngularErr = 0.01, int precision = 3) - Optimize the animation and all its tracks in-place. This will preserve only as many keys as are necessary to keep the animation within the specified bounds.
- PositionTrackInsertKey(int trackIdx, float time, Vector3 position) -> int - Inserts a key in a given 3D position track. Returns the key index.
- PositionTrackInterpolate(int trackIdx, float timeSec, bool backward = false) -> Vector3 - Returns the interpolated position value at the given time (in seconds). The `track_idx` must be the index of a 3D position track.
- RemoveMarker(StringName name) - Removes the marker with the given name from this Animation.
- RemoveTrack(int trackIdx) - Removes a track by specifying the track index.
- RotationTrackInsertKey(int trackIdx, float time, Quaternion rotation) -> int - Inserts a key in a given 3D rotation track. Returns the key index.
- RotationTrackInterpolate(int trackIdx, float timeSec, bool backward = false) -> Quaternion - Returns the interpolated rotation value at the given time (in seconds). The `track_idx` must be the index of a 3D rotation track.
- ScaleTrackInsertKey(int trackIdx, float time, Vector3 scale) -> int - Inserts a key in a given 3D scale track. Returns the key index.
- ScaleTrackInterpolate(int trackIdx, float timeSec, bool backward = false) -> Vector3 - Returns the interpolated scale value at the given time (in seconds). The `track_idx` must be the index of a 3D scale track.
- SetMarkerColor(StringName name, Color color) - Sets the given marker's color.
- TrackFindKey(int trackIdx, float time, int findMode = 0, bool limit = false, bool backward = false) -> int - Finds the key index by time in a given track. Optionally, only find it if the approx/exact time is given. If `limit` is `true`, it does not return keys outside the animation range. If `backward` is `true`, the direction is reversed in methods that rely on one directional processing. For example, in case `find_mode` is `FIND_MODE_NEAREST`, if there is no key in the current position just after seeked, the first key found is retrieved by searching before the position, but if `backward` is `true`, the first key found is retrieved after the position.
- TrackGetInterpolationLoopWrap(int trackIdx) -> bool - Returns `true` if the track at `track_idx` wraps the interpolation loop. New tracks wrap the interpolation loop by default.
- TrackGetInterpolationType(int trackIdx) -> int - Returns the interpolation type of a given track.
- TrackGetKeyCount(int trackIdx) -> int - Returns the number of keys in a given track.
- TrackGetKeyTime(int trackIdx, int keyIdx) -> float - Returns the time at which the key is located.
- TrackGetKeyTransition(int trackIdx, int keyIdx) -> float - Returns the transition curve (easing) for a specific key (see the built-in math function `@GlobalScope.ease`).
- TrackGetKeyValue(int trackIdx, int keyIdx) -> Variant - Returns the value of a given key in a given track.
- TrackGetPath(int trackIdx) -> NodePath - Gets the path of a track. For more information on the path format, see `track_set_path`.
- TrackGetType(int trackIdx) -> int - Gets the type of a track.
- TrackInsertKey(int trackIdx, float time, Variant key, float transition = 1) -> int - Inserts a generic key in a given track. Returns the key index.
- TrackIsCompressed(int trackIdx) -> bool - Returns `true` if the track is compressed, `false` otherwise. See also `compress`.
- TrackIsEnabled(int trackIdx) -> bool - Returns `true` if the track at index `track_idx` is enabled.
- TrackIsImported(int trackIdx) -> bool - Returns `true` if the given track is imported. Else, return `false`.
- TrackMoveDown(int trackIdx) - Moves a track down.
- TrackMoveTo(int trackIdx, int toIdx) - Changes the index position of track `track_idx` to the one defined in `to_idx`.
- TrackMoveUp(int trackIdx) - Moves a track up.
- TrackRemoveKey(int trackIdx, int keyIdx) - Removes a key by index in a given track.
- TrackRemoveKeyAtTime(int trackIdx, float time) - Removes a key at `time` in a given track.
- TrackSetEnabled(int trackIdx, bool enabled) - Enables/disables the given track. Tracks are enabled by default.
- TrackSetImported(int trackIdx, bool imported) - Sets the given track as imported or not.
- TrackSetInterpolationLoopWrap(int trackIdx, bool interpolation) - If `true`, the track at `track_idx` wraps the interpolation loop.
- TrackSetInterpolationType(int trackIdx, int interpolation) - Sets the interpolation type of a given track.
- TrackSetKeyTime(int trackIdx, int keyIdx, float time) - Sets the time of an existing key.
- TrackSetKeyTransition(int trackIdx, int keyIdx, float transition) - Sets the transition curve (easing) for a specific key (see the built-in math function `@GlobalScope.ease`).
- TrackSetKeyValue(int trackIdx, int key, Variant value) - Sets the value of an existing key.
- TrackSetPath(int trackIdx, NodePath path) - Sets the path of a track. Paths must be valid scene-tree paths to a node and must be specified starting from the `AnimationMixer.root_node` that will reproduce the animation. Tracks that control properties or bones must append their name after the path, separated by `":"`. For example, `"character/skeleton:ankle"` or `"character/mesh:transform/local"`.
- TrackSwap(int trackIdx, int withIdx) - Swaps the track `track_idx`'s index position with the track `with_idx`.
- ValueTrackGetUpdateMode(int trackIdx) -> int - Returns the update mode of a value track.
- ValueTrackInterpolate(int trackIdx, float timeSec, bool backward = false) -> Variant - Returns the interpolated value at the given time (in seconds). The `track_idx` must be the index of a value track. A `backward` mainly affects the direction of key retrieval of the track with `UPDATE_DISCRETE` converted by `AnimationMixer.ANIMATION_CALLBACK_MODE_DISCRETE_FORCE_CONTINUOUS` to match the result with `track_find_key`.
- ValueTrackSetUpdateMode(int trackIdx, int mode) - Sets the update mode of a value track.

**Enums:**
**TrackType:** TYPE_VALUE=0, TYPE_POSITION_3D=1, TYPE_ROTATION_3D=2, TYPE_SCALE_3D=3, TYPE_BLEND_SHAPE=4, TYPE_METHOD=5, TYPE_BEZIER=6, TYPE_AUDIO=7, TYPE_ANIMATION=8
  - TYPE_VALUE: Value tracks set values in node properties, but only those which can be interpolated. For 3D position/rotation/scale, using the dedicated `TYPE_POSITION_3D`, `TYPE_ROTATION_3D` and `TYPE_SCALE_3D` track types instead of `TYPE_VALUE` is recommended for performance reasons.
  - TYPE_POSITION_3D: 3D position track (values are stored in Vector3s).
  - TYPE_ROTATION_3D: 3D rotation track (values are stored in Quaternions).
  - TYPE_SCALE_3D: 3D scale track (values are stored in Vector3s).
  - TYPE_BLEND_SHAPE: Blend shape track.
  - TYPE_METHOD: Method tracks call functions with given arguments per key.
  - TYPE_BEZIER: Bezier tracks are used to interpolate a value using custom curves. They can also be used to animate sub-properties of vectors and colors (e.g. alpha value of a Color).
  - TYPE_AUDIO: Audio tracks are used to play an audio stream with either type of AudioStreamPlayer. The stream can be trimmed and previewed in the animation.
  - TYPE_ANIMATION: Animation tracks play animations in other AnimationPlayer nodes.
**InterpolationType:** INTERPOLATION_NEAREST=0, INTERPOLATION_LINEAR=1, INTERPOLATION_CUBIC=2, INTERPOLATION_LINEAR_ANGLE=3, INTERPOLATION_CUBIC_ANGLE=4
  - INTERPOLATION_NEAREST: No interpolation (nearest value).
  - INTERPOLATION_LINEAR: Linear interpolation.
  - INTERPOLATION_CUBIC: Cubic interpolation. This looks smoother than linear interpolation, but is more expensive to interpolate. Stick to `INTERPOLATION_LINEAR` for complex 3D animations imported from external software, even if it requires using a higher animation framerate in return.
  - INTERPOLATION_LINEAR_ANGLE: Linear interpolation with shortest path rotation. **Note:** The result value is always normalized and may not match the key value.
  - INTERPOLATION_CUBIC_ANGLE: Cubic interpolation with shortest path rotation. **Note:** The result value is always normalized and may not match the key value.
**UpdateMode:** UPDATE_CONTINUOUS=0, UPDATE_DISCRETE=1, UPDATE_CAPTURE=2
  - UPDATE_CONTINUOUS: Update between keyframes and hold the value.
  - UPDATE_DISCRETE: Update at the keyframes.
  - UPDATE_CAPTURE: Same as `UPDATE_CONTINUOUS` but works as a flag to capture the value of the current object and perform interpolation in some methods. See also `AnimationMixer.capture`, `AnimationPlayer.playback_auto_capture`, and `AnimationPlayer.play_with_capture`.
**LoopMode:** LOOP_NONE=0, LOOP_LINEAR=1, LOOP_PINGPONG=2
  - LOOP_NONE: At both ends of the animation, the animation will stop playing.
  - LOOP_LINEAR: At both ends of the animation, the animation will be repeated without changing the playback direction.
  - LOOP_PINGPONG: Repeats playback and reverse playback at both ends of the animation.
**LoopedFlag:** LOOPED_FLAG_NONE=0, LOOPED_FLAG_END=1, LOOPED_FLAG_START=2
  - LOOPED_FLAG_NONE: This flag indicates that the animation proceeds without any looping.
  - LOOPED_FLAG_END: This flag indicates that the animation has reached the end of the animation and just after loop processed.
  - LOOPED_FLAG_START: This flag indicates that the animation has reached the start of the animation and just after loop processed.
**FindMode:** FIND_MODE_NEAREST=0, FIND_MODE_APPROX=1, FIND_MODE_EXACT=2
  - FIND_MODE_NEAREST: Finds the nearest time key.
  - FIND_MODE_APPROX: Finds only the key with approximating the time.
  - FIND_MODE_EXACT: Finds only the key with matching the time.

