## Vector4

A 4-element structure that can be used to represent 4D coordinates or any other quadruplet of numeric values. It uses floating-point coordinates. By default, these floating-point values use 32-bit precision, unlike [float] which is always 64-bit. If double precision is needed, compile the engine with the option `precision=double`. See Vector4i for its integer counterpart. **Note:** In a boolean context, a Vector4 will evaluate to `false` if it's equal to `Vector4(0, 0, 0, 0)`. Otherwise, a Vector4 will always evaluate to `true`.

**Props:**
- W: float = 0.0
- X: float = 0.0
- Y: float = 0.0
- Z: float = 0.0

- **w**: The vector's W component. Also accessible by using the index position `[3]`.
- **x**: The vector's X component. Also accessible by using the index position `[0]`.
- **y**: The vector's Y component. Also accessible by using the index position `[1]`.
- **z**: The vector's Z component. Also accessible by using the index position `[2]`.

**Methods:**
- Abs() -> Vector4 - Returns a new vector with all components in absolute values (i.e. positive).
- Ceil() -> Vector4 - Returns a new vector with all components rounded up (towards positive infinity).
- Clamp(Vector4 min, Vector4 max) -> Vector4 - Returns a new vector with all components clamped between the components of `min` and `max`, by running `@GlobalScope.clamp` on each component.
- Clampf(float min, float max) -> Vector4 - Returns a new vector with all components clamped between `min` and `max`, by running `@GlobalScope.clamp` on each component.
- CubicInterpolate(Vector4 b, Vector4 preA, Vector4 postB, float weight) -> Vector4 - Performs a cubic interpolation between this vector and `b` using `pre_a` and `post_b` as handles, and returns the result at position `weight`. `weight` is on the range of 0.0 to 1.0, representing the amount of interpolation.
- CubicInterpolateInTime(Vector4 b, Vector4 preA, Vector4 postB, float weight, float bT, float preAT, float postBT) -> Vector4 - Performs a cubic interpolation between this vector and `b` using `pre_a` and `post_b` as handles, and returns the result at position `weight`. `weight` is on the range of 0.0 to 1.0, representing the amount of interpolation. It can perform smoother interpolation than `cubic_interpolate` by the time values.
- DirectionTo(Vector4 to) -> Vector4 - Returns the normalized vector pointing from this vector to `to`. This is equivalent to using `(b - a).normalized()`.
- DistanceSquaredTo(Vector4 to) -> float - Returns the squared between this vector and `to`. This method runs faster than `distance_to`, so prefer it if you need to compare vectors or need the squared distance for some formula.
- DistanceTo(Vector4 to) -> float - Returns the between this vector and `to`.
- Dot(Vector4 with) -> float - Returns the dot product of this vector and `with`.
- Floor() -> Vector4 - Returns a new vector with all components rounded down (towards negative infinity).
- Inverse() -> Vector4 - Returns the inverse of the vector. This is the same as `Vector4(1.0 / v.x, 1.0 / v.y, 1.0 / v.z, 1.0 / v.w)`.
- IsEqualApprox(Vector4 to) -> bool - Returns `true` if this vector and `to` are approximately equal, by running `@GlobalScope.is_equal_approx` on each component.
- IsFinite() -> bool - Returns `true` if this vector is finite, by calling `@GlobalScope.is_finite` on each component.
- IsNormalized() -> bool - Returns `true` if the vector is normalized, i.e. its length is approximately equal to 1.
- IsZeroApprox() -> bool - Returns `true` if this vector's values are approximately zero, by running `@GlobalScope.is_zero_approx` on each component. This method is faster than using `is_equal_approx` with one value as a zero vector.
- Length() -> float - Returns the length (magnitude) of this vector.
- LengthSquared() -> float - Returns the squared length (squared magnitude) of this vector. This method runs faster than `length`, so prefer it if you need to compare vectors or need the squared distance for some formula.
- Lerp(Vector4 to, float weight) -> Vector4 - Returns the result of the linear interpolation between this vector and `to` by amount `weight`. `weight` is on the range of `0.0` to `1.0`, representing the amount of interpolation.
- Max(Vector4 with) -> Vector4 - Returns the component-wise maximum of this and `with`, equivalent to `Vector4(maxf(x, with.x), maxf(y, with.y), maxf(z, with.z), maxf(w, with.w))`.
- MaxAxisIndex() -> int - Returns the axis of the vector's highest value. See `AXIS_*` constants. If all components are equal, this method returns `AXIS_X`.
- Maxf(float with) -> Vector4 - Returns the component-wise maximum of this and `with`, equivalent to `Vector4(maxf(x, with), maxf(y, with), maxf(z, with), maxf(w, with))`.
- Min(Vector4 with) -> Vector4 - Returns the component-wise minimum of this and `with`, equivalent to `Vector4(minf(x, with.x), minf(y, with.y), minf(z, with.z), minf(w, with.w))`.
- MinAxisIndex() -> int - Returns the axis of the vector's lowest value. See `AXIS_*` constants. If all components are equal, this method returns `AXIS_W`.
- Minf(float with) -> Vector4 - Returns the component-wise minimum of this and `with`, equivalent to `Vector4(minf(x, with), minf(y, with), minf(z, with), minf(w, with))`.
- Normalized() -> Vector4 - Returns the result of scaling the vector to unit length. Equivalent to `v / v.length()`. Returns `(0, 0, 0, 0)` if `v.length() == 0`. See also `is_normalized`. **Note:** This function may return incorrect values if the input vector length is near zero.
- Posmod(float mod) -> Vector4 - Returns a vector composed of the `@GlobalScope.fposmod` of this vector's components and `mod`.
- Posmodv(Vector4 modv) -> Vector4 - Returns a vector composed of the `@GlobalScope.fposmod` of this vector's components and `modv`'s components.
- Round() -> Vector4 - Returns a new vector with all components rounded to the nearest integer, with halfway cases rounded away from zero.
- Sign() -> Vector4 - Returns a new vector with each component set to `1.0` if it's positive, `-1.0` if it's negative, and `0.0` if it's zero. The result is identical to calling `@GlobalScope.sign` on each component.
- Snapped(Vector4 step) -> Vector4 - Returns a new vector with each component snapped to the nearest multiple of the corresponding component in `step`. This can also be used to round the components to an arbitrary number of decimals.
- Snappedf(float step) -> Vector4 - Returns a new vector with each component snapped to the nearest multiple of `step`. This can also be used to round the components to an arbitrary number of decimals.

**Enums:**
**Axis:** AXIS_X=0, AXIS_Y=1, AXIS_Z=2, AXIS_W=3
  - AXIS_X: Enumerated value for the X axis. Returned by `max_axis_index` and `min_axis_index`.
  - AXIS_Y: Enumerated value for the Y axis. Returned by `max_axis_index` and `min_axis_index`.
  - AXIS_Z: Enumerated value for the Z axis. Returned by `max_axis_index` and `min_axis_index`.
  - AXIS_W: Enumerated value for the W axis. Returned by `max_axis_index` and `min_axis_index`.
**Constants:** ZERO=Vector4(0, 0, 0, 0), ONE=Vector4(1, 1, 1, 1), INF=Vector4(inf, inf, inf, inf)
  - ZERO: Zero vector, a vector with all components set to `0`.
  - ONE: One vector, a vector with all components set to `1`.
  - INF: Infinity vector, a vector with all components set to `@GDScript.INF`.

