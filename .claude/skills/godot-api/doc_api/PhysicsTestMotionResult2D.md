## PhysicsTestMotionResult2D <- RefCounted

Describes the motion and collision result from `PhysicsServer2D.body_test_motion`.

**Methods:**
- GetCollider() -> Object - Returns the colliding body's attached Object, if a collision occurred.
- GetColliderId() -> int - Returns the unique instance ID of the colliding body's attached Object, if a collision occurred. See `Object.get_instance_id`.
- GetColliderRid() -> Rid - Returns the colliding body's RID used by the PhysicsServer2D, if a collision occurred.
- GetColliderShape() -> int - Returns the colliding body's shape index, if a collision occurred. See CollisionObject2D.
- GetColliderVelocity() -> Vector2 - Returns the colliding body's velocity, if a collision occurred.
- GetCollisionDepth() -> float - Returns the length of overlap along the collision normal, if a collision occurred.
- GetCollisionLocalShape() -> int - Returns the moving object's colliding shape, if a collision occurred.
- GetCollisionNormal() -> Vector2 - Returns the colliding body's shape's normal at the point of collision, if a collision occurred.
- GetCollisionPoint() -> Vector2 - Returns the point of collision in global coordinates, if a collision occurred.
- GetCollisionSafeFraction() -> float - Returns the maximum fraction of the motion that can occur without a collision, between `0` and `1`.
- GetCollisionUnsafeFraction() -> float - Returns the minimum fraction of the motion needed to collide, if a collision occurred, between `0` and `1`.
- GetRemainder() -> Vector2 - Returns the moving object's remaining movement vector.
- GetTravel() -> Vector2 - Returns the moving object's travel before collision.

