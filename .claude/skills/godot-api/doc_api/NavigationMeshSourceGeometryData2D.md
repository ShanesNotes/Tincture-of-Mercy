## NavigationMeshSourceGeometryData2D <- Resource

Container for parsed source geometry data used in navigation mesh baking.

**Methods:**
- AddObstructionOutline(Vector2[] shapeOutline) - Adds the outline points of a shape as obstructed area.
- AddProjectedObstruction(Vector2[] vertices, bool carve) - Adds a projected obstruction shape to the source geometry. If `carve` is `true` the carved shape will not be affected by additional offsets (e.g. agent radius) of the navigation mesh baking process.
- AddTraversableOutline(Vector2[] shapeOutline) - Adds the outline points of a shape as traversable area.
- AppendObstructionOutlines(PackedVector2Array[] obstructionOutlines) - Appends another array of `obstruction_outlines` at the end of the existing obstruction outlines array.
- AppendTraversableOutlines(PackedVector2Array[] traversableOutlines) - Appends another array of `traversable_outlines` at the end of the existing traversable outlines array.
- Clear() - Clears the internal data.
- ClearProjectedObstructions() - Clears all projected obstructions.
- GetBounds() -> Rect2 - Returns an axis-aligned bounding box that covers all the stored geometry data. The bounds are calculated when calling this function with the result cached until further geometry changes are made.
- GetObstructionOutlines() -> PackedVector2Array[] - Returns all the obstructed area outlines arrays.
- GetProjectedObstructions() -> Godot.Collections.Array - Returns the projected obstructions as an Array of dictionaries. Each Dictionary contains the following entries: - `vertices` - A PackedFloat32Array that defines the outline points of the projected shape. - `carve` - A [bool] that defines how the projected shape affects the navigation mesh baking. If `true` the projected shape will not be affected by addition offsets, e.g. agent radius.
- GetTraversableOutlines() -> PackedVector2Array[] - Returns all the traversable area outlines arrays.
- HasData() -> bool - Returns `true` when parsed source geometry data exists.
- Merge(NavigationMeshSourceGeometryData2D otherGeometry) - Adds the geometry data of another NavigationMeshSourceGeometryData2D to the navigation mesh baking data.
- SetObstructionOutlines(PackedVector2Array[] obstructionOutlines) - Sets all the obstructed area outlines arrays.
- SetProjectedObstructions(Godot.Collections.Array projectedObstructions) - Sets the projected obstructions with an Array of Dictionaries with the following key value pairs:
- SetTraversableOutlines(PackedVector2Array[] traversableOutlines) - Sets all the traversable area outlines arrays.

