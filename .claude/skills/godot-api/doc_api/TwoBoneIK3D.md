## TwoBoneIK3D <- IKModifier3D

This IKModifier3D requires a pole target. It provides deterministic results by constructing a plane from each joint and pole target and finding the intersection of two circles (disks in 3D). This IK can handle twist by setting the pole direction. If there are more than one bone between each set bone, their rotations are ignored, and the straight line connecting the root-middle and middle-end joints are treated as virtual bones. **Note:** All the methods in this class take an `index` parameter. This parameter specifies which setting list entry to return if the IK has multiple entries (e.g. `settings/<index>/root_bone_name`).

**Props:**
- SettingCount: int = 0

- **setting_count**: The number of settings.

**Methods:**
- GetEndBone(int index) -> int - Returns the end bone index.
- GetEndBoneDirection(int index) -> int - Returns the end bone's tail direction when `is_end_bone_extended` is `true`.
- GetEndBoneLength(int index) -> float - Returns the end bone tail length of the bone chain when `is_end_bone_extended` is `true`.
- GetEndBoneName(int index) -> string - Returns the end bone name.
- GetMiddleBone(int index) -> int - Returns the middle bone index.
- GetMiddleBoneName(int index) -> string - Returns the middle bone name.
- GetPoleDirection(int index) -> int - Returns the pole direction.
- GetPoleDirectionVector(int index) -> Vector3 - Returns the pole direction vector. If `get_pole_direction` is `SkeletonModifier3D.SECONDARY_DIRECTION_NONE`, this method returns `Vector3(0, 0, 0)`.
- GetPoleNode(int index) -> NodePath - Returns the pole target node that constructs a plane which the joints are all on and the pole is trying to direct.
- GetRootBone(int index) -> int - Returns the root bone index.
- GetRootBoneName(int index) -> string - Returns the root bone name.
- GetTargetNode(int index) -> NodePath - Returns the target node that the end bone is trying to reach.
- IsEndBoneExtended(int index) -> bool - Returns `true` if the end bone is extended to have a tail.
- IsUsingVirtualEnd(int index) -> bool - Returns `true` if the end bone is extended from the middle bone as a virtual bone.
- SetEndBone(int index, int bone) - Sets the end bone index.
- SetEndBoneDirection(int index, int boneDirection) - Sets the end bone tail direction when `is_end_bone_extended` is `true`.
- SetEndBoneLength(int index, float length) - Sets the end bone tail length when `is_end_bone_extended` is `true`.
- SetEndBoneName(int index, string boneName) - Sets the end bone name. **Note:** The end bone must be a child of the middle bone.
- SetExtendEndBone(int index, bool enabled) - If `enabled` is `true`, the end bone is extended to have a tail.
- SetMiddleBone(int index, int bone) - Sets the middle bone index.
- SetMiddleBoneName(int index, string boneName) - Sets the middle bone name. **Note:** The middle bone must be a child of the root bone.
- SetPoleDirection(int index, int direction) - Sets the pole direction. The pole is on the middle bone and will direct to the pole target. The rotation axis is a vector that is orthogonal to this and the forward vector. **Note:** The pole direction and the forward vector shouldn't be colinear to avoid unintended rotation.
- SetPoleDirectionVector(int index, Vector3 vector) - Sets the pole direction vector. This vector is normalized by an internal process. If the vector length is `0`, it is considered synonymous with `SkeletonModifier3D.SECONDARY_DIRECTION_NONE`.
- SetPoleNode(int index, NodePath poleNode) - Sets the pole target node that constructs a plane which the joints are all on and the pole is trying to direct.
- SetRootBone(int index, int bone) - Sets the root bone index.
- SetRootBoneName(int index, string boneName) - Sets the root bone name.
- SetTargetNode(int index, NodePath targetNode) - Sets the target node that the end bone is trying to reach.
- SetUseVirtualEnd(int index, bool enabled) - If `enabled` is `true`, the end bone is extended from the middle bone as a virtual bone.

