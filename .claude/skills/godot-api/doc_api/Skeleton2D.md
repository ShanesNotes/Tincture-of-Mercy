## Skeleton2D <- Node2D

Skeleton2D parents a hierarchy of Bone2D nodes. It holds a reference to each Bone2D's rest pose and acts as a single point of access to its bones. To set up different types of inverse kinematics for the given Skeleton2D, a SkeletonModificationStack2D should be created. The inverse kinematics be applied by increasing `SkeletonModificationStack2D.modification_count` and creating the desired number of modifications.

**Methods:**
- ExecuteModifications(float delta, int executionMode) - Executes all the modifications on the SkeletonModificationStack2D, if the Skeleton2D has one assigned.
- GetBone(int idx) -> Bone2D - Returns a Bone2D from the node hierarchy parented by Skeleton2D. The object to return is identified by the parameter `idx`. Bones are indexed by descending the node hierarchy from top to bottom, adding the children of each branch before moving to the next sibling.
- GetBoneCount() -> int - Returns the number of Bone2D nodes in the node hierarchy parented by Skeleton2D.
- GetBoneLocalPoseOverride(int boneIdx) -> Transform2D - Returns the local pose override transform for `bone_idx`.
- GetModificationStack() -> SkeletonModificationStack2D - Returns the SkeletonModificationStack2D attached to this skeleton, if one exists.
- GetSkeleton() -> Rid - Returns the RID of a Skeleton2D instance.
- SetBoneLocalPoseOverride(int boneIdx, Transform2D overridePose, float strength, bool persistent) - Sets the local pose transform, `override_pose`, for the bone at `bone_idx`. `strength` is the interpolation strength that will be used when applying the pose, and `persistent` determines if the applied pose will remain. **Note:** The pose transform needs to be a local transform relative to the Bone2D node at `bone_idx`!
- SetModificationStack(SkeletonModificationStack2D modificationStack) - Sets the SkeletonModificationStack2D attached to this skeleton.

**Signals:**
- BoneSetupChanged - Emitted when the Bone2D setup attached to this skeletons changes. This is primarily used internally within the skeleton.

