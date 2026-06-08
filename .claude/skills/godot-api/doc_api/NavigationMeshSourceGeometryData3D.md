## NavigationMeshSourceGeometryData3D <- Resource

Container for parsed source geometry data used in navigation mesh baking.

**Methods:**
- AddFaces(Vector3[] faces, Transform3D xform) - Adds an array of vertex positions to the geometry data for navigation mesh baking to form triangulated faces. For each face the array must have three vertex positions in clockwise winding order. Since NavigationMesh resources have no transform, all vertex positions need to be offset by the node's transform using `xform`.
- AddMesh(Mesh mesh, Transform3D xform) - Adds the geometry data of a Mesh resource to the navigation mesh baking data. The mesh must have valid triangulated mesh data to be considered. Since NavigationMesh resources have no transform, all vertex positions need to be offset by the node's transform using `xform`.
- AddMeshArray(Godot.Collections.Array meshArray, Transform3D xform) - Adds an Array the size of `Mesh.ARRAY_MAX` and with vertices at index `Mesh.ARRAY_VERTEX` and indices at index `Mesh.ARRAY_INDEX` to the navigation mesh baking data. The array must have valid triangulated mesh data to be considered. Since NavigationMesh resources have no transform, all vertex positions need to be offset by the node's transform using `xform`.
- AddProjectedObstruction(Vector3[] vertices, float elevation, float height, bool carve) - Adds a projected obstruction shape to the source geometry. The `vertices` are considered projected on an xz-axes plane, placed at the global y-axis `elevation` and extruded by `height`. If `carve` is `true` the carved shape will not be affected by additional offsets (e.g. agent radius) of the navigation mesh baking process.
- AppendArrays(float[] vertices, int[] indices) - Appends arrays of `vertices` and `indices` at the end of the existing arrays. Adds the existing index as an offset to the appended indices.
- Clear() - Clears the internal data.
- ClearProjectedObstructions() - Clears all projected obstructions.
- GetBounds() -> Aabb - Returns an axis-aligned bounding box that covers all the stored geometry data. The bounds are calculated when calling this function with the result cached until further geometry changes are made.
- GetIndices() -> int[] - Returns the parsed source geometry data indices array.
- GetProjectedObstructions() -> Godot.Collections.Array - Returns the projected obstructions as an Array of dictionaries. Each Dictionary contains the following entries: - `vertices` - A PackedFloat32Array that defines the outline points of the projected shape. - `elevation` - A [float] that defines the projected shape placement on the y-axis. - `height` - A [float] that defines how much the projected shape is extruded along the y-axis. - `carve` - A [bool] that defines how the obstacle affects the navigation mesh baking. If `true` the projected shape will not be affected by addition offsets, e.g. agent radius.
- GetVertices() -> float[] - Returns the parsed source geometry data vertices array.
- HasData() -> bool - Returns `true` when parsed source geometry data exists.
- Merge(NavigationMeshSourceGeometryData3D otherGeometry) - Adds the geometry data of another NavigationMeshSourceGeometryData3D to the navigation mesh baking data.
- SetIndices(int[] indices) - Sets the parsed source geometry data indices. The indices need to be matched with appropriated vertices. **Warning:** Inappropriate data can crash the baking process of the involved third-party libraries.
- SetProjectedObstructions(Godot.Collections.Array projectedObstructions) - Sets the projected obstructions with an Array of Dictionaries with the following key value pairs:
- SetVertices(float[] vertices) - Sets the parsed source geometry data vertices. The vertices need to be matched with appropriated indices. **Warning:** Inappropriate data can crash the baking process of the involved third-party libraries.

