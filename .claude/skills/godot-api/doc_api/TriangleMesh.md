## TriangleMesh <- RefCounted

Creates a bounding volume hierarchy (BVH) tree structure around triangle geometry. The triangle BVH tree can be used for efficient intersection queries without involving a physics engine. For example, this can be used in editor tools to select objects with complex shapes based on the mouse cursor position. **Performance:** Creating the BVH tree for complex geometry is a slow process and best done in a background thread.

**Methods:**
- CreateFromFaces(Vector3[] faces) -> bool - Creates the BVH tree from an array of faces. Each 3 vertices of the input `faces` array represent one triangle (face). Returns `true` if the tree is successfully built, `false` otherwise.
- GetFaces() -> Vector3[] - Returns a copy of the geometry faces. Each 3 vertices of the array represent one triangle (face).
- IntersectRay(Vector3 begin, Vector3 dir) -> Godot.Collections.Dictionary - Tests for intersection with a ray starting at `begin` and facing `dir` and extending toward infinity. If an intersection with a triangle happens, returns a Dictionary with the following fields: `position`: The position on the intersected triangle. `normal`: The normal of the intersected triangle. `face_index`: The index of the intersected triangle. Returns an empty Dictionary if no intersection happens. See also `intersect_segment`, which is similar but uses a finite-length segment.
- IntersectSegment(Vector3 begin, Vector3 end) -> Godot.Collections.Dictionary - Tests for intersection with a segment going from `begin` to `end`. If an intersection with a triangle happens returns a Dictionary with the following fields: `position`: The position on the intersected triangle. `normal`: The normal of the intersected triangle. `face_index`: The index of the intersected triangle. Returns an empty Dictionary if no intersection happens. See also `intersect_ray`, which is similar but uses an infinite-length ray.

