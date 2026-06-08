## Rect2i

The Rect2i built-in Variant type represents an axis-aligned rectangle in a 2D space, using integer coordinates. It is defined by its `position` and `size`, which are Vector2i. Because it does not rotate, it is frequently used for fast overlap tests (see `intersects`). For floating-point coordinates, see Rect2. **Note:** Negative values for `size` are not supported. With negative size, most Rect2i methods do not work correctly. Use `abs` to get an equivalent Rect2i with a non-negative size. **Note:** In a boolean context, a Rect2i evaluates to `false` if both `position` and `size` are zero (equal to `Vector2i.ZERO`). Otherwise, it always evaluates to `true`.

**Props:**
- End: Vector2i = Vector2i(0, 0)
- Position: Vector2i = Vector2i(0, 0)
- Size: Vector2i = Vector2i(0, 0)

- **end**: The ending point. This is usually the bottom-right corner of the rectangle, and is equivalent to `position + size`. Setting this point affects the `size`.
- **position**: The origin point. This is usually the top-left corner of the rectangle.
- **size**: The rectangle's width and height, starting from `position`. Setting this value also affects the `end` point. **Note:** It's recommended setting the width and height to non-negative values, as most methods in Godot assume that the `position` is the top-left corner, and the `end` is the bottom-right corner. To get an equivalent rectangle with non-negative size, use `abs`.

**Methods:**
- Abs() -> Rect2i - Returns a Rect2i equivalent to this rectangle, with its width and height modified to be non-negative values, and with its `position` being the top-left corner of the rectangle. **Note:** It's recommended to use this method when `size` is negative, as most other methods in Godot assume that the `position` is the top-left corner, and the `end` is the bottom-right corner.
- Encloses(Rect2i b) -> bool - Returns `true` if this Rect2i completely encloses another one.
- Expand(Vector2i to) -> Rect2i - Returns a copy of this rectangle expanded to align the edges with the given `to` point, if necessary.
- GetArea() -> int - Returns the rectangle's area. This is equivalent to `size.x * size.y`. See also `has_area`.
- GetCenter() -> Vector2i - Returns the center point of the rectangle. This is the same as `position + (size / 2)`. **Note:** If the `size` is odd, the result will be rounded towards `position`.
- Grow(int amount) -> Rect2i - Returns a copy of this rectangle extended on all sides by the given `amount`. A negative `amount` shrinks the rectangle instead. See also `grow_individual` and `grow_side`.
- GrowIndividual(int left, int top, int right, int bottom) -> Rect2i - Returns a copy of this rectangle with its `left`, `top`, `right`, and `bottom` sides extended by the given amounts. Negative values shrink the sides, instead. See also `grow` and `grow_side`.
- GrowSide(int side, int amount) -> Rect2i - Returns a copy of this rectangle with its `side` extended by the given `amount` (see `Side` constants). A negative `amount` shrinks the rectangle, instead. See also `grow` and `grow_individual`.
- HasArea() -> bool - Returns `true` if this rectangle has positive width and height. See also `get_area`.
- HasPoint(Vector2i point) -> bool - Returns `true` if the rectangle contains the given `point`. By convention, points on the right and bottom edges are **not** included. **Note:** This method is not reliable for Rect2i with a *negative* `size`. Use `abs` first to get a valid rectangle.
- Intersection(Rect2i b) -> Rect2i - Returns the intersection between this rectangle and `b`. If the rectangles do not intersect, returns an empty Rect2i. **Note:** If you only need to know whether two rectangles are overlapping, use `intersects`, instead.
- Intersects(Rect2i b) -> bool - Returns `true` if this rectangle overlaps with the `b` rectangle. The edges of both rectangles are excluded.
- Merge(Rect2i b) -> Rect2i - Returns a Rect2i that encloses both this rectangle and `b` around the edges. See also `encloses`.

