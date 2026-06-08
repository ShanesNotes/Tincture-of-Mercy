## ImmediateMesh <- Mesh

A mesh type optimized for creating geometry manually, similar to OpenGL 1.x immediate mode. Here's a sample on how to generate a triangular face: **Note:** Generating complex geometries with ImmediateMesh is highly inefficient. Instead, it is designed to generate simple geometry that changes often.

**Methods:**
- ClearSurfaces() - Clear all surfaces.
- SurfaceAddVertex(Vector3 vertex) - Add a 3D vertex using the current attributes previously set.
- SurfaceAddVertex2d(Vector2 vertex) - Add a 2D vertex using the current attributes previously set.
- SurfaceBegin(int primitive, Material material = null) - Begin a new surface.
- SurfaceEnd() - End and commit current surface. Note that surface being created will not be visible until this function is called.
- SurfaceSetColor(Color color) - Set the color attribute that will be pushed with the next vertex.
- SurfaceSetNormal(Vector3 normal) - Set the normal attribute that will be pushed with the next vertex.
- SurfaceSetTangent(Plane tangent) - Set the tangent attribute that will be pushed with the next vertex. **Note:** Even though `tangent` is a Plane, it does not directly represent the tangent plane. Its `Plane.x`, `Plane.y`, and `Plane.z` represent the tangent vector and `Plane.d` should be either `-1` or `1`. See also `Mesh.ARRAY_TANGENT`.
- SurfaceSetUv(Vector2 uv) - Set the UV attribute that will be pushed with the next vertex.
- SurfaceSetUv2(Vector2 uv2) - Set the UV2 attribute that will be pushed with the next vertex.

