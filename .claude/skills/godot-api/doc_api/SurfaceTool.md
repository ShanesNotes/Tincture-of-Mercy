## SurfaceTool <- RefCounted

The SurfaceTool is used to construct a Mesh by specifying vertex attributes individually. It can be used to construct a Mesh from a script. All properties except indices need to be added before calling `add_vertex`. For example, to add vertex colors and UVs: The above SurfaceTool now contains one vertex of a triangle which has a UV coordinate and a specified Color. If another vertex were added without calling `set_uv` or `set_color`, then the last values would be used. Vertex attributes must be passed **before** calling `add_vertex`. Failure to do so will result in an error when committing the vertex information to a mesh. Additionally, the attributes used before the first vertex is added determine the format of the mesh. For example, if you only add UVs to the first vertex, you cannot add color to any of the subsequent vertices. See also ArrayMesh, ImmediateMesh and MeshDataTool for procedural geometry generation. **Note:** Godot uses clockwise for front faces of triangle primitive modes.

**Methods:**
- AddIndex(int index) - Adds a vertex to index array if you are using indexed vertices. Does not need to be called before adding vertices.
- AddTriangleFan(Vector3[] vertices, Vector2[] uvs = PackedVector2Array(), Color[] colors = PackedColorArray(), Vector2[] uv2s = PackedVector2Array(), Vector3[] normals = PackedVector3Array(), Plane[] tangents = []) - Inserts a triangle fan made of array data into Mesh being constructed. Requires the primitive type be set to `Mesh.PRIMITIVE_TRIANGLES`.
- AddVertex(Vector3 vertex) - Specifies the position of current vertex. Should be called after specifying other vertex properties (e.g. Color, UV).
- AppendFrom(Mesh existing, int surface, Transform3D transform) - Append vertices from a given Mesh surface onto the current vertex array with specified Transform3D.
- Begin(int primitive) - Called before adding any vertices. Takes the primitive type as an argument (e.g. `Mesh.PRIMITIVE_TRIANGLES`).
- Clear() - Clear all information passed into the surface tool so far.
- Commit(ArrayMesh existing = null, int flags = 0) -> ArrayMesh - Returns a constructed ArrayMesh from current information passed in. If an existing ArrayMesh is passed in as an argument, will add an extra surface to the existing ArrayMesh. The `flags` argument can be the bitwise OR of `Mesh.ARRAY_FLAG_USE_DYNAMIC_UPDATE`, `Mesh.ARRAY_FLAG_USE_8_BONE_WEIGHTS`, or `Mesh.ARRAY_FLAG_USES_EMPTY_VERTEX_ARRAY`.
- CommitToArrays() -> Godot.Collections.Array - Commits the data to the same format used by `ArrayMesh.add_surface_from_arrays`, `ImporterMesh.add_surface`, and `create_from_arrays`. This way you can further process the mesh data using the ArrayMesh or ImporterMesh APIs.
- CreateFrom(Mesh existing, int surface) - Creates a vertex array from an existing Mesh.
- CreateFromArrays(Godot.Collections.Array arrays, int primitiveType = 3) - Creates this SurfaceTool from existing vertex arrays such as returned by `commit_to_arrays`, `Mesh.surface_get_arrays`, `Mesh.surface_get_blend_shape_arrays`, `ImporterMesh.get_surface_arrays`, and `ImporterMesh.get_surface_blend_shape_arrays`. `primitive_type` controls the type of mesh data, defaulting to `Mesh.PRIMITIVE_TRIANGLES`.
- CreateFromBlendShape(Mesh existing, int surface, string blendShape) - Creates a vertex array from the specified blend shape of an existing Mesh. This can be used to extract a specific pose from a blend shape.
- Deindex() - Removes the index array by expanding the vertex array.
- GenerateLod(float ndThreshold, int targetIndexCount = 3) -> int[] - Generates an LOD for a given `nd_threshold` in linear units (square root of quadric error metric), using at most `target_index_count` indices.
- GenerateNormals(bool flip = false) - Generates normals from vertices so you do not have to do it manually. If `flip` is `true`, the resulting normals will be inverted. `generate_normals` should be called *after* generating geometry and *before* committing the mesh using `commit` or `commit_to_arrays`. For correct display of normal-mapped surfaces, you will also have to generate tangents using `generate_tangents`. **Note:** `generate_normals` only works if the primitive type is set to `Mesh.PRIMITIVE_TRIANGLES`. **Note:** `generate_normals` takes smooth groups into account. To generate smooth normals, set the smooth group to a value greater than or equal to `0` using `set_smooth_group` or leave the smooth group at the default of `0`. To generate flat normals, set the smooth group to `-1` using `set_smooth_group` prior to adding vertices.
- GenerateTangents() - Generates a tangent vector for each vertex. Requires that each vertex already has UVs and normals set (see `generate_normals`).
- GetAabb() -> Aabb - Returns the axis-aligned bounding box of the vertex positions.
- GetCustomFormat(int channelIndex) -> int - Returns the format for custom `channel_index` (currently up to 4). Returns `CUSTOM_MAX` if this custom channel is unused.
- GetPrimitiveType() -> int - Returns the type of mesh geometry, such as `Mesh.PRIMITIVE_TRIANGLES`.
- GetSkinWeightCount() -> int - By default, returns `SKIN_4_WEIGHTS` to indicate only 4 bone influences per vertex are used. Returns `SKIN_8_WEIGHTS` if up to 8 influences are used. **Note:** This function returns an enum, not the exact number of weights.
- Index() - Shrinks the vertex array by creating an index array. This can improve performance by avoiding vertex reuse.
- OptimizeIndicesForCache() - Optimizes triangle sorting for performance. Requires that `get_primitive_type` is `Mesh.PRIMITIVE_TRIANGLES`.
- SetBones(int[] bones) - Specifies an array of bones to use for the *next* vertex. `bones` must contain 4 integers.
- SetColor(Color color) - Specifies a Color to use for the *next* vertex. If every vertex needs to have this information set and you fail to submit it for the first vertex, this information may not be used at all. **Note:** The material must have `BaseMaterial3D.vertex_color_use_as_albedo` enabled for the vertex color to be visible.
- SetCustom(int channelIndex, Color customColor) - Sets the custom value on this vertex for `channel_index`. `set_custom_format` must be called first for this `channel_index`. Formats which are not RGBA will ignore other color channels.
- SetCustomFormat(int channelIndex, int format) - Sets the color format for this custom `channel_index`. Use `CUSTOM_MAX` to disable. Must be invoked after `begin` and should be set before `commit` or `commit_to_arrays`.
- SetMaterial(Material material) - Sets Material to be used by the Mesh you are constructing.
- SetNormal(Vector3 normal) - Specifies a normal to use for the *next* vertex. If every vertex needs to have this information set and you fail to submit it for the first vertex, this information may not be used at all.
- SetSkinWeightCount(int count) - Set to `SKIN_8_WEIGHTS` to indicate that up to 8 bone influences per vertex may be used. By default, only 4 bone influences are used (`SKIN_4_WEIGHTS`). **Note:** This function takes an enum, not the exact number of weights.
- SetSmoothGroup(int index) - Specifies the smooth group to use for the *next* vertex. If this is never called, all vertices will have the default smooth group of `0` and will be smoothed with adjacent vertices of the same group. To produce a mesh with flat normals, set the smooth group to `-1`. **Note:** This function actually takes a `uint32_t`, so C# users should use `uint32.MaxValue` instead of `-1` to produce a mesh with flat normals.
- SetTangent(Plane tangent) - Specifies a tangent to use for the *next* vertex. If every vertex needs to have this information set and you fail to submit it for the first vertex, this information may not be used at all. **Note:** Even though `tangent` is a Plane, it does not directly represent the tangent plane. Its `Plane.x`, `Plane.y`, and `Plane.z` represent the tangent vector and `Plane.d` should be either `-1` or `1`. See also `Mesh.ARRAY_TANGENT`.
- SetUv(Vector2 uv) - Specifies a set of UV coordinates to use for the *next* vertex. If every vertex needs to have this information set and you fail to submit it for the first vertex, this information may not be used at all.
- SetUv2(Vector2 uv2) - Specifies an optional second set of UV coordinates to use for the *next* vertex. If every vertex needs to have this information set and you fail to submit it for the first vertex, this information may not be used at all.
- SetWeights(float[] weights) - Specifies weight values to use for the *next* vertex. `weights` must contain 4 values. If every vertex needs to have this information set and you fail to submit it for the first vertex, this information may not be used at all.

**Enums:**
**CustomFormat:** CUSTOM_RGBA8_UNORM=0, CUSTOM_RGBA8_SNORM=1, CUSTOM_RG_HALF=2, CUSTOM_RGBA_HALF=3, CUSTOM_R_FLOAT=4, CUSTOM_RG_FLOAT=5, CUSTOM_RGB_FLOAT=6, CUSTOM_RGBA_FLOAT=7, CUSTOM_MAX=8
  - CUSTOM_RGBA8_UNORM: Limits range of data passed to `set_custom` to unsigned normalized 0 to 1 stored in 8 bits per channel. See `Mesh.ARRAY_CUSTOM_RGBA8_UNORM`.
  - CUSTOM_RGBA8_SNORM: Limits range of data passed to `set_custom` to signed normalized -1 to 1 stored in 8 bits per channel. See `Mesh.ARRAY_CUSTOM_RGBA8_SNORM`.
  - CUSTOM_RG_HALF: Stores data passed to `set_custom` as half precision floats, and uses only red and green color channels. See `Mesh.ARRAY_CUSTOM_RG_HALF`.
  - CUSTOM_RGBA_HALF: Stores data passed to `set_custom` as half precision floats and uses all color channels. See `Mesh.ARRAY_CUSTOM_RGBA_HALF`.
  - CUSTOM_R_FLOAT: Stores data passed to `set_custom` as full precision floats, and uses only red color channel. See `Mesh.ARRAY_CUSTOM_R_FLOAT`.
  - CUSTOM_RG_FLOAT: Stores data passed to `set_custom` as full precision floats, and uses only red and green color channels. See `Mesh.ARRAY_CUSTOM_RG_FLOAT`.
  - CUSTOM_RGB_FLOAT: Stores data passed to `set_custom` as full precision floats, and uses only red, green and blue color channels. See `Mesh.ARRAY_CUSTOM_RGB_FLOAT`.
  - CUSTOM_RGBA_FLOAT: Stores data passed to `set_custom` as full precision floats, and uses all color channels. See `Mesh.ARRAY_CUSTOM_RGBA_FLOAT`.
  - CUSTOM_MAX: Used to indicate a disabled custom channel.
**SkinWeightCount:** SKIN_4_WEIGHTS=0, SKIN_8_WEIGHTS=1
  - SKIN_4_WEIGHTS: Each individual vertex can be influenced by only 4 bone weights.
  - SKIN_8_WEIGHTS: Each individual vertex can be influenced by up to 8 bone weights.

