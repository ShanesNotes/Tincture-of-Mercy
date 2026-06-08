## Rect2

The Rect2 built-in Variant type represents an axis-aligned rectangle in a 2D space. It is defined by its `position` and `size`, which are Vector2. It is frequently used for fast overlap tests (see `intersects`). Although Rect2 itself is axis-aligned, it can be combined with Transform2D to represent a rotated or skewed rectangle. For integer coordinates, use Rect2i. The 3D equivalent to Rect2 is AABB. **Note:** Negative values for `size` are not supported. With negative size, most Rect2 methods do not work correctly. Use `abs` to get an equivalent Rect2 with a non-negative size. **Note:** In a boolean context, a Rect2 evaluates to `false` if both `position` and `size` are zero (equal to `Vector2.ZERO`). Otherwise, it always evaluates to `true`.

**Props:**
- End: Vector2 = Vector2(0, 0)
- Position: Vector2 = Vector2(0, 0)
- Size: Vector2 = Vector2(0, 0)

- **end**: The ending point. This is usually the bottom-right corner of the rectangle, and is equivalent to `position + size`. Setting this point affects the `size`.
- **position**: The origin point. This is usually the top-left corner of the rectangle.
- **size**: The rectangle's width and height, starting from `position`. Setting this value also affects the `end` point. **Note:** It's recommended setting the width and height to non-negative values, as most methods in Godot assume that the `position` is the top-left corner, and the `end` is the bottom-right corner. To get an equivalent rectangle with non-negative size, use `abs`.

**Methods:**
- Abs() -> Rect2 - Returns a Rect2 equivalent to this rectangle, with its width and height modified to be non-negative values, and with its `position` being the top-left corner of the rectangle. **Note:** It's recommended to use this method when `size` is negative, as most other methods in Godot assume that the `position` is the top-left corner, and the `end` is the bottom-right corner.
- Encloses(Rect2 b) -> bool - Returns `true` if this rectangle *completely* encloses the `b` rectangle.
- Expand(Vector2 to) -> Rect2 - Returns a copy of this rectangle expanded to align the edges with the given `to` point, if necessary.
- GetArea() -> float - Returns the rectangle's area. This is equivalent to `size.x * size.y`. See also `has_area`.
- GetCenter() -> Vector2 - Returns the center point of the rectangle. This is the same as `position + (size / 2.0)`.
- GetSupport(Vector2 direction) -> Vector2 - Returns the vertex's position of this rect that's the farthest in the given direction. This point is commonly known as the support point in collision detection algorithms.
- Grow(float amount) -> Rect2 - Returns a copy of this rectangle extended on all sides by the given `amount`. A negative `amount` shrinks the rectangle instead. See also `grow_individual` and `grow_side`.
- GrowIndividual(float left, float top, float right, float bottom) -> Rect2 - Returns a copy of this rectangle with its `left`, `top`, `right`, and `bottom` sides extended by the given amounts. Negative values shrink the sides, instead. See also `grow` and `grow_side`.
- GrowSide(int side, float amount) -> Rect2 - Returns a copy of this rectangle with its `side` extended by the given `amount` (see `Side` constants). A negative `amount` shrinks the rectangle, instead. See also `grow` and `grow_individual`.
- HasArea() -> bool - Returns `true` if this rectangle has positive width and height. See also `get_area`.
- HasPoint(Vector2 point) -> bool - Returns `true` if the rectangle contains the given `point`. By convention, points on the right and bottom edges are **not** included. **Note:** This method is not reliable for Rect2 with a *negative* `size`. Use `abs` first to get a valid rectangle.
- Intersection(Rect2 b) -> Rect2 - Returns the intersection between this rectangle and `b`. If the rectangles do not intersect, returns an empty Rect2. **Note:** If you only need to know whether two rectangles are overlapping, use `intersects`, instead.
- Intersects(Rect2 b, bool includeBorders = false) -> bool - Returns `true` if this rectangle overlaps with the `b` rectangle. The edges of both rectangles are excluded, unless `include_borders` is `true`.
- IsEqualApprox(Rect2 rect) -> bool - Returns `true` if this rectangle and `rect` are approximately equal, by calling `Vector2.is_equal_approx` on the `position` and the `size`.
- IsFinite() -> bool - Returns `true` if this rectangle's values are finite, by calling `Vector2.is_finite` on the `position` and the `size`.
- Merge(Rect2 b) -> Rect2 - Returns a Rect2 that encloses both this rectangle and `b` around the edges. See also `encloses`.

