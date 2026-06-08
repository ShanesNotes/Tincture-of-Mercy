## SpringBoneSimulator3D <- SkeletonModifier3D

This SkeletonModifier3D can be used to wiggle hair, cloth, and tails. This modifier behaves differently from PhysicalBoneSimulator3D as it attempts to return the original pose after modification. If you setup `set_root_bone` and `set_end_bone`, it is treated as one bone chain. Note that it does not support a branched chain like Y-shaped chains. When a bone chain is created, an array is generated from the bones that exist in between and listed in the joint list. Several properties can be applied to each joint, such as `set_joint_stiffness`, `set_joint_drag`, and `set_joint_gravity`. For simplicity, you can set values to all joints at the same time by using a Curve. If you want to specify detailed values individually, set `set_individual_config` to `true`. For physical simulation, SpringBoneSimulator3D can have children as self-standing collisions that are not related to PhysicsServer3D, see also SpringBoneCollision3D. **Warning:** A scaled SpringBoneSimulator3D will likely not behave as expected. Make sure that the parent Skeleton3D and its bones are not scaled. **Note:** Most methods in this class take an `index` parameter. This parameter specifies which setting list entry to return if the IK has multiple entries (e.g. `settings/<index>/root_bone_name`).

**Props:**
- ExternalForce: Vector3 = Vector3(0, 0, 0)
- MutableBoneAxes: bool = true
- SettingCount: int = 0

- **external_force**: The constant force that always affected bones. It is equal to the result when the parent Skeleton3D moves at this speed in the opposite direction. This is useful for effects such as wind and anti-gravity.
- **mutable_bone_axes**: If `true`, the solver retrieves the bone axis from the bone pose every frame. If `false`, the solver retrieves the bone axis from the bone rest and caches it, which increases performance slightly, but position changes in the bone pose made before processing this SpringBoneSimulator3D are ignored.
- **setting_count**: The number of settings.

**Methods:**
- AreAllChildCollisionsEnabled(int index) -> bool - Returns `true` if all child SpringBoneCollision3Ds are contained in the collision list at `index` in the settings.
- ClearCollisions(int index) - Clears all collisions from the collision list at `index` in the settings when `are_all_child_collisions_enabled` is `false`.
- ClearExcludeCollisions(int index) - Clears all exclude collisions from the collision list at `index` in the settings when `are_all_child_collisions_enabled` is `true`.
- ClearSettings() - Clears all settings.
- GetCenterBone(int index) -> int - Returns the center bone index of the bone chain.
- GetCenterBoneName(int index) -> string - Returns the center bone name of the bone chain.
- GetCenterFrom(int index) -> int - Returns what the center originates from in the bone chain.
- GetCenterNode(int index) -> NodePath - Returns the center node path of the bone chain.
- GetCollisionCount(int index) -> int - Returns the collision count of the bone chain's collision list when `are_all_child_collisions_enabled` is `false`.
- GetCollisionPath(int index, int collision) -> NodePath - Returns the node path of the SpringBoneCollision3D at `collision` in the bone chain's collision list when `are_all_child_collisions_enabled` is `false`.
- GetDrag(int index) -> float - Returns the drag force damping curve of the bone chain.
- GetDragDampingCurve(int index) -> Curve - Returns the drag force damping curve of the bone chain.
- GetEndBone(int index) -> int - Returns the end bone index of the bone chain.
- GetEndBoneDirection(int index) -> int - Returns the tail direction of the end bone of the bone chain when `is_end_bone_extended` is `true`.
- GetEndBoneLength(int index) -> float - Returns the end bone tail length of the bone chain when `is_end_bone_extended` is `true`.
- GetEndBoneName(int index) -> string - Returns the end bone name of the bone chain.
- GetExcludeCollisionCount(int index) -> int - Returns the exclude collision count of the bone chain's exclude collision list when `are_all_child_collisions_enabled` is `true`.
- GetExcludeCollisionPath(int index, int collision) -> NodePath - Returns the node path of the SpringBoneCollision3D at `collision` in the bone chain's exclude collision list when `are_all_child_collisions_enabled` is `true`.
- GetGravity(int index) -> float - Returns the gravity amount of the bone chain.
- GetGravityDampingCurve(int index) -> Curve - Returns the gravity amount damping curve of the bone chain.
- GetGravityDirection(int index) -> Vector3 - Returns the gravity direction of the bone chain.
- GetJointBone(int index, int joint) -> int - Returns the bone index at `joint` in the bone chain's joint list.
- GetJointBoneName(int index, int joint) -> string - Returns the bone name at `joint` in the bone chain's joint list.
- GetJointCount(int index) -> int - Returns the joint count of the bone chain's joint list.
- GetJointDrag(int index, int joint) -> float - Returns the drag force at `joint` in the bone chain's joint list.
- GetJointGravity(int index, int joint) -> float - Returns the gravity amount at `joint` in the bone chain's joint list.
- GetJointGravityDirection(int index, int joint) -> Vector3 - Returns the gravity direction at `joint` in the bone chain's joint list.
- GetJointRadius(int index, int joint) -> float - Returns the radius at `joint` in the bone chain's joint list.
- GetJointRotationAxis(int index, int joint) -> int - Returns the rotation axis at `joint` in the bone chain's joint list.
- GetJointRotationAxisVector(int index, int joint) -> Vector3 - Returns the rotation axis vector for the specified joint in the bone chain. This vector represents the axis around which the joint can rotate. It is determined based on the rotation axis set for the joint. If `get_joint_rotation_axis` is `SkeletonModifier3D.ROTATION_AXIS_ALL`, this method returns `Vector3(0, 0, 0)`.
- GetJointStiffness(int index, int joint) -> float - Returns the stiffness force at `joint` in the bone chain's joint list.
- GetRadius(int index) -> float - Returns the joint radius of the bone chain.
- GetRadiusDampingCurve(int index) -> Curve - Returns the joint radius damping curve of the bone chain.
- GetRootBone(int index) -> int - Returns the root bone index of the bone chain.
- GetRootBoneName(int index) -> string - Returns the root bone name of the bone chain.
- GetRotationAxis(int index) -> int - Returns the rotation axis of the bone chain.
- GetRotationAxisVector(int index) -> Vector3 - Returns the rotation axis vector of the bone chain. This vector represents the axis around which the bone chain can rotate. It is determined based on the rotation axis set for the bone chain. If `get_rotation_axis` is `SkeletonModifier3D.ROTATION_AXIS_ALL`, this method returns `Vector3(0, 0, 0)`.
- GetStiffness(int index) -> float - Returns the stiffness force of the bone chain.
- GetStiffnessDampingCurve(int index) -> Curve - Returns the stiffness force damping curve of the bone chain.
- IsConfigIndividual(int index) -> bool - Returns `true` if the config can be edited individually for each joint.
- IsEndBoneExtended(int index) -> bool - Returns `true` if the end bone is extended to have a tail.
- Reset() - Resets a simulating state with respect to the current bone pose. It is useful to prevent the simulation result getting violent. For example, calling this immediately after a call to `AnimationPlayer.play` without a fading, or within the previous `SkeletonModifier3D.modification_processed` signal if it's condition changes significantly.
- SetCenterBone(int index, int bone) - Sets the center bone index of the bone chain.
- SetCenterBoneName(int index, string boneName) - Sets the center bone name of the bone chain.
- SetCenterFrom(int index, int centerFrom) - Sets what the center originates from in the bone chain. Bone movement is calculated based on the difference in relative distance between center and bone in the previous and next frames. For example, if the parent Skeleton3D is used as the center, the bones are considered to have not moved if the Skeleton3D moves in the world. In this case, only a change in the bone pose is considered to be a bone movement.
- SetCenterNode(int index, NodePath nodePath) - Sets the center node path of the bone chain.
- SetCollisionCount(int index, int count) - Sets the number of collisions in the collision list at `index` in the settings when `are_all_child_collisions_enabled` is `false`.
- SetCollisionPath(int index, int collision, NodePath nodePath) - Sets the node path of the SpringBoneCollision3D at `collision` in the bone chain's collision list when `are_all_child_collisions_enabled` is `false`.
- SetDrag(int index, float drag) - Sets the drag force of the bone chain. The greater the value, the more suppressed the wiggling. The value is scaled by `set_drag_damping_curve` and cached in each joint setting in the joint list.
- SetDragDampingCurve(int index, Curve curve) - Sets the drag force damping curve of the bone chain.
- SetEnableAllChildCollisions(int index, bool enabled) - If `enabled` is `true`, all child SpringBoneCollision3Ds are colliding and `set_exclude_collision_path` is enabled as an exclusion list at `index` in the settings. If `enabled` is `false`, you need to manually register all valid collisions with `set_collision_path`.
- SetEndBone(int index, int bone) - Sets the end bone index of the bone chain.
- SetEndBoneDirection(int index, int boneDirection) - Sets the end bone tail direction of the bone chain when `is_end_bone_extended` is `true`.
- SetEndBoneLength(int index, float length) - Sets the end bone tail length of the bone chain when `is_end_bone_extended` is `true`.
- SetEndBoneName(int index, string boneName) - Sets the end bone name of the bone chain. **Note:** End bone must be the root bone or a child of the root bone. If they are the same, the tail must be extended by `set_extend_end_bone` to jiggle the bone.
- SetExcludeCollisionCount(int index, int count) - Sets the number of exclude collisions in the exclude collision list at `index` in the settings when `are_all_child_collisions_enabled` is `true`.
- SetExcludeCollisionPath(int index, int collision, NodePath nodePath) - Sets the node path of the SpringBoneCollision3D at `collision` in the bone chain's exclude collision list when `are_all_child_collisions_enabled` is `true`.
- SetExtendEndBone(int index, bool enabled) - If `enabled` is `true`, the end bone is extended to have a tail. The extended tail config is allocated to the last element in the joint list. In other words, if you set `enabled` to `false`, the config of the last element in the joint list has no effect in the simulated result.
- SetGravity(int index, float gravity) - Sets the gravity amount of the bone chain. This value is not an acceleration, but a constant velocity of movement in `set_gravity_direction`. If `gravity` is not `0`, the modified pose will not return to the original pose since it is always affected by gravity. The value is scaled by `set_gravity_damping_curve` and cached in each joint setting in the joint list.
- SetGravityDampingCurve(int index, Curve curve) - Sets the gravity amount damping curve of the bone chain.
- SetGravityDirection(int index, Vector3 gravityDirection) - Sets the gravity direction of the bone chain. This value is internally normalized and then multiplied by `set_gravity`. The value is cached in each joint setting in the joint list.
- SetIndividualConfig(int index, bool enabled) - If `enabled` is `true`, the config can be edited individually for each joint.
- SetJointDrag(int index, int joint, float drag) - Sets the drag force at `joint` in the bone chain's joint list when `is_config_individual` is `true`.
- SetJointGravity(int index, int joint, float gravity) - Sets the gravity amount at `joint` in the bone chain's joint list when `is_config_individual` is `true`.
- SetJointGravityDirection(int index, int joint, Vector3 gravityDirection) - Sets the gravity direction at `joint` in the bone chain's joint list when `is_config_individual` is `true`.
- SetJointRadius(int index, int joint, float radius) - Sets the joint radius at `joint` in the bone chain's joint list when `is_config_individual` is `true`.
- SetJointRotationAxis(int index, int joint, int axis) - Sets the rotation axis at `joint` in the bone chain's joint list when `is_config_individual` is `true`. The axes are based on the `Skeleton3D.get_bone_rest`'s space, if `axis` is `SkeletonModifier3D.ROTATION_AXIS_CUSTOM`, you can specify any axis. **Note:** The rotation axis and the forward vector shouldn't be colinear to avoid unintended rotation since SpringBoneSimulator3D does not factor in twisting forces.
- SetJointRotationAxisVector(int index, int joint, Vector3 vector) - Sets the rotation axis vector for the specified joint in the bone chain. This vector is normalized by an internal process and represents the axis around which the bone chain can rotate. If the vector length is `0`, it is considered synonymous with `SkeletonModifier3D.ROTATION_AXIS_ALL`.
- SetJointStiffness(int index, int joint, float stiffness) - Sets the stiffness force at `joint` in the bone chain's joint list when `is_config_individual` is `true`.
- SetRadius(int index, float radius) - Sets the joint radius of the bone chain. It is used to move and slide with the SpringBoneCollision3D in the collision list. The value is scaled by `set_radius_damping_curve` and cached in each joint setting in the joint list.
- SetRadiusDampingCurve(int index, Curve curve) - Sets the joint radius damping curve of the bone chain.
- SetRootBone(int index, int bone) - Sets the root bone index of the bone chain.
- SetRootBoneName(int index, string boneName) - Sets the root bone name of the bone chain.
- SetRotationAxis(int index, int axis) - Sets the rotation axis of the bone chain. If set to a specific axis, it acts like a hinge joint. The value is cached in each joint setting in the joint list. The axes are based on the `Skeleton3D.get_bone_rest`'s space, if `axis` is `SkeletonModifier3D.ROTATION_AXIS_CUSTOM`, you can specify any axis. **Note:** The rotation axis vector and the forward vector shouldn't be colinear to avoid unintended rotation since SpringBoneSimulator3D does not factor in twisting forces.
- SetRotationAxisVector(int index, Vector3 vector) - Sets the rotation axis vector of the bone chain. The value is cached in each joint setting in the joint list. This vector is normalized by an internal process and represents the axis around which the bone chain can rotate. If the vector length is `0`, it is considered synonymous with `SkeletonModifier3D.ROTATION_AXIS_ALL`.
- SetStiffness(int index, float stiffness) - Sets the stiffness force of the bone chain. The greater the value, the faster it recovers to its initial pose. If `stiffness` is `0`, the modified pose will not return to the original pose. The value is scaled by `set_stiffness_damping_curve` and cached in each joint setting in the joint list.
- SetStiffnessDampingCurve(int index, Curve curve) - Sets the stiffness force damping curve of the bone chain.

**Enums:**
**CenterFrom:** CENTER_FROM_WORLD_ORIGIN=0, CENTER_FROM_NODE=1, CENTER_FROM_BONE=2
  - CENTER_FROM_WORLD_ORIGIN: The world origin is defined as center.
  - CENTER_FROM_NODE: The Node3D specified by `set_center_node` is defined as center. If Node3D is not found, the parent Skeleton3D is treated as center.
  - CENTER_FROM_BONE: The bone pose origin of the parent Skeleton3D specified by `set_center_bone` is defined as center. If Node3D is not found, the parent Skeleton3D is treated as center.

