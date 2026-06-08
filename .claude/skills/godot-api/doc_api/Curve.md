## Curve <- Resource

This resource describes a mathematical curve by defining a set of points and tangents at each point. By default, it ranges between `0` and `1` on the X and Y axes, but these ranges can be changed. Please note that many resources and nodes assume they are given *unit curves*. A unit curve is a curve whose domain (the X axis) is between `0` and `1`. Some examples of unit curve usage are `CPUParticles2D.angle_curve` and `Line2D.width_curve`.

**Props:**
- BakeResolution: int = 100
- MaxDomain: float = 1.0
- MaxValue: float = 1.0
- MinDomain: float = 0.0
- MinValue: float = 0.0
- PointCount: int = 0
- Point{index}/leftMode: int = 0
- Point{index}/leftTangent: float = 0.0
- Point{index}/position: Vector2 = Vector2(0, 0)
- Point{index}/rightMode: int = 0
- Point{index}/rightTangent: float = 0.0

- **bake_resolution**: The number of points to include in the baked (i.e. cached) curve data.
- **max_domain**: The maximum domain (x-coordinate) that points can have.
- **max_value**: The maximum value (y-coordinate) that points can have. Tangents can cause higher values between points.
- **min_domain**: The minimum domain (x-coordinate) that points can have.
- **min_value**: The minimum value (y-coordinate) that points can have. Tangents can cause lower values between points.
- **point_count**: The number of points describing the curve.
- **point_{index}/left_mode**: The left `TangentMode` for the point at `index`. **Note:** `index` is a value in the `0 .. point_count - 1` range.
- **point_{index}/left_tangent**: The left tangent angle (in degrees) for the point at `index`. **Note:** `index` is a value in the `0 .. point_count - 1` range.
- **point_{index}/position**: The position of the point at `index`. **Note:** `index` is a value in the `0 .. point_count - 1` range.
- **point_{index}/right_mode**: The right `TangentMode` for the point at `index`. **Note:** `index` is a value in the `0 .. point_count - 1` range.
- **point_{index}/right_tangent**: The right tangent angle (in degrees) for the point at `index`. **Note:** `index` is a value in the `0 .. point_count - 1` range.

**Methods:**
- AddPoint(Vector2 position, float leftTangent = 0, float rightTangent = 0, int leftMode = 0, int rightMode = 0) -> int - Adds a point to the curve. For each side, if the `*_mode` is `TANGENT_LINEAR`, the `*_tangent` angle (in degrees) uses the slope of the curve halfway to the adjacent point. Allows custom assignments to the `*_tangent` angle if `*_mode` is set to `TANGENT_FREE`.
- Bake() - Recomputes the baked cache of points for the curve.
- CleanDupes() - Removes duplicate points, i.e. points that are less than 0.00001 units (engine epsilon value) away from their neighbor on the curve.
- ClearPoints() - Removes all points from the curve.
- GetDomainRange() -> float - Returns the difference between `min_domain` and `max_domain`.
- GetPointLeftMode(int index) -> int - Returns the left `TangentMode` for the point at `index`.
- GetPointLeftTangent(int index) -> float - Returns the left tangent angle (in degrees) for the point at `index`.
- GetPointPosition(int index) -> Vector2 - Returns the curve coordinates for the point at `index`.
- GetPointRightMode(int index) -> int - Returns the right `TangentMode` for the point at `index`.
- GetPointRightTangent(int index) -> float - Returns the right tangent angle (in degrees) for the point at `index`.
- GetValueRange() -> float - Returns the difference between `min_value` and `max_value`.
- RemovePoint(int index) - Removes the point at `index` from the curve.
- Sample(float offset) -> float - Returns the Y value for the point that would exist at the X position `offset` along the curve.
- SampleBaked(float offset) -> float - Returns the Y value for the point that would exist at the X position `offset` along the curve using the baked cache. Bakes the curve's points if not already baked.
- SetPointLeftMode(int index, int mode) - Sets the left `TangentMode` for the point at `index` to `mode`.
- SetPointLeftTangent(int index, float tangent) - Sets the left tangent angle for the point at `index` to `tangent`.
- SetPointOffset(int index, float offset) -> int - Sets the offset from `0.5`.
- SetPointRightMode(int index, int mode) - Sets the right `TangentMode` for the point at `index` to `mode`.
- SetPointRightTangent(int index, float tangent) - Sets the right tangent angle for the point at `index` to `tangent`.
- SetPointValue(int index, float y) - Assigns the vertical position `y` to the point at `index`.

**Signals:**
- DomainChanged - Emitted when `max_domain` or `min_domain` is changed.
- RangeChanged - Emitted when `max_value` or `min_value` is changed.

**Enums:**
**TangentMode:** TANGENT_FREE=0, TANGENT_LINEAR=1, TANGENT_MODE_COUNT=2
  - TANGENT_FREE: The tangent on this side of the point is user-defined.
  - TANGENT_LINEAR: The curve calculates the tangent on this side of the point as the slope halfway towards the adjacent point.
  - TANGENT_MODE_COUNT: The total number of available tangent modes.

