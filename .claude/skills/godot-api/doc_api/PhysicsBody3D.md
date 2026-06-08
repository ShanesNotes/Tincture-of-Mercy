## PhysicsBody3D <- CollisionObject3D

PhysicsBody3D is an abstract base class for 3D game objects affected by physics. All 3D physics bodies inherit from it. **Warning:** With a non-uniform scale, this node will likely not behave as expected. It is advised to keep its scale the same on all axes and adjust its collision shape(s) instead.

**Props:**
- AxisLockAngularX: bool = false
- AxisLockAngularY: bool = false
- AxisLockAngularZ: bool = false
- AxisLockLinearX: bool = false
- AxisLockLinearY: bool = false
- AxisLockLinearZ: bool = false

- **axis_lock_angular_x**: Lock the body's rotation in the X axis.
- **axis_lock_angular_y**: Lock the body's rotation in the Y axis.
- **axis_lock_angular_z**: Lock the body's rotation in the Z axis.
- **axis_lock_linear_x**: Lock the body's linear movement in the X axis.
- **axis_lock_linear_y**: Lock the body's linear movement in the Y axis.
- **axis_lock_linear_z**: Lock the body's linear movement in the Z axis.

**Methods:**
- AddCollisionExceptionWith(Node body) - Adds a body to the list of bodies that this body can't collide with.
- GetAxisLock(int axis) -> bool - Returns `true` if the specified linear or rotational `axis` is locked.
- GetCollisionExceptions() -> PhysicsBody3D[] - Returns an array of nodes that were added as collision exceptions for this body.
- GetGravity() -> Vector3 - Returns the gravity vector computed from all sources that can affect the body, including all gravity overrides from Area3D nodes and the global world gravity.
- MoveAndCollide(Vector3 motion, bool testOnly = false, float safeMargin = 0.001, bool recoveryAsCollision = false, int maxCollisions = 1) -> KinematicCollision3D - Moves the body along the vector `motion`. In order to be frame rate independent in `Node._physics_process` or `Node._process`, `motion` should be computed using `delta`. The body will stop if it collides. Returns a KinematicCollision3D, which contains information about the collision when stopped, or when touching another body along the motion. If `test_only` is `true`, the body does not move but the would-be collision information is given. `safe_margin` is the extra margin used for collision recovery (see `CharacterBody3D.safe_margin` for more details). If `recovery_as_collision` is `true`, any depenetration from the recovery phase is also reported as a collision; this is used e.g. by CharacterBody3D for improving floor detection during floor snapping. `max_collisions` allows to retrieve more than one collision result.
- RemoveCollisionExceptionWith(Node body) - Removes a body from the list of bodies that this body can't collide with.
- SetAxisLock(int axis, bool lock) - Locks or unlocks the specified linear or rotational `axis` depending on the value of `lock`.
- TestMove(Transform3D from, Vector3 motion, KinematicCollision3D collision = null, float safeMargin = 0.001, bool recoveryAsCollision = false, int maxCollisions = 1) -> bool - Checks for collisions without moving the body. In order to be frame rate independent in `Node._physics_process` or `Node._process`, `motion` should be computed using `delta`. Virtually sets the node's position, scale and rotation to that of the given Transform3D, then tries to move the body along the vector `motion`. Returns `true` if a collision would stop the body from moving along the whole path. `collision` is an optional object of type KinematicCollision3D, which contains additional information about the collision when stopped, or when touching another body along the motion. `safe_margin` is the extra margin used for collision recovery (see `CharacterBody3D.safe_margin` for more details). If `recovery_as_collision` is `true`, any depenetration from the recovery phase is also reported as a collision; this is useful for checking whether the body would *touch* any other bodies. `max_collisions` allows to retrieve more than one collision result.

