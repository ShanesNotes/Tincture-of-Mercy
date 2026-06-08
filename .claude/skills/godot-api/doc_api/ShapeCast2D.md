## ShapeCast2D <- Node2D

Shape casting allows to detect collision objects by sweeping its `shape` along the cast direction determined by `target_position`. This is similar to RayCast2D, but it allows for sweeping a region of space, rather than just a straight line. ShapeCast2D can detect multiple collision objects. It is useful for things like wide laser beams or snapping a simple shape to a floor. Immediate collision overlaps can be done with the `target_position` set to `Vector2(0, 0)` and by calling `force_shapecast_update` within the same physics frame. This helps to overcome some limitations of Area2D when used as an instantaneous detection area, as collision information isn't immediately available to it. **Note:** Shape casting is more computationally expensive than ray casting.

**Props:**
- CollideWithAreas: bool = false
- CollideWithBodies: bool = true
- CollisionMask: int = 1
- CollisionResult: Godot.Collections.Array = []
- Enabled: bool = true
- ExcludeParent: bool = true
- Margin: float = 0.0
- MaxResults: int = 32
- Shape: Shape2D
- TargetPosition: Vector2 = Vector2(0, 50)

- **collide_with_areas**: If `true`, collisions with Area2Ds will be reported.
- **collide_with_bodies**: If `true`, collisions with PhysicsBody2Ds will be reported.
- **collision_mask**: The shape's collision mask. Only objects in at least one collision layer enabled in the mask will be detected. See in the documentation for more information.
- **collision_result**: Returns the complete collision information from the collision sweep. The data returned is the same as in the `PhysicsDirectSpaceState2D.get_rest_info` method.
- **enabled**: If `true`, collisions will be reported.
- **exclude_parent**: If `true`, the parent node will be excluded from collision detection.
- **margin**: The collision margin for the shape. A larger margin helps detecting collisions more consistently, at the cost of precision.
- **max_results**: The number of intersections can be limited with this parameter, to reduce the processing time.
- **shape**: The shape to be used for collision queries.
- **target_position**: The shape's destination point, relative to this node's `Node2D.position`.

**Methods:**
- AddException(CollisionObject2D node) - Adds a collision exception so the shape does not report collisions with the specified node.
- AddExceptionRid(Rid rid) - Adds a collision exception so the shape does not report collisions with the specified RID.
- ClearExceptions() - Removes all collision exceptions for this shape.
- ForceShapecastUpdate() - Updates the collision information for the shape immediately, without waiting for the next `_physics_process` call. Use this method, for example, when the shape or its parent has changed state. **Note:** Setting `enabled` to `true` is not required for this to work.
- GetClosestCollisionSafeFraction() -> float - Returns the fraction from this cast's origin to its `target_position` of how far the shape can move without triggering a collision, as a value between `0.0` and `1.0`.
- GetClosestCollisionUnsafeFraction() -> float - Returns the fraction from this cast's origin to its `target_position` of how far the shape must move to trigger a collision, as a value between `0.0` and `1.0`. In ideal conditions this would be the same as `get_closest_collision_safe_fraction`, however shape casting is calculated in discrete steps, so the precise point of collision can occur between two calculated positions.
- GetCollider(int index) -> Object - Returns the collided Object of one of the multiple collisions at `index`, or `null` if no object is intersecting the shape (i.e. `is_colliding` returns `false`).
- GetColliderRid(int index) -> Rid - Returns the RID of the collided object of one of the multiple collisions at `index`.
- GetColliderShape(int index) -> int - Returns the shape ID of the colliding shape of one of the multiple collisions at `index`, or `0` if no object is intersecting the shape (i.e. `is_colliding` returns `false`).
- GetCollisionCount() -> int - The number of collisions detected at the point of impact. Use this to iterate over multiple collisions as provided by `get_collider`, `get_collider_shape`, `get_collision_point`, and `get_collision_normal` methods.
- GetCollisionMaskValue(int layerNumber) -> bool - Returns whether or not the specified layer of the `collision_mask` is enabled, given a `layer_number` between 1 and 32.
- GetCollisionNormal(int index) -> Vector2 - Returns the normal of one of the multiple collisions at `index` of the intersecting object.
- GetCollisionPoint(int index) -> Vector2 - Returns the collision point of one of the multiple collisions at `index` where the shape intersects the colliding object. **Note:** This point is in the **global** coordinate system.
- IsColliding() -> bool - Returns whether any object is intersecting with the shape's vector (considering the vector length).
- RemoveException(CollisionObject2D node) - Removes a collision exception so the shape does report collisions with the specified node.
- RemoveExceptionRid(Rid rid) - Removes a collision exception so the shape does report collisions with the specified RID.
- SetCollisionMaskValue(int layerNumber, bool value) - Based on `value`, enables or disables the specified layer in the `collision_mask`, given a `layer_number` between 1 and 32.

