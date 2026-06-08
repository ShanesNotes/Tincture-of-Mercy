## Polygon2D <- Node2D

A Polygon2D is defined by a set of points. Each point is connected to the next, with the final point being connected to the first, resulting in a closed polygon. Polygon2Ds can be filled with color (solid or gradient) or filled with a given texture.

**Props:**
- Antialiased: bool = false
- Color: Color = Color(1, 1, 1, 1)
- InternalVertexCount: int = 0
- InvertBorder: float = 100.0
- InvertEnabled: bool = false
- Offset: Vector2 = Vector2(0, 0)
- Polygon: Vector2[] = PackedVector2Array()
- Polygons: Godot.Collections.Array = []
- Skeleton: NodePath = NodePath("")
- Texture: Texture2D
- TextureOffset: Vector2 = Vector2(0, 0)
- TextureRotation: float = 0.0
- TextureScale: Vector2 = Vector2(1, 1)
- Uv: Vector2[] = PackedVector2Array()
- VertexColors: Color[] = PackedColorArray()

- **antialiased**: If `true`, polygon edges will be anti-aliased.
- **color**: The polygon's fill color. If `texture` is set, it will be multiplied by this color. It will also be the default color for vertices not set in `vertex_colors`.
- **internal_vertex_count**: Number of internal vertices, used for UV mapping.
- **invert_border**: Added padding applied to the bounding box when `invert_enabled` is set to `true`. Setting this value too small may result in a "Bad Polygon" error.
- **invert_enabled**: If `true`, the polygon will be inverted, containing the area outside the defined points and extending to the `invert_border`.
- **offset**: The offset applied to each vertex.
- **polygon**: The polygon's list of vertices. The final point will be connected to the first.
- **polygons**: The list of polygons, in case more than one is being represented. Every individual polygon is stored as a PackedInt32Array where each [int] is an index to a point in `polygon`. If empty, this property will be ignored, and the resulting single polygon will be composed of all points in `polygon`, using the order they are stored in.
- **skeleton**: Path to a Skeleton2D node used for skeleton-based deformations of this polygon. If empty or invalid, skeletal deformations will not be used.
- **texture**: The polygon's fill texture. Use `uv` to set texture coordinates.
- **texture_offset**: Amount to offset the polygon's `texture`. If set to `Vector2(0, 0)`, the texture's origin (its top-left corner) will be placed at the polygon's position.
- **texture_rotation**: The texture's rotation in radians.
- **texture_scale**: Amount to multiply the `uv` coordinates when using `texture`. Larger values make the texture smaller, and vice versa.
- **uv**: Texture coordinates for each vertex of the polygon. There should be one UV value per polygon vertex. If there are fewer, undefined vertices will use `Vector2(0, 0)`.
- **vertex_colors**: Color for each vertex. Colors are interpolated between vertices, resulting in smooth gradients. There should be one per polygon vertex. If there are fewer, undefined vertices will use `color`.

**Methods:**
- AddBone(NodePath path, float[] weights) - Adds a bone with the specified `path` and `weights`.
- ClearBones() - Removes all bones from this Polygon2D.
- EraseBone(int index) - Removes the specified bone from this Polygon2D.
- GetBoneCount() -> int - Returns the number of bones in this Polygon2D.
- GetBonePath(int index) -> NodePath - Returns the path to the node associated with the specified bone.
- GetBoneWeights(int index) -> float[] - Returns the weight values of the specified bone.
- SetBonePath(int index, NodePath path) - Sets the path to the node associated with the specified bone.
- SetBoneWeights(int index, float[] weights) - Sets the weight values for the specified bone.

