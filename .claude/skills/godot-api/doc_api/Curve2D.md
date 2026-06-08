## Curve2D <- Resource

This class describes a Bézier curve in 2D space. It is mainly used to give a shape to a Path2D, but can be manually sampled for other purposes. It keeps a cache of precalculated points along the curve, to speed up further calculations.

**Props:**
- BakeInterval: float = 5.0
- PointCount: int = 0
- Point{index}/in: Vector2 = Vector2(0, 0)
- Point{index}/out: Vector2 = Vector2(0, 0)
- Point{index}/position: Vector2 = Vector2(0, 0)

- **bake_interval**: The distance in pixels between two adjacent cached points. Changing it forces the cache to be recomputed the next time the `get_baked_points` or `get_baked_length` function is called. The smaller the distance, the more points in the cache and the more memory it will consume, so use with care.
- **point_count**: The number of points describing the curve.
- **point_{index}/in**: The position of the control point leading to the vertex at `index`. **Note:** `index` is a value in the `0 .. point_count - 1` range.
- **point_{index}/out**: The position of the control point leading out of the vertex at `index`. **Note:** `index` is a value in the `0 .. point_count - 1` range.
- **point_{index}/position**: The position of for the vertex at `index`. **Note:** `index` is a value in the `0 .. point_count - 1` range.

**Methods:**
- AddPoint(Vector2 position, Vector2 in = Vector2(0, 0), Vector2 out = Vector2(0, 0), int index = -1) - Adds a point with the specified `position` relative to the curve's own position, with control points `in` and `out`. Appends the new point at the end of the point list. If `index` is given, the new point is inserted before the existing point identified by index `index`. Every existing point starting from `index` is shifted further down the list of points. The index must be greater than or equal to `0` and must not exceed the number of existing points in the line. See `point_count`.
- ClearPoints() - Removes all points from the curve.
- GetBakedLength() -> float - Returns the total length of the curve, based on the cached points. Given enough density (see `bake_interval`), it should be approximate enough.
- GetBakedPoints() -> Vector2[] - Returns the cache of points as a PackedVector2Array.
- GetClosestOffset(Vector2 toPoint) -> float - Returns the closest offset to `to_point`. This offset is meant to be used in `sample_baked`. `to_point` must be in this curve's local space.
- GetClosestPoint(Vector2 toPoint) -> Vector2 - Returns the closest point on baked segments (in curve's local space) to `to_point`. `to_point` must be in this curve's local space.
- GetPointIn(int idx) -> Vector2 - Returns the position of the control point leading to the vertex `idx`. The returned position is relative to the vertex `idx`. If the index is out of bounds, the function sends an error to the console, and returns `(0, 0)`.
- GetPointOut(int idx) -> Vector2 - Returns the position of the control point leading out of the vertex `idx`. The returned position is relative to the vertex `idx`. If the index is out of bounds, the function sends an error to the console, and returns `(0, 0)`.
- GetPointPosition(int idx) -> Vector2 - Returns the position of the vertex `idx`. If the index is out of bounds, the function sends an error to the console, and returns `(0, 0)`.
- RemovePoint(int idx) - Deletes the point `idx` from the curve. Sends an error to the console if `idx` is out of bounds.
- Sample(int idx, float t) -> Vector2 - Returns the position between the vertex `idx` and the vertex `idx + 1`, where `t` controls if the point is the first vertex (`t = 0.0`), the last vertex (`t = 1.0`), or in between. Values of `t` outside the range (`0.0 <= t <= 1.0`) give strange, but predictable results. If `idx` is out of bounds it is truncated to the first or last vertex, and `t` is ignored. If the curve has no points, the function sends an error to the console, and returns `(0, 0)`.
- SampleBaked(float offset = 0.0, bool cubic = false) -> Vector2 - Returns a point within the curve at position `offset`, where `offset` is measured as a pixel distance along the curve. To do that, it finds the two cached points where the `offset` lies between, then interpolates the values. This interpolation is cubic if `cubic` is set to `true`, or linear if set to `false`. Cubic interpolation tends to follow the curves better, but linear is faster (and often, precise enough).
- SampleBakedWithRotation(float offset = 0.0, bool cubic = false) -> Transform2D - Similar to `sample_baked`, but returns Transform2D that includes a rotation along the curve, with `Transform2D.origin` as the point position and the `Transform2D.x` vector pointing in the direction of the path at that point. Returns an empty transform if the length of the curve is `0`.
- Samplef(float fofs) -> Vector2 - Returns the position at the vertex `fofs`. It calls `sample` using the integer part of `fofs` as `idx`, and its fractional part as `t`.
- SetPointIn(int idx, Vector2 position) - Sets the position of the control point leading to the vertex `idx`. If the index is out of bounds, the function sends an error to the console. The position is relative to the vertex.
- SetPointOut(int idx, Vector2 position) - Sets the position of the control point leading out of the vertex `idx`. If the index is out of bounds, the function sends an error to the console. The position is relative to the vertex.
- SetPointPosition(int idx, Vector2 position) - Sets the position for the vertex `idx`. If the index is out of bounds, the function sends an error to the console.
- Tessellate(int maxStages = 5, float toleranceDegrees = 4) -> Vector2[] - Returns a list of points along the curve, with a curvature controlled point density. That is, the curvier parts will have more points than the straighter parts. This approximation makes straight segments between each point, then subdivides those segments until the resulting shape is similar enough. `max_stages` controls how many subdivisions a curve segment may face before it is considered approximate enough. Each subdivision splits the segment in half, so the default 5 stages may mean up to 32 subdivisions per curve segment. Increase with care! `tolerance_degrees` controls how many degrees the midpoint of a segment may deviate from the real curve, before the segment has to be subdivided.
- TessellateEvenLength(int maxStages = 5, float toleranceLength = 20.0) -> Vector2[] - Returns a list of points along the curve, with almost uniform density. `max_stages` controls how many subdivisions a curve segment may face before it is considered approximate enough. Each subdivision splits the segment in half, so the default 5 stages may mean up to 32 subdivisions per curve segment. Increase with care! `tolerance_length` controls the maximal distance between two neighboring points, before the segment has to be subdivided.

