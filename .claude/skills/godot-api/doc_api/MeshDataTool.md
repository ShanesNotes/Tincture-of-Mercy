## MeshDataTool <- RefCounted

MeshDataTool provides access to individual vertices in a Mesh. It allows users to read and edit vertex data of meshes. It also creates an array of faces and edges. To use MeshDataTool, load a mesh with `create_from_surface`. When you are finished editing the data commit the data to a mesh with `commit_to_surface`. Below is an example of how MeshDataTool may be used. See also ArrayMesh, ImmediateMesh and SurfaceTool for procedural geometry generation. **Note:** Godot uses clockwise for front faces of triangle primitive modes.

**Methods:**
- Clear() - Clears all data currently in MeshDataTool.
- CommitToSurface(ArrayMesh mesh, int compressionFlags = 0) -> int - Adds a new surface to specified Mesh with edited data.
- CreateFromSurface(ArrayMesh mesh, int surface) -> int - Uses specified surface of given Mesh to populate data for MeshDataTool. Requires Mesh with primitive type `Mesh.PRIMITIVE_TRIANGLES`.
- GetEdgeCount() -> int - Returns the number of edges in this Mesh.
- GetEdgeFaces(int idx) -> int[] - Returns array of faces that touch given edge.
- GetEdgeMeta(int idx) -> Variant - Returns meta information assigned to given edge.
- GetEdgeVertex(int idx, int vertex) -> int - Returns the index of the specified `vertex` connected to the edge at index `idx`. `vertex` can only be `0` or `1`, as edges are composed of two vertices.
- GetFaceCount() -> int - Returns the number of faces in this Mesh.
- GetFaceEdge(int idx, int edge) -> int - Returns the edge associated with the face at index `idx`. `edge` argument must be either `0`, `1`, or `2` because a face only has three edges.
- GetFaceMeta(int idx) -> Variant - Returns the metadata associated with the given face.
- GetFaceNormal(int idx) -> Vector3 - Calculates and returns the face normal of the given face.
- GetFaceVertex(int idx, int vertex) -> int - Returns the specified vertex index of the given face. `vertex` must be either `0`, `1`, or `2` because faces contain three vertices.
- GetFormat() -> int - Returns the Mesh's format as a combination of the `Mesh.ArrayFormat` flags. For example, a mesh containing both vertices and normals would return a format of `3` because `Mesh.ARRAY_FORMAT_VERTEX` is `1` and `Mesh.ARRAY_FORMAT_NORMAL` is `2`.
- GetMaterial() -> Material - Returns the material assigned to the Mesh.
- GetVertex(int idx) -> Vector3 - Returns the position of the given vertex.
- GetVertexBones(int idx) -> int[] - Returns the bones of the given vertex.
- GetVertexColor(int idx) -> Color - Returns the color of the given vertex.
- GetVertexCount() -> int - Returns the total number of vertices in Mesh.
- GetVertexEdges(int idx) -> int[] - Returns an array of edges that share the given vertex.
- GetVertexFaces(int idx) -> int[] - Returns an array of faces that share the given vertex.
- GetVertexMeta(int idx) -> Variant - Returns the metadata associated with the given vertex.
- GetVertexNormal(int idx) -> Vector3 - Returns the normal of the given vertex.
- GetVertexTangent(int idx) -> Plane - Returns the tangent of the given vertex.
- GetVertexUv(int idx) -> Vector2 - Returns the UV of the given vertex.
- GetVertexUv2(int idx) -> Vector2 - Returns the UV2 of the given vertex.
- GetVertexWeights(int idx) -> float[] - Returns bone weights of the given vertex.
- SetEdgeMeta(int idx, Variant meta) - Sets the metadata of the given edge.
- SetFaceMeta(int idx, Variant meta) - Sets the metadata of the given face.
- SetMaterial(Material material) - Sets the material to be used by newly-constructed Mesh.
- SetVertex(int idx, Vector3 vertex) - Sets the position of the given vertex.
- SetVertexBones(int idx, int[] bones) - Sets the bones of the given vertex.
- SetVertexColor(int idx, Color color) - Sets the color of the given vertex.
- SetVertexMeta(int idx, Variant meta) - Sets the metadata associated with the given vertex.
- SetVertexNormal(int idx, Vector3 normal) - Sets the normal of the given vertex.
- SetVertexTangent(int idx, Plane tangent) - Sets the tangent of the given vertex. **Note:** Even though `tangent` is a Plane, it does not directly represent the tangent plane. Its `Plane.x`, `Plane.y`, and `Plane.z` represent the tangent vector and `Plane.d` should be either `-1` or `1`. See also `Mesh.ARRAY_TANGENT`.
- SetVertexUv(int idx, Vector2 uv) - Sets the UV of the given vertex.
- SetVertexUv2(int idx, Vector2 uv2) - Sets the UV2 of the given vertex.
- SetVertexWeights(int idx, float[] weights) - Sets the bone weights of the given vertex.

