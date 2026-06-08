## SkeletonModification2DPhysicalBones <- SkeletonModification2D

This modification takes the transforms of PhysicalBone2D nodes and applies them to Bone2D nodes. This allows the Bone2D nodes to react to physics thanks to the linked PhysicalBone2D nodes.

**Props:**
- PhysicalBoneChainLength: int = 0

- **physical_bone_chain_length**: The number of PhysicalBone2D nodes linked in this modification.

**Methods:**
- FetchPhysicalBones() - Empties the list of PhysicalBone2D nodes and populates it with all PhysicalBone2D nodes that are children of the Skeleton2D.
- GetPhysicalBoneNode(int jointIdx) -> NodePath - Returns the PhysicalBone2D node at `joint_idx`.
- SetPhysicalBoneNode(int jointIdx, NodePath physicalbone2dNode) - Sets the PhysicalBone2D node at `joint_idx`. **Note:** This is just the index used for this modification, not the bone index used in the Skeleton2D.
- StartSimulation(StringName[] bones = []) - Tell the PhysicalBone2D nodes to start simulating and interacting with the physics world. Optionally, an array of bone names can be passed to this function, and that will cause only PhysicalBone2D nodes with those names to start simulating.
- StopSimulation(StringName[] bones = []) - Tell the PhysicalBone2D nodes to stop simulating and interacting with the physics world. Optionally, an array of bone names can be passed to this function, and that will cause only PhysicalBone2D nodes with those names to stop simulating.

