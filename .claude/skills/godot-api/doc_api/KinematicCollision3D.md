## KinematicCollision3D <- RefCounted

Holds collision data from the movement of a PhysicsBody3D, usually from `PhysicsBody3D.move_and_collide`. When a PhysicsBody3D is moved, it stops if it detects a collision with another body. If a collision is detected, a KinematicCollision3D object is returned. The collision data includes the colliding object, the remaining motion, and the collision position. This data can be used to determine a custom response to the collision.

**Methods:**
- GetAngle(int collisionIndex = 0, Vector3 upDirection = Vector3(0, 1, 0)) -> float - Returns the collision angle according to `up_direction`, which is `Vector3.UP` by default. This value is always positive.
- GetCollider(int collisionIndex = 0) -> Object - Returns the colliding body's attached Object given a collision index (the deepest collision by default).
- GetColliderId(int collisionIndex = 0) -> int - Returns the unique instance ID of the colliding body's attached Object given a collision index (the deepest collision by default). See `Object.get_instance_id`.
- GetColliderRid(int collisionIndex = 0) -> Rid - Returns the colliding body's RID used by the PhysicsServer3D given a collision index (the deepest collision by default).
- GetColliderShape(int collisionIndex = 0) -> Object - Returns the colliding body's shape given a collision index (the deepest collision by default).
- GetColliderShapeIndex(int collisionIndex = 0) -> int - Returns the colliding body's shape index given a collision index (the deepest collision by default). See CollisionObject3D.
- GetColliderVelocity(int collisionIndex = 0) -> Vector3 - Returns the colliding body's velocity given a collision index (the deepest collision by default).
- GetCollisionCount() -> int - Returns the number of detected collisions.
- GetDepth() -> float - Returns the colliding body's length of overlap along the collision normal.
- GetLocalShape(int collisionIndex = 0) -> Object - Returns the moving object's colliding shape given a collision index (the deepest collision by default).
- GetNormal(int collisionIndex = 0) -> Vector3 - Returns the colliding body's shape's normal at the point of collision given a collision index (the deepest collision by default).
- GetPosition(int collisionIndex = 0) -> Vector3 - Returns the point of collision in global coordinates given a collision index (the deepest collision by default).
- GetRemainder() -> Vector3 - Returns the moving object's remaining movement vector.
- GetTravel() -> Vector3 - Returns the moving object's travel before collision.

