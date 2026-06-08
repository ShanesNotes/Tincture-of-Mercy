## Vector2i

A 2-element structure that can be used to represent 2D grid coordinates or any other pair of integers. It uses integer coordinates and is therefore preferable to Vector2 when exact precision is required. Note that the values are limited to 32 bits, and unlike Vector2 this cannot be configured with an engine build option. Use [int] or PackedInt64Array if 64-bit values are needed. **Note:** In a boolean context, a Vector2i will evaluate to `false` if it's equal to `Vector2i(0, 0)`. Otherwise, a Vector2i will always evaluate to `true`.

**Props:**
- X: int = 0
- Y: int = 0

- **x**: The vector's X component. Also accessible by using the index position `[0]`.
- **y**: The vector's Y component. Also accessible by using the index position `[1]`.

**Methods:**
- Abs() -> Vector2i - Returns a new vector with all components in absolute values (i.e. positive).
- Aspect() -> float - Returns the aspect ratio of this vector, the ratio of `x` to `y`.
- Clamp(Vector2i min, Vector2i max) -> Vector2i - Returns a new vector with all components clamped between the components of `min` and `max`, by running `@GlobalScope.clamp` on each component.
- Clampi(int min, int max) -> Vector2i - Returns a new vector with all components clamped between `min` and `max`, by running `@GlobalScope.clamp` on each component.
- DistanceSquaredTo(Vector2i to) -> int - Returns the squared between this vector and `to`. This method runs faster than `distance_to`, so prefer it if you need to compare vectors or need the squared distance for some formula.
- DistanceTo(Vector2i to) -> float - Returns the between this vector and `to`.
- Length() -> float - Returns the length (magnitude) of this vector.
- LengthSquared() -> int - Returns the squared length (squared magnitude) of this vector. This method runs faster than `length`, so prefer it if you need to compare vectors or need the squared distance for some formula.
- Max(Vector2i with) -> Vector2i - Returns the component-wise maximum of this and `with`, equivalent to `Vector2i(maxi(x, with.x), maxi(y, with.y))`.
- MaxAxisIndex() -> int - Returns the axis of the vector's highest value. See `AXIS_*` constants. If all components are equal, this method returns `AXIS_X`.
- Maxi(int with) -> Vector2i - Returns the component-wise maximum of this and `with`, equivalent to `Vector2i(maxi(x, with), maxi(y, with))`.
- Min(Vector2i with) -> Vector2i - Returns the component-wise minimum of this and `with`, equivalent to `Vector2i(mini(x, with.x), mini(y, with.y))`.
- MinAxisIndex() -> int - Returns the axis of the vector's lowest value. See `AXIS_*` constants. If all components are equal, this method returns `AXIS_Y`.
- Mini(int with) -> Vector2i - Returns the component-wise minimum of this and `with`, equivalent to `Vector2i(mini(x, with), mini(y, with))`.
- Sign() -> Vector2i - Returns a new vector with each component set to `1` if it's positive, `-1` if it's negative, and `0` if it's zero. The result is identical to calling `@GlobalScope.sign` on each component.
- Snapped(Vector2i step) -> Vector2i - Returns a new vector with each component snapped to the closest multiple of the corresponding component in `step`.
- Snappedi(int step) -> Vector2i - Returns a new vector with each component snapped to the closest multiple of `step`.

**Enums:**
**Axis:** AXIS_X=0, AXIS_Y=1
  - AXIS_X: Enumerated value for the X axis. Returned by `max_axis_index` and `min_axis_index`.
  - AXIS_Y: Enumerated value for the Y axis. Returned by `max_axis_index` and `min_axis_index`.
**Constants:** ZERO=Vector2i(0, 0), ONE=Vector2i(1, 1), MIN=Vector2i(-2147483648, -2147483648), MAX=Vector2i(2147483647, 2147483647), LEFT=Vector2i(-1, 0), RIGHT=Vector2i(1, 0), UP=Vector2i(0, -1), DOWN=Vector2i(0, 1)
  - ZERO: Zero vector, a vector with all components set to `0`.
  - ONE: One vector, a vector with all components set to `1`.
  - MIN: Min vector, a vector with all components equal to `INT32_MIN`. Can be used as a negative integer equivalent of `Vector2.INF`.
  - MAX: Max vector, a vector with all components equal to `INT32_MAX`. Can be used as an integer equivalent of `Vector2.INF`.
  - LEFT: Left unit vector. Represents the direction of left.
  - RIGHT: Right unit vector. Represents the direction of right.
  - UP: Up unit vector. Y is down in 2D, so this vector points -Y.
  - DOWN: Down unit vector. Y is down in 2D, so this vector points +Y.

