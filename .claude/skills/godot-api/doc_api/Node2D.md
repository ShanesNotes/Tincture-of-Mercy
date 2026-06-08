## Node2D <- CanvasItem

A 2D game object, with a transform (position, rotation, and scale). All 2D nodes, including physics objects and sprites, inherit from Node2D. Use Node2D as a parent node to move, scale and rotate children in a 2D project. Also gives control of the node's render order. **Note:** Since both Node2D and Control inherit from CanvasItem, they share several concepts from the class such as the `CanvasItem.z_index` and `CanvasItem.visible` properties.

**Props:**
- GlobalPosition: Vector2
- GlobalRotation: float
- GlobalRotationDegrees: float
- GlobalScale: Vector2
- GlobalSkew: float
- GlobalTransform: Transform2D
- Position: Vector2 = Vector2(0, 0)
- Rotation: float = 0.0
- RotationDegrees: float
- Scale: Vector2 = Vector2(1, 1)
- Skew: float = 0.0
- Transform: Transform2D

- **global_position**: Global position. See also `position`.
- **global_rotation**: Global rotation in radians. See also `rotation`.
- **global_rotation_degrees**: Helper property to access `global_rotation` in degrees instead of radians. See also `rotation_degrees`.
- **global_scale**: Global scale. See also `scale`.
- **global_skew**: Global skew in radians. See also `skew`.
- **global_transform**: Global Transform2D. See also `transform`.
- **position**: Position, relative to the node's parent. See also `global_position`.
- **rotation**: Rotation in radians, relative to the node's parent. See also `global_rotation`. **Note:** This property is edited in the inspector in degrees. If you want to use degrees in a script, use `rotation_degrees`.
- **rotation_degrees**: Helper property to access `rotation` in degrees instead of radians. See also `global_rotation_degrees`.
- **scale**: The node's scale, relative to the node's parent. Unscaled value: `(1, 1)`. See also `global_scale`. **Note:** Negative X scales in 2D are not decomposable from the transformation matrix. Due to the way scale is represented with transformation matrices in Godot, negative scales on the X axis will be changed to negative scales on the Y axis and a rotation of 180 degrees when decomposed.
- **skew**: If set to a non-zero value, slants the node in one direction or another. This can be used for pseudo-3D effects. See also `global_skew`. **Note:** Skew is performed on the X axis only, and *between* rotation and scaling. **Note:** This property is edited in the inspector in degrees. If you want to use degrees in a script, use `skew = deg_to_rad(value_in_degrees)`.
- **transform**: The node's Transform2D, relative to the node's parent. See also `global_transform`.

**Methods:**
- ApplyScale(Vector2 ratio) - Multiplies the current scale by the `ratio` vector.
- GetAngleTo(Vector2 point) -> float - Returns the angle between the node and the `point` in radians. See also `look_at`.
- GetRelativeTransformToParent(Node parent) -> Transform2D - Returns the Transform2D relative to this node's parent.
- GlobalTranslate(Vector2 offset) - Adds the `offset` vector to the node's global position.
- LookAt(Vector2 point) - Rotates the node so that its local +X axis points towards the `point`, which is expected to use global coordinates. This method is a combination of both `rotate` and `get_angle_to`. `point` should not be the same as the node's position, otherwise the node always looks to the right.
- MoveLocalX(float delta, bool scaled = false) - Applies a local translation on the node's X axis with the amount specified in `delta`. If `scaled` is `false`, normalizes the movement to occur independently of the node's `scale`.
- MoveLocalY(float delta, bool scaled = false) - Applies a local translation on the node's Y axis with the amount specified in `delta`. If `scaled` is `false`, normalizes the movement to occur independently of the node's `scale`.
- Rotate(float radians) - Applies a rotation to the node, in radians, starting from its current rotation. This is equivalent to `rotation += radians`.
- ToGlobal(Vector2 localPoint) -> Vector2 - Transforms the provided local position into a position in global coordinate space. The input is expected to be local relative to the Node2D it is called on. e.g. Applying this method to the positions of child nodes will correctly transform their positions into the global coordinate space, but applying it to a node's own position will give an incorrect result, as it will incorporate the node's own transformation into its global position.
- ToLocal(Vector2 globalPoint) -> Vector2 - Transforms the provided global position into a position in local coordinate space. The output will be local relative to the Node2D it is called on. e.g. It is appropriate for determining the positions of child nodes, but it is not appropriate for determining its own position relative to its parent.
- Translate(Vector2 offset) - Translates the node by the given `offset` in local coordinates. This is equivalent to `position += offset`.

