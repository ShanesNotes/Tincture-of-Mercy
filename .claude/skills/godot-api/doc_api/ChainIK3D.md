## ChainIK3D <- IKModifier3D

Base class of SkeletonModifier3D that automatically generates a joint list from the bones between the root bone and the end bone. **Note:** All the methods in this class take an `index` parameter. This parameter specifies which setting list entry to return if the IK has multiple entries (e.g. `settings/<index>/root_bone_name`).

**Methods:**
- GetEndBone(int index) -> int - Returns the end bone index of the bone chain.
- GetEndBoneDirection(int index) -> int - Returns the tail direction of the end bone of the bone chain when `is_end_bone_extended` is `true`.
- GetEndBoneLength(int index) -> float - Returns the end bone tail length of the bone chain when `is_end_bone_extended` is `true`.
- GetEndBoneName(int index) -> string - Returns the end bone name of the bone chain.
- GetJointBone(int index, int joint) -> int - Returns the bone index at `joint` in the bone chain's joint list.
- GetJointBoneName(int index, int joint) -> string - Returns the bone name at `joint` in the bone chain's joint list.
- GetJointCount(int index) -> int - Returns the joint count of the bone chain's joint list.
- GetRootBone(int index) -> int - Returns the root bone index of the bone chain.
- GetRootBoneName(int index) -> string - Returns the root bone name of the bone chain.
- IsEndBoneExtended(int index) -> bool - Returns `true` if the end bone is extended to have a tail.
- SetEndBone(int index, int bone) - Sets the end bone index of the bone chain.
- SetEndBoneDirection(int index, int boneDirection) - Sets the end bone tail direction of the bone chain when `is_end_bone_extended` is `true`.
- SetEndBoneLength(int index, float length) - Sets the end bone tail length of the bone chain when `is_end_bone_extended` is `true`.
- SetEndBoneName(int index, string boneName) - Sets the end bone name of the bone chain. **Note:** The end bone must be the root bone or a child of the root bone. If they are the same, the tail must be extended by `set_extend_end_bone` to modify the bone.
- SetExtendEndBone(int index, bool enabled) - If `enabled` is `true`, the end bone is extended to have a tail. The extended tail config is allocated to the last element in the joint list. In other words, if you set `enabled` to `false`, the config of the last element in the joint list has no effect in the simulated result.
- SetRootBone(int index, int bone) - Sets the root bone index of the bone chain.
- SetRootBoneName(int index, string boneName) - Sets the root bone name of the bone chain.

