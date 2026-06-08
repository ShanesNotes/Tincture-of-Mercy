## SkeletonProfile <- Resource

This resource is used in EditorScenePostImport. Some parameters are referring to bones in Skeleton3D, Skin, Animation, and some other nodes are rewritten based on the parameters of SkeletonProfile. **Note:** These parameters need to be set only when creating a custom profile. In SkeletonProfileHumanoid, they are defined internally as read-only values.

**Props:**
- BoneSize: int = 0
- GroupSize: int = 0
- RootBone: StringName = &""
- ScaleBaseBone: StringName = &""

- **bone_size**: The amount of bones in retargeting section's BoneMap editor. For example, SkeletonProfileHumanoid has 56 bones. The size of elements in BoneMap updates when changing this property in it's assigned SkeletonProfile.
- **group_size**: The amount of groups of bones in retargeting section's BoneMap editor. For example, SkeletonProfileHumanoid has 4 groups. This property exists to separate the bone list into several sections in the editor.
- **root_bone**: A bone name that will be used as the root bone in AnimationTree. This should be the bone of the parent of hips that exists at the world origin.
- **scale_base_bone**: A bone name which will use model's height as the coefficient for normalization. For example, SkeletonProfileHumanoid defines it as `Hips`.

**Methods:**
- FindBone(StringName boneName) -> int - Returns the bone index that matches `bone_name` as its name.
- GetBoneName(int boneIdx) -> StringName - Returns the name of the bone at `bone_idx` that will be the key name in the BoneMap. In the retargeting process, the returned bone name is the bone name of the target skeleton.
- GetBoneParent(int boneIdx) -> StringName - Returns the name of the bone which is the parent to the bone at `bone_idx`. The result is empty if the bone has no parent.
- GetBoneTail(int boneIdx) -> StringName - Returns the name of the bone which is the tail of the bone at `bone_idx`.
- GetGroup(int boneIdx) -> StringName - Returns the group of the bone at `bone_idx`.
- GetGroupName(int groupIdx) -> StringName - Returns the name of the group at `group_idx` that will be the drawing group in the BoneMap editor.
- GetHandleOffset(int boneIdx) -> Vector2 - Returns the offset of the bone at `bone_idx` that will be the button position in the BoneMap editor. This is the offset with origin at the top left corner of the square.
- GetReferencePose(int boneIdx) -> Transform3D - Returns the reference pose transform for bone `bone_idx`.
- GetTailDirection(int boneIdx) -> int - Returns the tail direction of the bone at `bone_idx`.
- GetTexture(int groupIdx) -> Texture2D - Returns the texture of the group at `group_idx` that will be the drawing group background image in the BoneMap editor.
- IsRequired(int boneIdx) -> bool - Returns whether the bone at `bone_idx` is required for retargeting. This value is used by the bone map editor. If this method returns `true`, and no bone is assigned, the handle color will be red on the bone map editor.
- SetBoneName(int boneIdx, StringName boneName) - Sets the name of the bone at `bone_idx` that will be the key name in the BoneMap. In the retargeting process, the setting bone name is the bone name of the target skeleton.
- SetBoneParent(int boneIdx, StringName boneParent) - Sets the bone with name `bone_parent` as the parent of the bone at `bone_idx`. If an empty string is passed, then the bone has no parent.
- SetBoneTail(int boneIdx, StringName boneTail) - Sets the bone with name `bone_tail` as the tail of the bone at `bone_idx`.
- SetGroup(int boneIdx, StringName group) - Sets the group of the bone at `bone_idx`.
- SetGroupName(int groupIdx, StringName groupName) - Sets the name of the group at `group_idx` that will be the drawing group in the BoneMap editor.
- SetHandleOffset(int boneIdx, Vector2 handleOffset) - Sets the offset of the bone at `bone_idx` that will be the button position in the BoneMap editor. This is the offset with origin at the top left corner of the square.
- SetReferencePose(int boneIdx, Transform3D boneName) - Sets the reference pose transform for bone `bone_idx`.
- SetRequired(int boneIdx, bool required) - Sets the required status for bone `bone_idx` to `required`.
- SetTailDirection(int boneIdx, int tailDirection) - Sets the tail direction of the bone at `bone_idx`. **Note:** This only specifies the method of calculation. The actual coordinates required should be stored in an external skeleton, so the calculation itself needs to be done externally.
- SetTexture(int groupIdx, Texture2D texture) - Sets the texture of the group at `group_idx` that will be the drawing group background image in the BoneMap editor.

**Signals:**
- ProfileUpdated - This signal is emitted when change the value in profile. This is used to update key name in the BoneMap and to redraw the BoneMap editor. **Note:** This signal is not connected directly to editor to simplify the reference, instead it is passed on to editor through the BoneMap.

**Enums:**
**TailDirection:** TAIL_DIRECTION_AVERAGE_CHILDREN=0, TAIL_DIRECTION_SPECIFIC_CHILD=1, TAIL_DIRECTION_END=2
  - TAIL_DIRECTION_AVERAGE_CHILDREN: Direction to the average coordinates of bone children.
  - TAIL_DIRECTION_SPECIFIC_CHILD: Direction to the coordinates of specified bone child.
  - TAIL_DIRECTION_END: Direction is not calculated.

