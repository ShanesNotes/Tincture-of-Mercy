## PhysicsDirectBodyState3DExtension <- PhysicsDirectBodyState3D

This class extends PhysicsDirectBodyState3D by providing additional virtual methods that can be overridden. When these methods are overridden, they will be called instead of the internal methods of the physics server. Intended for use with GDExtension to create custom implementations of PhysicsDirectBodyState3D.

**Methods:**
- AddConstantCentralForce(Vector3 force)
- AddConstantForce(Vector3 force, Vector3 position)
- AddConstantTorque(Vector3 torque)
- ApplyCentralForce(Vector3 force)
- ApplyCentralImpulse(Vector3 impulse)
- ApplyForce(Vector3 force, Vector3 position)
- ApplyImpulse(Vector3 impulse, Vector3 position)
- ApplyTorque(Vector3 torque)
- ApplyTorqueImpulse(Vector3 impulse)
- GetAngularVelocity() -> Vector3
- GetCenterOfMass() -> Vector3
- GetCenterOfMassLocal() -> Vector3
- GetCollisionLayer() -> int
- GetCollisionMask() -> int
- GetConstantForce() -> Vector3
- GetConstantTorque() -> Vector3
- GetContactCollider(int contactIdx) -> Rid
- GetContactColliderId(int contactIdx) -> int
- GetContactColliderObject(int contactIdx) -> Object
- GetContactColliderPosition(int contactIdx) -> Vector3
- GetContactColliderShape(int contactIdx) -> int
- GetContactColliderVelocityAtPosition(int contactIdx) -> Vector3
- GetContactCount() -> int
- GetContactImpulse(int contactIdx) -> Vector3
- GetContactLocalNormal(int contactIdx) -> Vector3
- GetContactLocalPosition(int contactIdx) -> Vector3
- GetContactLocalShape(int contactIdx) -> int
- GetContactLocalVelocityAtPosition(int contactIdx) -> Vector3
- GetInverseInertia() -> Vector3
- GetInverseInertiaTensor() -> Basis
- GetInverseMass() -> float
- GetLinearVelocity() -> Vector3
- GetPrincipalInertiaAxes() -> Basis
- GetSpaceState() -> PhysicsDirectSpaceState3D
- GetStep() -> float
- GetTotalAngularDamp() -> float
- GetTotalGravity() -> Vector3
- GetTotalLinearDamp() -> float
- GetTransform() -> Transform3D
- GetVelocityAtLocalPosition(Vector3 localPosition) -> Vector3
- IntegrateForces()
- IsSleeping() -> bool
- SetAngularVelocity(Vector3 velocity)
- SetCollisionLayer(int layer)
- SetCollisionMask(int mask)
- SetConstantForce(Vector3 force)
- SetConstantTorque(Vector3 torque)
- SetLinearVelocity(Vector3 velocity)
- SetSleepState(bool enabled)
- SetTransform(Transform3D transform)

