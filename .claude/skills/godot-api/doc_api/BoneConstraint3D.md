## BoneConstraint3D <- SkeletonModifier3D

Base class of SkeletonModifier3D that modifies the bone set in `set_apply_bone` based on the transform of the bone retrieved by `get_reference_bone`. **Note:** Most methods in this class take an `index` parameter. This parameter specifies which setting list entry to return if the IK has multiple entries (e.g. `settings/<index>/amount`).

**Methods:**
- ClearSetting() - Clear all settings.
- GetAmount(int index) -> float - Returns the apply amount of the setting at `index`.
- GetApplyBone(int index) -> int - Returns the apply bone of the setting at `index`. This bone will be modified.
- GetApplyBoneName(int index) -> string - Returns the apply bone name of the setting at `index`. This bone will be modified.
- GetReferenceBone(int index) -> int - Returns the reference bone of the setting at `index`. This bone will be only referenced and not modified by this modifier.
- GetReferenceBoneName(int index) -> string - Returns the reference bone name of the setting at `index`. This bone will be only referenced and not modified by this modifier.
- GetReferenceNode(int index) -> NodePath - Returns the reference node path of the setting at `index`. This node will be only referenced and not modified by this modifier.
- GetReferenceType(int index) -> int - Returns the reference target type of the setting at `index`. See also `ReferenceType`.
- GetSettingCount() -> int - Returns the number of settings in the modifier.
- SetAmount(int index, float amount) - Sets the apply amount of the setting at `index` to `amount`.
- SetApplyBone(int index, int bone) - Sets the apply bone of the setting at `index` to `bone`. This bone will be modified.
- SetApplyBoneName(int index, string boneName) - Sets the apply bone of the setting at `index` to `bone_name`. This bone will be modified.
- SetReferenceBone(int index, int bone) - Sets the reference bone of the setting at `index` to `bone`. This bone will be only referenced and not modified by this modifier.
- SetReferenceBoneName(int index, string boneName) - Sets the reference bone of the setting at `index` to `bone_name`. This bone will be only referenced and not modified by this modifier.
- SetReferenceNode(int index, NodePath node) - Sets the reference node path of the setting at `index` to `node`. This node will be only referenced and not modified by this modifier.
- SetReferenceType(int index, int type) - Sets the reference target type of the setting at `index` to `type`. See also `ReferenceType`.
- SetSettingCount(int count) - Sets the number of settings in the modifier.

**Enums:**
**ReferenceType:** REFERENCE_TYPE_BONE=0, REFERENCE_TYPE_NODE=1
  - REFERENCE_TYPE_BONE: The reference target is a bone. In this case, the reference target spaces is local space.
  - REFERENCE_TYPE_NODE: The reference target is a Node3D. In this case, the reference target spaces is model space. In other words, the reference target's coordinates are treated as if it were placed directly under Skeleton3D which parent of the BoneConstraint3D.

