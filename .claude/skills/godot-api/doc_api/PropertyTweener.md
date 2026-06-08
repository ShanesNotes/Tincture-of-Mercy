## PropertyTweener <- Tweener

PropertyTweener is used to interpolate a property in an object. See `Tween.tween_property` for more usage information. The tweener will finish automatically if the target object is freed. **Note:** `Tween.tween_property` is the only correct way to create PropertyTweener. Any PropertyTweener created manually will not function correctly.

**Methods:**
- AsRelative() -> PropertyTweener - When called, the final value will be used as a relative value instead. **Example:** Move the node by `100` pixels to the right.
- From(Variant value) -> PropertyTweener - Sets a custom initial value to the PropertyTweener. **Example:** Move the node from position `(100, 100)` to `(200, 100)`.
- FromCurrent() -> PropertyTweener - Makes the PropertyTweener use the current property value (i.e. at the time of creating this PropertyTweener) as a starting point. This is equivalent of using `from` with the current value. These two calls will do the same:
- SetCustomInterpolator(Callable interpolatorMethod) -> PropertyTweener - Allows interpolating the value with a custom easing function. The provided `interpolator_method` will be called with a value ranging from `0.0` to `1.0` and is expected to return a value within the same range (values outside the range can be used for overshoot). The return value of the method is then used for interpolation between initial and final value. Note that the parameter passed to the method is still subject to the tweener's own easing.
- SetDelay(float delay) -> PropertyTweener - Sets the time in seconds after which the PropertyTweener will start interpolating. By default there's no delay.
- SetEase(int ease) -> PropertyTweener - Sets the type of used easing from `Tween.EaseType`. If not set, the default easing is used from the Tween that contains this Tweener.
- SetTrans(int trans) -> PropertyTweener - Sets the type of used transition from `Tween.TransitionType`. If not set, the default transition is used from the Tween that contains this Tweener.

