## CollisionObject2D <- Node2D

Abstract base class for 2D physics objects. CollisionObject2D can hold any number of Shape2Ds for collision. Each shape must be assigned to a *shape owner*. Shape owners are not nodes and do not appear in the editor, but are accessible through code using the `shape_owner_*` methods. **Note:** Only collisions between objects within the same canvas (Viewport canvas or CanvasLayer) are supported. The behavior of collisions between objects in different canvases is undefined.

**Props:**
- CollisionLayer: int = 1
- CollisionMask: int = 1
- CollisionPriority: float = 1.0
- DisableMode: int (CollisionObject2D.DisableMode) = 0
- InputPickable: bool = true

- **collision_layer**: The physics layers this CollisionObject2D is in. Collision objects can exist in one or more of 32 different layers. See also `collision_mask`. **Note:** Object A can detect a contact with object B only if object B is in any of the layers that object A scans. See in the documentation for more information.
- **collision_mask**: The physics layers this CollisionObject2D scans. Collision objects can scan one or more of 32 different layers. See also `collision_layer`. **Note:** Object A can detect a contact with object B only if object B is in any of the layers that object A scans. See in the documentation for more information.
- **collision_priority**: The priority used to solve colliding when occurring penetration. The higher the priority is, the lower the penetration into the object will be. This can for example be used to prevent the player from breaking through the boundaries of a level.
- **disable_mode**: Defines the behavior in physics when `Node.process_mode` is set to `Node.PROCESS_MODE_DISABLED`.
- **input_pickable**: If `true`, this object is pickable. A pickable object can detect the mouse pointer entering/leaving, and if the mouse is inside it, report input events. Requires at least one `collision_layer` bit to be set.

**Methods:**
- InputEvent(Viewport viewport, InputEvent event, int shapeIdx) - Accepts unhandled InputEvents. `shape_idx` is the child index of the clicked Shape2D. Connect to `input_event` to easily pick up these events. **Note:** `_input_event` requires `input_pickable` to be `true` and at least one `collision_layer` bit to be set.
- MouseEnter() - Called when the mouse pointer enters any of this object's shapes. Requires `input_pickable` to be `true` and at least one `collision_layer` bit to be set. Note that moving between different shapes within a single CollisionObject2D won't cause this function to be called.
- MouseExit() - Called when the mouse pointer exits all this object's shapes. Requires `input_pickable` to be `true` and at least one `collision_layer` bit to be set. Note that moving between different shapes within a single CollisionObject2D won't cause this function to be called.
- MouseShapeEnter(int shapeIdx) - Called when the mouse pointer enters any of this object's shapes or moves from one shape to another. `shape_idx` is the child index of the newly entered Shape2D. Requires `input_pickable` to be `true` and at least one `collision_layer` bit to be called.
- MouseShapeExit(int shapeIdx) - Called when the mouse pointer exits any of this object's shapes. `shape_idx` is the child index of the exited Shape2D. Requires `input_pickable` to be `true` and at least one `collision_layer` bit to be called.
- CreateShapeOwner(Object owner) -> int - Creates a new shape owner for the given object. Returns `owner_id` of the new owner for future reference.
- GetCollisionLayerValue(int layerNumber) -> bool - Returns whether or not the specified layer of the `collision_layer` is enabled, given a `layer_number` between 1 and 32.
- GetCollisionMaskValue(int layerNumber) -> bool - Returns whether or not the specified layer of the `collision_mask` is enabled, given a `layer_number` between 1 and 32.
- GetRid() -> Rid - Returns the object's RID.
- GetShapeOwnerOneWayCollisionDirection(int ownerId) -> Vector2 - Returns the `one_way_collision_direction` of the shape owner identified by the given `owner_id`.
- GetShapeOwnerOneWayCollisionMargin(int ownerId) -> float - Returns the `one_way_collision_margin` of the shape owner identified by given `owner_id`.
- GetShapeOwners() -> int[] - Returns an Array of `owner_id` identifiers. You can use these ids in other methods that take `owner_id` as an argument.
- IsShapeOwnerDisabled(int ownerId) -> bool - If `true`, the shape owner and its shapes are disabled.
- IsShapeOwnerOneWayCollisionEnabled(int ownerId) -> bool - Returns `true` if collisions for the shape owner originating from this CollisionObject2D will not be reported to collided with CollisionObject2Ds.
- RemoveShapeOwner(int ownerId) - Removes the given shape owner.
- SetCollisionLayerValue(int layerNumber, bool value) - Based on `value`, enables or disables the specified layer in the `collision_layer`, given a `layer_number` between 1 and 32.
- SetCollisionMaskValue(int layerNumber, bool value) - Based on `value`, enables or disables the specified layer in the `collision_mask`, given a `layer_number` between 1 and 32.
- ShapeFindOwner(int shapeIndex) -> int - Returns the `owner_id` of the given shape.
- ShapeOwnerAddShape(int ownerId, Shape2D shape) - Adds a Shape2D to the shape owner.
- ShapeOwnerClearShapes(int ownerId) - Removes all shapes from the shape owner.
- ShapeOwnerGetOwner(int ownerId) -> Object - Returns the parent object of the given shape owner.
- ShapeOwnerGetShape(int ownerId, int shapeId) -> Shape2D - Returns the Shape2D with the given ID from the given shape owner.
- ShapeOwnerGetShapeCount(int ownerId) -> int - Returns the number of shapes the given shape owner contains.
- ShapeOwnerGetShapeIndex(int ownerId, int shapeId) -> int - Returns the child index of the Shape2D with the given ID from the given shape owner.
- ShapeOwnerGetTransform(int ownerId) -> Transform2D - Returns the shape owner's Transform2D.
- ShapeOwnerRemoveShape(int ownerId, int shapeId) - Removes a shape from the given shape owner.
- ShapeOwnerSetDisabled(int ownerId, bool disabled) - If `true`, disables the given shape owner.
- ShapeOwnerSetOneWayCollision(int ownerId, bool enable) - If `enable` is `true`, collisions for the shape owner originating from this CollisionObject2D will not be reported to collided with CollisionObject2Ds.
- ShapeOwnerSetOneWayCollisionDirection(int ownerId, Vector2 direction) - Sets the `one_way_collision_direction` of the shape owner identified by the given `owner_id` to `direction`.
- ShapeOwnerSetOneWayCollisionMargin(int ownerId, float margin) - Sets the `one_way_collision_margin` of the shape owner identified by given `owner_id` to `margin` pixels.
- ShapeOwnerSetTransform(int ownerId, Transform2D transform) - Sets the Transform2D of the given shape owner.

**Signals:**
- InputEvent(Node viewport, InputEvent event, int shapeIdx) - Emitted when an input event occurs. Requires `input_pickable` to be `true` and at least one `collision_layer` bit to be set. See `_input_event` for details.
- MouseEntered - Emitted when the mouse pointer enters any of this object's shapes. Requires `input_pickable` to be `true` and at least one `collision_layer` bit to be set. Note that moving between different shapes within a single CollisionObject2D won't cause this signal to be emitted. **Note:** Due to the lack of continuous collision detection, this signal may not be emitted in the expected order if the mouse moves fast enough and the CollisionObject2D's area is small. This signal may also not be emitted if another CollisionObject2D is overlapping the CollisionObject2D in question.
- MouseExited - Emitted when the mouse pointer exits all this object's shapes. Requires `input_pickable` to be `true` and at least one `collision_layer` bit to be set. Note that moving between different shapes within a single CollisionObject2D won't cause this signal to be emitted. **Note:** Due to the lack of continuous collision detection, this signal may not be emitted in the expected order if the mouse moves fast enough and the CollisionObject2D's area is small. This signal may also not be emitted if another CollisionObject2D is overlapping the CollisionObject2D in question.
- MouseShapeEntered(int shapeIdx) - Emitted when the mouse pointer enters any of this object's shapes or moves from one shape to another. `shape_idx` is the child index of the newly entered Shape2D. Requires `input_pickable` to be `true` and at least one `collision_layer` bit to be set.
- MouseShapeExited(int shapeIdx) - Emitted when the mouse pointer exits any of this object's shapes. `shape_idx` is the child index of the exited Shape2D. Requires `input_pickable` to be `true` and at least one `collision_layer` bit to be set.

**Enums:**
**DisableMode:** DISABLE_MODE_REMOVE=0, DISABLE_MODE_MAKE_STATIC=1, DISABLE_MODE_KEEP_ACTIVE=2
  - DISABLE_MODE_REMOVE: When `Node.process_mode` is set to `Node.PROCESS_MODE_DISABLED`, remove from the physics simulation to stop all physics interactions with this CollisionObject2D. Automatically re-added to the physics simulation when the Node is processed again.
  - DISABLE_MODE_MAKE_STATIC: When `Node.process_mode` is set to `Node.PROCESS_MODE_DISABLED`, make the body static. Doesn't affect Area2D. PhysicsBody2D can't be affected by forces or other bodies while static. Automatically set PhysicsBody2D back to its original mode when the Node is processed again.
  - DISABLE_MODE_KEEP_ACTIVE: When `Node.process_mode` is set to `Node.PROCESS_MODE_DISABLED`, do not affect the physics simulation.

