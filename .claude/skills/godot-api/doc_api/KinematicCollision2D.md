## KinematicCollision2D <- RefCounted

Holds collision data from the movement of a PhysicsBody2D, usually from `PhysicsBody2D.move_and_collide`. When a PhysicsBody2D is moved, it stops if it detects a collision with another body. If a collision is detected, a KinematicCollision2D object is returned. The collision data includes the colliding object, the remaining motion, and the collision position. This data can be used to determine a custom response to the collision.

**Methods:**
- GetAngle(Vector2 upDirection = Vector2(0, -1)) -> float - Returns the collision angle according to `up_direction`, which is `Vector2.UP` by default. This value is always positive.
- GetCollider() -> Object - Returns the colliding body's attached Object.
- GetColliderId() -> int - Returns the unique instance ID of the colliding body's attached Object. See `Object.get_instance_id`.
- GetColliderRid() -> Rid - Returns the colliding body's RID used by the PhysicsServer2D.
- GetColliderShape() -> Object - Returns the colliding body's shape.
- GetColliderShapeIndex() -> int - Returns the colliding body's shape index. See CollisionObject2D.
- GetColliderVelocity() -> Vector2 - Returns the colliding body's velocity.
- GetDepth() -> float - Returns the colliding body's length of overlap along the collision normal.
- GetLocalShape() -> Object - Returns the moving object's colliding shape.
- GetNormal() -> Vector2 - Returns the colliding body's shape's normal at the point of collision.
- GetPosition() -> Vector2 - Returns the point of collision in global coordinates.
- GetRemainder() -> Vector2 - Returns the moving object's remaining movement vector.
- GetTravel() -> Vector2 - Returns the moving object's travel before collision.

