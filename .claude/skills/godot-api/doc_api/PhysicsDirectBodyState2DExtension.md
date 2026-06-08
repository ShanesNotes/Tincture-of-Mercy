## PhysicsDirectBodyState2DExtension <- PhysicsDirectBodyState2D

This class extends PhysicsDirectBodyState2D by providing additional virtual methods that can be overridden. When these methods are overridden, they will be called instead of the internal methods of the physics server. Intended for use with GDExtension to create custom implementations of PhysicsDirectBodyState2D.

**Methods:**
- AddConstantCentralForce(Vector2 force) - Overridable version of `PhysicsDirectBodyState2D.add_constant_central_force`.
- AddConstantForce(Vector2 force, Vector2 position) - Overridable version of `PhysicsDirectBodyState2D.add_constant_force`.
- AddConstantTorque(float torque) - Overridable version of `PhysicsDirectBodyState2D.add_constant_torque`.
- ApplyCentralForce(Vector2 force) - Overridable version of `PhysicsDirectBodyState2D.apply_central_force`.
- ApplyCentralImpulse(Vector2 impulse) - Overridable version of `PhysicsDirectBodyState2D.apply_central_impulse`.
- ApplyForce(Vector2 force, Vector2 position) - Overridable version of `PhysicsDirectBodyState2D.apply_force`.
- ApplyImpulse(Vector2 impulse, Vector2 position) - Overridable version of `PhysicsDirectBodyState2D.apply_impulse`.
- ApplyTorque(float torque) - Overridable version of `PhysicsDirectBodyState2D.apply_torque`.
- ApplyTorqueImpulse(float impulse) - Overridable version of `PhysicsDirectBodyState2D.apply_torque_impulse`.
- GetAngularVelocity() -> float - Implement to override the behavior of `PhysicsDirectBodyState2D.angular_velocity` and its respective getter.
- GetCenterOfMass() -> Vector2 - Implement to override the behavior of `PhysicsDirectBodyState2D.center_of_mass` and its respective getter.
- GetCenterOfMassLocal() -> Vector2 - Implement to override the behavior of `PhysicsDirectBodyState2D.center_of_mass_local` and its respective getter.
- GetCollisionLayer() -> int
- GetCollisionMask() -> int
- GetConstantForce() -> Vector2 - Overridable version of `PhysicsDirectBodyState2D.get_constant_force`.
- GetConstantTorque() -> float - Overridable version of `PhysicsDirectBodyState2D.get_constant_torque`.
- GetContactCollider(int contactIdx) -> Rid - Overridable version of `PhysicsDirectBodyState2D.get_contact_collider`.
- GetContactColliderId(int contactIdx) -> int - Overridable version of `PhysicsDirectBodyState2D.get_contact_collider_id`.
- GetContactColliderObject(int contactIdx) -> Object - Overridable version of `PhysicsDirectBodyState2D.get_contact_collider_object`.
- GetContactColliderPosition(int contactIdx) -> Vector2 - Overridable version of `PhysicsDirectBodyState2D.get_contact_collider_position`.
- GetContactColliderShape(int contactIdx) -> int - Overridable version of `PhysicsDirectBodyState2D.get_contact_collider_shape`.
- GetContactColliderVelocityAtPosition(int contactIdx) -> Vector2 - Overridable version of `PhysicsDirectBodyState2D.get_contact_collider_velocity_at_position`.
- GetContactCount() -> int - Overridable version of `PhysicsDirectBodyState2D.get_contact_count`.
- GetContactImpulse(int contactIdx) -> Vector2 - Overridable version of `PhysicsDirectBodyState2D.get_contact_impulse`.
- GetContactLocalNormal(int contactIdx) -> Vector2 - Overridable version of `PhysicsDirectBodyState2D.get_contact_local_normal`.
- GetContactLocalPosition(int contactIdx) -> Vector2 - Overridable version of `PhysicsDirectBodyState2D.get_contact_local_position`.
- GetContactLocalShape(int contactIdx) -> int - Overridable version of `PhysicsDirectBodyState2D.get_contact_local_shape`.
- GetContactLocalVelocityAtPosition(int contactIdx) -> Vector2 - Overridable version of `PhysicsDirectBodyState2D.get_contact_local_velocity_at_position`.
- GetInverseInertia() -> float - Implement to override the behavior of `PhysicsDirectBodyState2D.inverse_inertia` and its respective getter.
- GetInverseMass() -> float - Implement to override the behavior of `PhysicsDirectBodyState2D.inverse_mass` and its respective getter.
- GetLinearVelocity() -> Vector2 - Implement to override the behavior of `PhysicsDirectBodyState2D.linear_velocity` and its respective getter.
- GetSpaceState() -> PhysicsDirectSpaceState2D - Overridable version of `PhysicsDirectBodyState2D.get_space_state`.
- GetStep() -> float - Implement to override the behavior of `PhysicsDirectBodyState2D.step` and its respective getter.
- GetTotalAngularDamp() -> float - Implement to override the behavior of `PhysicsDirectBodyState2D.total_angular_damp` and its respective getter.
- GetTotalGravity() -> Vector2 - Implement to override the behavior of `PhysicsDirectBodyState2D.total_gravity` and its respective getter.
- GetTotalLinearDamp() -> float - Implement to override the behavior of `PhysicsDirectBodyState2D.total_linear_damp` and its respective getter.
- GetTransform() -> Transform2D - Implement to override the behavior of `PhysicsDirectBodyState2D.transform` and its respective getter.
- GetVelocityAtLocalPosition(Vector2 localPosition) -> Vector2 - Overridable version of `PhysicsDirectBodyState2D.get_velocity_at_local_position`.
- IntegrateForces() - Overridable version of `PhysicsDirectBodyState2D.integrate_forces`.
- IsSleeping() -> bool - Implement to override the behavior of `PhysicsDirectBodyState2D.sleeping` and its respective getter.
- SetAngularVelocity(float velocity) - Implement to override the behavior of `PhysicsDirectBodyState2D.angular_velocity` and its respective setter.
- SetCollisionLayer(int layer)
- SetCollisionMask(int mask)
- SetConstantForce(Vector2 force) - Overridable version of `PhysicsDirectBodyState2D.set_constant_force`.
- SetConstantTorque(float torque) - Overridable version of `PhysicsDirectBodyState2D.set_constant_torque`.
- SetLinearVelocity(Vector2 velocity) - Implement to override the behavior of `PhysicsDirectBodyState2D.linear_velocity` and its respective setter.
- SetSleepState(bool enabled) - Implement to override the behavior of `PhysicsDirectBodyState2D.sleeping` and its respective setter.
- SetTransform(Transform2D transform) - Implement to override the behavior of `PhysicsDirectBodyState2D.transform` and its respective setter.

