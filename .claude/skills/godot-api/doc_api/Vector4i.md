## Vector4i

A 4-element structure that can be used to represent 4D grid coordinates or any other quadruplet of integers. It uses integer coordinates and is therefore preferable to Vector4 when exact precision is required. Note that the values are limited to 32 bits, and unlike Vector4 this cannot be configured with an engine build option. Use [int] or PackedInt64Array if 64-bit values are needed. **Note:** In a boolean context, a Vector4i will evaluate to `false` if it's equal to `Vector4i(0, 0, 0, 0)`. Otherwise, a Vector4i will always evaluate to `true`.

**Props:**
- W: int = 0
- X: int = 0
- Y: int = 0
- Z: int = 0

- **w**: The vector's W component. Also accessible by using the index position `[3]`.
- **x**: The vector's X component. Also accessible by using the index position `[0]`.
- **y**: The vector's Y component. Also accessible by using the index position `[1]`.
- **z**: The vector's Z component. Also accessible by using the index position `[2]`.

**Methods:**
- Abs() -> Vector4i - Returns a new vector with all components in absolute values (i.e. positive).
- Clamp(Vector4i min, Vector4i max) -> Vector4i - Returns a new vector with all components clamped between the components of `min` and `max`, by running `@GlobalScope.clamp` on each component.
- Clampi(int min, int max) -> Vector4i - Returns a new vector with all components clamped between `min` and `max`, by running `@GlobalScope.clamp` on each component.
- DistanceSquaredTo(Vector4i to) -> int - Returns the squared between this vector and `to`. This method runs faster than `distance_to`, so prefer it if you need to compare vectors or need the squared distance for some formula.
- DistanceTo(Vector4i to) -> float - Returns the between this vector and `to`.
- Length() -> float - Returns the length (magnitude) of this vector.
- LengthSquared() -> int - Returns the squared length (squared magnitude) of this vector. This method runs faster than `length`, so prefer it if you need to compare vectors or need the squared distance for some formula.
- Max(Vector4i with) -> Vector4i - Returns the component-wise maximum of this and `with`, equivalent to `Vector4i(maxi(x, with.x), maxi(y, with.y), maxi(z, with.z), maxi(w, with.w))`.
- MaxAxisIndex() -> int - Returns the axis of the vector's highest value. See `AXIS_*` constants. If all components are equal, this method returns `AXIS_X`.
- Maxi(int with) -> Vector4i - Returns the component-wise maximum of this and `with`, equivalent to `Vector4i(maxi(x, with), maxi(y, with), maxi(z, with), maxi(w, with))`.
- Min(Vector4i with) -> Vector4i - Returns the component-wise minimum of this and `with`, equivalent to `Vector4i(mini(x, with.x), mini(y, with.y), mini(z, with.z), mini(w, with.w))`.
- MinAxisIndex() -> int - Returns the axis of the vector's lowest value. See `AXIS_*` constants. If all components are equal, this method returns `AXIS_W`.
- Mini(int with) -> Vector4i - Returns the component-wise minimum of this and `with`, equivalent to `Vector4i(mini(x, with), mini(y, with), mini(z, with), mini(w, with))`.
- Sign() -> Vector4i - Returns a new vector with each component set to `1` if it's positive, `-1` if it's negative, and `0` if it's zero. The result is identical to calling `@GlobalScope.sign` on each component.
- Snapped(Vector4i step) -> Vector4i - Returns a new vector with each component snapped to the closest multiple of the corresponding component in `step`.
- Snappedi(int step) -> Vector4i - Returns a new vector with each component snapped to the closest multiple of `step`.

**Enums:**
**Axis:** AXIS_X=0, AXIS_Y=1, AXIS_Z=2, AXIS_W=3
  - AXIS_X: Enumerated value for the X axis. Returned by `max_axis_index` and `min_axis_index`.
  - AXIS_Y: Enumerated value for the Y axis. Returned by `max_axis_index` and `min_axis_index`.
  - AXIS_Z: Enumerated value for the Z axis. Returned by `max_axis_index` and `min_axis_index`.
  - AXIS_W: Enumerated value for the W axis. Returned by `max_axis_index` and `min_axis_index`.
**Constants:** ZERO=Vector4i(0, 0, 0, 0), ONE=Vector4i(1, 1, 1, 1), MIN=Vector4i(-2147483648, -2147483648, -2147483648, -2147483648), MAX=Vector4i(2147483647, 2147483647, 2147483647, 2147483647)
  - ZERO: Zero vector, a vector with all components set to `0`.
  - ONE: One vector, a vector with all components set to `1`.
  - MIN: Min vector, a vector with all components equal to `INT32_MIN`. Can be used as a negative integer equivalent of `Vector4.INF`.
  - MAX: Max vector, a vector with all components equal to `INT32_MAX`. Can be used as an integer equivalent of `Vector4.INF`.

