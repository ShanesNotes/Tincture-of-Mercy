## AnimatedSprite2D <- Node2D

AnimatedSprite2D is similar to the Sprite2D node, except it carries multiple textures as animation frames. Animations are created using a SpriteFrames resource, which allows you to import image files (or a folder containing said files) to provide the animation frames for the sprite. The SpriteFrames resource can be configured in the editor via the SpriteFrames bottom panel.

**Props:**
- Animation: StringName = &"default"
- Autoplay: string = ""
- Centered: bool = true
- FlipH: bool = false
- FlipV: bool = false
- Frame: int = 0
- FrameProgress: float = 0.0
- Offset: Vector2 = Vector2(0, 0)
- SpeedScale: float = 1.0
- SpriteFrames: SpriteFrames

- **animation**: The current animation from the `sprite_frames` resource. If this value is changed, the `frame` counter and the `frame_progress` are reset.
- **autoplay**: The key of the animation to play when the scene loads.
- **centered**: If `true`, texture will be centered. **Note:** For games with a pixel art aesthetic, textures may appear deformed when centered. This is caused by their position being between pixels. To prevent this, set this property to `false`, or consider enabling `ProjectSettings.rendering/2d/snap/snap_2d_vertices_to_pixel` and `ProjectSettings.rendering/2d/snap/snap_2d_transforms_to_pixel`.
- **flip_h**: If `true`, texture is flipped horizontally.
- **flip_v**: If `true`, texture is flipped vertically.
- **frame**: The displayed animation frame's index. Setting this property also resets `frame_progress`. If this is not desired, use `set_frame_and_progress`.
- **frame_progress**: The progress value between `0.0` and `1.0` until the current frame transitions to the next frame. If the animation is playing backwards, the value transitions from `1.0` to `0.0`.
- **offset**: The texture's drawing offset.
- **speed_scale**: The speed scaling ratio. For example, if this value is `1`, then the animation plays at normal speed. If it's `0.5`, then it plays at half speed. If it's `2`, then it plays at double speed. If set to a negative value, the animation is played in reverse. If set to `0`, the animation will not advance.
- **sprite_frames**: The SpriteFrames resource containing the animation(s). Allows you the option to load, edit, clear, make unique and save the states of the SpriteFrames resource.

**Methods:**
- GetPlayingSpeed() -> float - Returns the actual playing speed of current animation or `0` if not playing. This speed is the `speed_scale` property multiplied by `custom_speed` argument specified when calling the `play` method. Returns a negative value if the current animation is playing backwards.
- IsPlaying() -> bool - Returns `true` if an animation is currently playing (even if `speed_scale` and/or `custom_speed` are `0`).
- Pause() - Pauses the currently playing animation. The `frame` and `frame_progress` will be kept and calling `play` or `play_backwards` without arguments will resume the animation from the current playback position. See also `stop`.
- Play(StringName name = &"", float customSpeed = 1.0, bool fromEnd = false) - Plays the animation with key `name`. If `custom_speed` is negative and `from_end` is `true`, the animation will play backwards (which is equivalent to calling `play_backwards`). If this method is called with that same animation `name`, or with no `name` parameter, the assigned animation will resume playing if it was paused.
- PlayBackwards(StringName name = &"") - Plays the animation with key `name` in reverse. This method is a shorthand for `play` with `custom_speed = -1.0` and `from_end = true`, so see its description for more information.
- SetFrameAndProgress(int frame, float progress) - Sets `frame` and `frame_progress` to the given values. Unlike setting `frame`, this method does not reset the `frame_progress` to `0.0` implicitly. **Example:** Change the animation while keeping the same `frame` and `frame_progress`:
- Stop() - Stops the currently playing animation. The animation position is reset to `0` and the `custom_speed` is reset to `1.0`. See also `pause`.

**Signals:**
- AnimationChanged - Emitted when `animation` changes.
- AnimationFinished - Emitted when the animation reaches the end, or the start if it is played in reverse. When the animation finishes, it pauses the playback. **Note:** This signal is not emitted if an animation is looping.
- AnimationLooped - Emitted when the animation loops.
- FrameChanged - Emitted when `frame` changes.
- SpriteFramesChanged - Emitted when `sprite_frames` changes.

