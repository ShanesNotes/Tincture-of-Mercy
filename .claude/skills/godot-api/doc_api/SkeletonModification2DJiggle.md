## SkeletonModification2DJiggle <- SkeletonModification2D

This modification moves a series of bones, typically called a bone chain, towards a target. What makes this modification special is that it calculates the velocity and acceleration for each bone in the bone chain, and runs a very light physics-like calculation using the inputted values. This allows the bones to overshoot the target and "jiggle" around. It can be configured to act more like a spring, or sway around like cloth might. This modification is useful for adding additional motion to things like hair, the edges of clothing, and more. It has several settings to that allow control over how the joint moves when the target moves. **Note:** The Jiggle modifier has `jiggle_joints`, which are the data objects that hold the data for each joint in the Jiggle chain. This is different from than Bone2D nodes! Jiggle joints hold the data needed for each Bone2D in the bone chain used by the Jiggle modification.

**Props:**
- Damping: float = 0.75
- Gravity: Vector2 = Vector2(0, 6)
- JiggleDataChainLength: int = 0
- Mass: float = 0.75
- Stiffness: float = 3.0
- TargetNodepath: NodePath = NodePath("")
- UseGravity: bool = false

- **damping**: The default amount of damping applied to the Jiggle joints, if they are not overridden. Higher values lead to more of the calculated velocity being applied.
- **gravity**: The default amount of gravity applied to the Jiggle joints, if they are not overridden.
- **jiggle_data_chain_length**: The amount of Jiggle joints in the Jiggle modification.
- **mass**: The default amount of mass assigned to the Jiggle joints, if they are not overridden. Higher values lead to faster movements and more overshooting.
- **stiffness**: The default amount of stiffness assigned to the Jiggle joints, if they are not overridden. Higher values act more like springs, quickly moving into the correct position.
- **target_nodepath**: The NodePath to the node that is the target for the Jiggle modification. This node is what the Jiggle chain will attempt to rotate the bone chain to.
- **use_gravity**: Whether the gravity vector, `gravity`, should be applied to the Jiggle joints, assuming they are not overriding the default settings.

**Methods:**
- GetCollisionMask() -> int - Returns the collision mask used by the Jiggle modifier when collisions are enabled.
- GetJiggleJointBone2dNode(int jointIdx) -> NodePath - Returns the Bone2D node assigned to the Jiggle joint at `joint_idx`.
- GetJiggleJointBoneIndex(int jointIdx) -> int - Returns the index of the Bone2D node assigned to the Jiggle joint at `joint_idx`.
- GetJiggleJointDamping(int jointIdx) -> float - Returns the amount of damping of the Jiggle joint at `joint_idx`.
- GetJiggleJointGravity(int jointIdx) -> Vector2 - Returns a Vector2 representing the amount of gravity the Jiggle joint at `joint_idx` is influenced by.
- GetJiggleJointMass(int jointIdx) -> float - Returns the amount of mass of the jiggle joint at `joint_idx`.
- GetJiggleJointOverride(int jointIdx) -> bool - Returns a boolean that indicates whether the joint at `joint_idx` is overriding the default Jiggle joint data defined in the modification.
- GetJiggleJointStiffness(int jointIdx) -> float - Returns the stiffness of the Jiggle joint at `joint_idx`.
- GetJiggleJointUseGravity(int jointIdx) -> bool - Returns a boolean that indicates whether the joint at `joint_idx` is using gravity or not.
- GetUseColliders() -> bool - Returns whether the jiggle modifier is taking physics colliders into account when solving.
- Reset() - Resets the internal jiggle simulation state to the current bone positions, clearing velocity, acceleration, and accumulated forces.
- SetCollisionMask(int collisionMask) - Sets the collision mask that the Jiggle modifier will use when reacting to colliders, if the Jiggle modifier is set to take colliders into account.
- SetJiggleJointBone2dNode(int jointIdx, NodePath bone2dNode) - Sets the Bone2D node assigned to the Jiggle joint at `joint_idx`.
- SetJiggleJointBoneIndex(int jointIdx, int boneIdx) - Sets the bone index, `bone_idx`, of the Jiggle joint at `joint_idx`. When possible, this will also update the `bone2d_node` of the Jiggle joint based on data provided by the linked skeleton.
- SetJiggleJointDamping(int jointIdx, float damping) - Sets the amount of damping of the Jiggle joint at `joint_idx`.
- SetJiggleJointGravity(int jointIdx, Vector2 gravity) - Sets the gravity vector of the Jiggle joint at `joint_idx`.
- SetJiggleJointMass(int jointIdx, float mass) - Sets the of mass of the Jiggle joint at `joint_idx`.
- SetJiggleJointOverride(int jointIdx, bool override) - Sets whether the Jiggle joint at `joint_idx` should override the default Jiggle joint settings. Setting this to `true` will make the joint use its own settings rather than the default ones attached to the modification.
- SetJiggleJointStiffness(int jointIdx, float stiffness) - Sets the of stiffness of the Jiggle joint at `joint_idx`.
- SetJiggleJointUseGravity(int jointIdx, bool useGravity) - Sets whether the Jiggle joint at `joint_idx` should use gravity.
- SetUseColliders(bool useColliders) - If `true`, the Jiggle modifier will take colliders into account, keeping them from entering into these collision objects.

