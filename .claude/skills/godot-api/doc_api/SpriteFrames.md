## SpriteFrames <- Resource

Sprite frame library for an AnimatedSprite2D or AnimatedSprite3D node. Contains frames and animation data for playback.

**Methods:**
- AddAnimation(StringName anim) - Adds a new `anim` animation to the library.
- AddFrame(StringName anim, Texture2D texture, float duration = 1.0, int atPosition = -1) - Adds a frame to the `anim` animation. If `at_position` is `-1`, the frame will be added to the end of the animation. `duration` specifies the relative duration, see `get_frame_duration` for details.
- Clear(StringName anim) - Removes all frames from the `anim` animation.
- ClearAll() - Removes all animations. An empty `default` animation will be created.
- DuplicateAnimation(StringName animFrom, StringName animTo) - Duplicates the animation `anim_from` to a new animation named `anim_to`. Fails if `anim_to` already exists, or if `anim_from` does not exist.
- GetAnimationLoop(StringName anim) -> bool - Returns `true` if `get_animation_loop_mode(anim) == LOOP_LINEAR`. Otherwise, returns `false`.
- GetAnimationLoopMode(StringName anim) -> int - Returns the loop mode for the `anim` animation.
- GetAnimationNames() -> string[] - Returns an array containing the names associated to each animation. Values are placed in alphabetical order.
- GetAnimationSpeed(StringName anim) -> float - Returns the speed in frames per second for the `anim` animation.
- GetFrameCount(StringName anim) -> int - Returns the number of frames for the `anim` animation.
- GetFrameDuration(StringName anim, int idx) -> float - Returns a relative duration of the frame `idx` in the `anim` animation (defaults to `1.0`). For example, a frame with a duration of `2.0` is displayed twice as long as a frame with a duration of `1.0`. You can calculate the absolute duration (in seconds) of a frame using the following formula: In this example, `playing_speed` refers to either `AnimatedSprite2D.get_playing_speed` or `AnimatedSprite3D.get_playing_speed`.
- GetFrameTexture(StringName anim, int idx) -> Texture2D - Returns the texture of the frame `idx` in the `anim` animation.
- HasAnimation(StringName anim) -> bool - Returns `true` if the `anim` animation exists.
- RemoveAnimation(StringName anim) - Removes the `anim` animation.
- RemoveFrame(StringName anim, int idx) - Removes the `anim` animation's frame `idx`.
- RenameAnimation(StringName anim, StringName newname) - Changes the `anim` animation's name to `newname`.
- SetAnimationLoop(StringName anim, bool loop) - If `loop` is `false` equivalent to `set_animation_loop_mode(LOOP_NONE)`. If `loop` is `true` equivalent to `set_animation_loop_mode(LOOP_LINEAR)`.
- SetAnimationLoopMode(StringName anim, int loopMode) - Sets the `loop_mode` for the `anim` animation.
- SetAnimationSpeed(StringName anim, float fps) - Sets the speed for the `anim` animation in frames per second.
- SetFrame(StringName anim, int idx, Texture2D texture, float duration = 1.0) - Sets the `texture` and the `duration` of the frame `idx` in the `anim` animation. `duration` specifies the relative duration, see `get_frame_duration` for details.

**Enums:**
**LoopMode:** LOOP_NONE=0, LOOP_LINEAR=1, LOOP_PINGPONG=2
  - LOOP_NONE: The animation plays once and stops when it reaches the end, or the start if played in reverse.
  - LOOP_LINEAR: The animation restarts from the beginning when it reaches the end, or from the end if played in reverse, repeating continuously.
  - LOOP_PINGPONG: The animation alternates direction each time it reaches the end or start, playing forward and then in reverse repeatedly. **Note:** Both AnimatedSprite2D and AnimatedSprite3D play the first/last frame for its duration only once at each end of the animation loop (instead of twice, once per forward/backward animation direction).

