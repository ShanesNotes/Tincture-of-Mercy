## PhysicsTestMotionResult3D <- RefCounted

Describes the motion and collision result from `PhysicsServer3D.body_test_motion`.

**Methods:**
- GetCollider(int collisionIndex = 0) -> Object - Returns the colliding body's attached Object given a collision index (the deepest collision by default), if a collision occurred.
- GetColliderId(int collisionIndex = 0) -> int - Returns the unique instance ID of the colliding body's attached Object given a collision index (the deepest collision by default), if a collision occurred. See `Object.get_instance_id`.
- GetColliderRid(int collisionIndex = 0) -> Rid - Returns the colliding body's RID used by the PhysicsServer3D given a collision index (the deepest collision by default), if a collision occurred.
- GetColliderShape(int collisionIndex = 0) -> int - Returns the colliding body's shape index given a collision index (the deepest collision by default), if a collision occurred. See CollisionObject3D.
- GetColliderVelocity(int collisionIndex = 0) -> Vector3 - Returns the colliding body's velocity given a collision index (the deepest collision by default), if a collision occurred.
- GetCollisionCount() -> int - Returns the number of detected collisions.
- GetCollisionDepth(int collisionIndex = 0) -> float - Returns the length of overlap along the collision normal given a collision index (the deepest collision by default), if a collision occurred.
- GetCollisionLocalShape(int collisionIndex = 0) -> int - Returns the moving object's colliding shape given a collision index (the deepest collision by default), if a collision occurred.
- GetCollisionNormal(int collisionIndex = 0) -> Vector3 - Returns the colliding body's shape's normal at the point of collision given a collision index (the deepest collision by default), if a collision occurred.
- GetCollisionPoint(int collisionIndex = 0) -> Vector3 - Returns the point of collision in global coordinates given a collision index (the deepest collision by default), if a collision occurred.
- GetCollisionSafeFraction() -> float - Returns the maximum fraction of the motion that can occur without a collision, between `0` and `1`.
- GetCollisionUnsafeFraction() -> float - Returns the minimum fraction of the motion needed to collide, if a collision occurred, between `0` and `1`.
- GetRemainder() -> Vector3 - Returns the moving object's remaining movement vector.
- GetTravel() -> Vector3 - Returns the moving object's travel before collision.

