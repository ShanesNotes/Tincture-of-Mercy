## PhysicsDirectBodyState3D <- Object

Provides direct access to a physics body in the PhysicsServer3D, allowing safe changes to physics properties. This object is passed via the direct state callback of RigidBody3D, and is intended for changing the direct state of that body. See `RigidBody3D._integrate_forces`.

**Props:**
- AngularVelocity: Vector3
- CenterOfMass: Vector3
- CenterOfMassLocal: Vector3
- CollisionLayer: int
- CollisionMask: int
- InverseInertia: Vector3
- InverseInertiaTensor: Basis
- InverseMass: float
- LinearVelocity: Vector3
- PrincipalInertiaAxes: Basis
- Sleeping: bool
- Step: float
- TotalAngularDamp: float
- TotalGravity: Vector3
- TotalLinearDamp: float
- Transform: Transform3D

- **angular_velocity**: The body's rotational velocity in *radians* per second.
- **center_of_mass**: The body's center of mass position relative to the body's center in the global coordinate system.
- **center_of_mass_local**: The body's center of mass position in the body's local coordinate system.
- **collision_layer**: The body's collision layer.
- **collision_mask**: The body's collision mask.
- **inverse_inertia**: The inverse of the inertia of the body.
- **inverse_inertia_tensor**: The inverse of the inertia tensor of the body.
- **inverse_mass**: The inverse of the mass of the body.
- **linear_velocity**: The body's linear velocity in units per second.
- **sleeping**: If `true`, this body is currently sleeping (not active).
- **step**: The timestep (delta) used for the simulation.
- **total_angular_damp**: The rate at which the body stops rotating, if there are not any other forces moving it.
- **total_gravity**: The total gravity vector being currently applied to this body.
- **total_linear_damp**: The rate at which the body stops moving, if there are not any other forces moving it.
- **transform**: The body's transformation matrix.

**Methods:**
- AddConstantCentralForce(Vector3 force = Vector3(0, 0, 0)) - Adds a constant directional force without affecting rotation that keeps being applied over time until cleared with `constant_force = Vector3(0, 0, 0)`. This is equivalent to using `add_constant_force` at the body's center of mass.
- AddConstantForce(Vector3 force, Vector3 position = Vector3(0, 0, 0)) - Adds a constant positioned force to the body that keeps being applied over time until cleared with `constant_force = Vector3(0, 0, 0)`. `position` is the offset from the body origin in global coordinates.
- AddConstantTorque(Vector3 torque) - Adds a constant rotational force without affecting position that keeps being applied over time until cleared with `constant_torque = Vector3(0, 0, 0)`.
- ApplyCentralForce(Vector3 force = Vector3(0, 0, 0)) - Applies a directional force without affecting rotation. A force is time dependent and meant to be applied every physics update. This is equivalent to using `apply_force` at the body's center of mass.
- ApplyCentralImpulse(Vector3 impulse = Vector3(0, 0, 0)) - Applies a directional impulse without affecting rotation. An impulse is time-independent! Applying an impulse every frame would result in a framerate-dependent force. For this reason, it should only be used when simulating one-time impacts (use the "_force" functions otherwise). This is equivalent to using `apply_impulse` at the body's center of mass.
- ApplyForce(Vector3 force, Vector3 position = Vector3(0, 0, 0)) - Applies a positioned force to the body. A force is time dependent and meant to be applied every physics update. `position` is the offset from the body origin in global coordinates.
- ApplyImpulse(Vector3 impulse, Vector3 position = Vector3(0, 0, 0)) - Applies a positioned impulse to the body. An impulse is time-independent! Applying an impulse every frame would result in a framerate-dependent force. For this reason, it should only be used when simulating one-time impacts (use the "_force" functions otherwise). `position` is the offset from the body origin in global coordinates.
- ApplyTorque(Vector3 torque) - Applies a rotational force without affecting position. A force is time dependent and meant to be applied every physics update. **Note:** `inverse_inertia` is required for this to work. To have `inverse_inertia`, an active CollisionShape3D must be a child of the node, or you can manually set `inverse_inertia`.
- ApplyTorqueImpulse(Vector3 impulse) - Applies a rotational impulse to the body without affecting the position. An impulse is time-independent! Applying an impulse every frame would result in a framerate-dependent force. For this reason, it should only be used when simulating one-time impacts (use the "_force" functions otherwise). **Note:** `inverse_inertia` is required for this to work. To have `inverse_inertia`, an active CollisionShape3D must be a child of the node, or you can manually set `inverse_inertia`.
- GetConstantForce() -> Vector3 - Returns the body's total constant positional forces applied during each physics update. See `add_constant_force` and `add_constant_central_force`.
- GetConstantTorque() -> Vector3 - Returns the body's total constant rotational forces applied during each physics update. See `add_constant_torque`.
- GetContactCollider(int contactIdx) -> Rid - Returns the collider's RID.
- GetContactColliderId(int contactIdx) -> int - Returns the collider's object id.
- GetContactColliderObject(int contactIdx) -> Object - Returns the collider object.
- GetContactColliderPosition(int contactIdx) -> Vector3 - Returns the position of the contact point on the collider in the global coordinate system.
- GetContactColliderShape(int contactIdx) -> int - Returns the collider's shape index.
- GetContactColliderVelocityAtPosition(int contactIdx) -> Vector3 - Returns the linear velocity vector at the collider's contact point.
- GetContactCount() -> int - Returns the number of contacts this body has with other bodies. **Note:** By default, this returns 0 unless bodies are configured to monitor contacts. See `RigidBody3D.contact_monitor`.
- GetContactImpulse(int contactIdx) -> Vector3 - Impulse created by the contact.
- GetContactLocalNormal(int contactIdx) -> Vector3 - Returns the local normal at the contact point.
- GetContactLocalPosition(int contactIdx) -> Vector3 - Returns the position of the contact point on the body in the global coordinate system.
- GetContactLocalShape(int contactIdx) -> int - Returns the local shape index of the collision.
- GetContactLocalVelocityAtPosition(int contactIdx) -> Vector3 - Returns the linear velocity vector at the body's contact point.
- GetSpaceState() -> PhysicsDirectSpaceState3D - Returns the current state of the space, useful for queries.
- GetVelocityAtLocalPosition(Vector3 localPosition) -> Vector3 - Returns the body's velocity at the given relative position. `local_position` is the offset from the body origin in global coordinates.
- IntegrateForces() - Updates the body's linear and angular velocity by applying gravity and damping for the equivalent of one physics tick.
- SetConstantForce(Vector3 force) - Sets the body's total constant positional forces applied during each physics update. See `add_constant_force` and `add_constant_central_force`.
- SetConstantTorque(Vector3 torque) - Sets the body's total constant rotational forces applied during each physics update. See `add_constant_torque`.

