## PhysicsDirectBodyState2D <- Object

Provides direct access to a physics body in the PhysicsServer2D, allowing safe changes to physics properties. This object is passed via the direct state callback of RigidBody2D, and is intended for changing the direct state of that body. See `RigidBody2D._integrate_forces`.

**Props:**
- AngularVelocity: float
- CenterOfMass: Vector2
- CenterOfMassLocal: Vector2
- CollisionLayer: int
- CollisionMask: int
- InverseInertia: float
- InverseMass: float
- LinearVelocity: Vector2
- Sleeping: bool
- Step: float
- TotalAngularDamp: float
- TotalGravity: Vector2
- TotalLinearDamp: float
- Transform: Transform2D

- **angular_velocity**: The body's rotational velocity in *radians* per second.
- **center_of_mass**: The body's center of mass position relative to the body's center in the global coordinate system.
- **center_of_mass_local**: The body's center of mass position in the body's local coordinate system.
- **collision_layer**: The body's collision layer.
- **collision_mask**: The body's collision mask.
- **inverse_inertia**: The inverse of the inertia of the body.
- **inverse_mass**: The inverse of the mass of the body.
- **linear_velocity**: The body's linear velocity in pixels per second.
- **sleeping**: If `true`, this body is currently sleeping (not active).
- **step**: The timestep (delta) used for the simulation.
- **total_angular_damp**: The rate at which the body stops rotating, if there are not any other forces moving it.
- **total_gravity**: The total gravity vector being currently applied to this body.
- **total_linear_damp**: The rate at which the body stops moving, if there are not any other forces moving it.
- **transform**: The body's transformation matrix.

**Methods:**
- AddConstantCentralForce(Vector2 force = Vector2(0, 0)) - Adds a constant directional force without affecting rotation that keeps being applied over time until cleared with `constant_force = Vector2(0, 0)`. This is equivalent to using `add_constant_force` at the body's center of mass.
- AddConstantForce(Vector2 force, Vector2 position = Vector2(0, 0)) - Adds a constant positioned force to the body that keeps being applied over time until cleared with `constant_force = Vector2(0, 0)`. `position` is the offset from the body origin in global coordinates.
- AddConstantTorque(float torque) - Adds a constant rotational force without affecting position that keeps being applied over time until cleared with `constant_torque = 0`.
- ApplyCentralForce(Vector2 force = Vector2(0, 0)) - Applies a directional force without affecting rotation. A force is time dependent and meant to be applied every physics update. This is equivalent to using `apply_force` at the body's center of mass.
- ApplyCentralImpulse(Vector2 impulse) - Applies a directional impulse without affecting rotation. An impulse is time-independent! Applying an impulse every frame would result in a framerate-dependent force. For this reason, it should only be used when simulating one-time impacts (use the "_force" functions otherwise). This is equivalent to using `apply_impulse` at the body's center of mass.
- ApplyForce(Vector2 force, Vector2 position = Vector2(0, 0)) - Applies a positioned force to the body. A force is time dependent and meant to be applied every physics update. `position` is the offset from the body origin in global coordinates.
- ApplyImpulse(Vector2 impulse, Vector2 position = Vector2(0, 0)) - Applies a positioned impulse to the body. An impulse is time-independent! Applying an impulse every frame would result in a framerate-dependent force. For this reason, it should only be used when simulating one-time impacts (use the "_force" functions otherwise). `position` is the offset from the body origin in global coordinates.
- ApplyTorque(float torque) - Applies a rotational force without affecting position. A force is time dependent and meant to be applied every physics update. **Note:** `inverse_inertia` is required for this to work. To have `inverse_inertia`, an active CollisionShape2D must be a child of the node, or you can manually set `inverse_inertia`.
- ApplyTorqueImpulse(float impulse) - Applies a rotational impulse to the body without affecting the position. An impulse is time-independent! Applying an impulse every frame would result in a framerate-dependent force. For this reason, it should only be used when simulating one-time impacts (use the "_force" functions otherwise). **Note:** `inverse_inertia` is required for this to work. To have `inverse_inertia`, an active CollisionShape2D must be a child of the node, or you can manually set `inverse_inertia`.
- GetConstantForce() -> Vector2 - Returns the body's total constant positional forces applied during each physics update. See `add_constant_force` and `add_constant_central_force`.
- GetConstantTorque() -> float - Returns the body's total constant rotational forces applied during each physics update. See `add_constant_torque`.
- GetContactCollider(int contactIdx) -> Rid - Returns the collider's RID.
- GetContactColliderId(int contactIdx) -> int - Returns the collider's object id.
- GetContactColliderObject(int contactIdx) -> Object - Returns the collider object. This depends on how it was created (will return a scene node if such was used to create it).
- GetContactColliderPosition(int contactIdx) -> Vector2 - Returns the position of the contact point on the collider in the global coordinate system.
- GetContactColliderShape(int contactIdx) -> int - Returns the collider's shape index.
- GetContactColliderVelocityAtPosition(int contactIdx) -> Vector2 - Returns the velocity vector at the collider's contact point.
- GetContactCount() -> int - Returns the number of contacts this body has with other bodies. **Note:** By default, this returns 0 unless bodies are configured to monitor contacts. See `RigidBody2D.contact_monitor`.
- GetContactImpulse(int contactIdx) -> Vector2 - Returns the impulse created by the contact.
- GetContactLocalNormal(int contactIdx) -> Vector2 - Returns the local normal at the contact point.
- GetContactLocalPosition(int contactIdx) -> Vector2 - Returns the position of the contact point on the body in the global coordinate system.
- GetContactLocalShape(int contactIdx) -> int - Returns the local shape index of the collision.
- GetContactLocalVelocityAtPosition(int contactIdx) -> Vector2 - Returns the velocity vector at the body's contact point.
- GetSpaceState() -> PhysicsDirectSpaceState2D - Returns the current state of the space, useful for queries.
- GetVelocityAtLocalPosition(Vector2 localPosition) -> Vector2 - Returns the body's velocity at the given relative position. `local_position` is the offset from the body origin in global coordinates.
- IntegrateForces() - Updates the body's linear and angular velocity by applying gravity and damping for the equivalent of one physics tick.
- SetConstantForce(Vector2 force) - Sets the body's total constant positional forces applied during each physics update. See `add_constant_force` and `add_constant_central_force`.
- SetConstantTorque(float torque) - Sets the body's total constant rotational forces applied during each physics update. See `add_constant_torque`.

