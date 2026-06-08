## HingeJoint3D <- Joint3D

A physics joint that restricts the rotation of a 3D physics body around an axis relative to another physics body. For example, Body A can be a StaticBody3D representing a door hinge that a RigidBody3D rotates around.

**Props:**
- AngularLimit/bias: float = 0.3
- AngularLimit/enable: bool = false
- AngularLimit/lower: float = -1.5707964
- AngularLimit/relaxation: float = 1.0
- AngularLimit/softness: float = 0.9
- AngularLimit/upper: float = 1.5707964
- Motor/enable: bool = false
- Motor/maxImpulse: float = 1.0
- Motor/targetVelocity: float = 1.0
- Params/bias: float = 0.3

- **angular_limit/bias**: The speed with which the rotation across the axis perpendicular to the hinge gets corrected.
- **angular_limit/enable**: If `true`, the hinges maximum and minimum rotation, defined by `angular_limit/lower` and `angular_limit/upper` has effects.
- **angular_limit/lower**: The minimum rotation. Only active if `angular_limit/enable` is `true`.
- **angular_limit/relaxation**: The lower this value, the more the rotation gets slowed down.
- **angular_limit/upper**: The maximum rotation. Only active if `angular_limit/enable` is `true`.
- **motor/enable**: When activated, a motor turns the hinge.
- **motor/max_impulse**: Maximum acceleration for the motor.
- **motor/target_velocity**: Target speed for the motor.
- **params/bias**: The speed with which the two bodies get pulled together when they move in different directions.

**Methods:**
- GetFlag(int flag) -> bool - Returns the value of the specified flag.
- GetParam(int param) -> float - Returns the value of the specified parameter.
- SetFlag(int flag, bool enabled) - If `true`, enables the specified flag.
- SetParam(int param, float value) - Sets the value of the specified parameter.

**Enums:**
**Param:** PARAM_BIAS=0, PARAM_LIMIT_UPPER=1, PARAM_LIMIT_LOWER=2, PARAM_LIMIT_BIAS=3, PARAM_LIMIT_SOFTNESS=4, PARAM_LIMIT_RELAXATION=5, PARAM_MOTOR_TARGET_VELOCITY=6, PARAM_MOTOR_MAX_IMPULSE=7, PARAM_MAX=8
  - PARAM_BIAS: The speed with which the two bodies get pulled together when they move in different directions.
  - PARAM_LIMIT_UPPER: The maximum rotation. Only active if `angular_limit/enable` is `true`.
  - PARAM_LIMIT_LOWER: The minimum rotation. Only active if `angular_limit/enable` is `true`.
  - PARAM_LIMIT_BIAS: The speed with which the rotation across the axis perpendicular to the hinge gets corrected.
  - PARAM_LIMIT_RELAXATION: The lower this value, the more the rotation gets slowed down.
  - PARAM_MOTOR_TARGET_VELOCITY: Target speed for the motor.
  - PARAM_MOTOR_MAX_IMPULSE: Maximum acceleration for the motor.
  - PARAM_MAX: Represents the size of the `Param` enum.
**Flag:** FLAG_USE_LIMIT=0, FLAG_ENABLE_MOTOR=1, FLAG_MAX=2
  - FLAG_USE_LIMIT: If `true`, the hinges maximum and minimum rotation, defined by `angular_limit/lower` and `angular_limit/upper` has effects.
  - FLAG_ENABLE_MOTOR: When activated, a motor turns the hinge.
  - FLAG_MAX: Represents the size of the `Flag` enum.

