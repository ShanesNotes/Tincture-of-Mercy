## ConvertTransformModifier3D <- BoneConstraint3D

Apply the copied transform of the bone set by `BoneConstraint3D.set_reference_bone` to the bone set by `BoneConstraint3D.set_apply_bone` about the specific axis with remapping it with some options. There are 4 ways to apply the transform, depending on the combination of `set_relative` and `set_additive`. **Relative + Additive:** - Extract reference pose relative to the rest and add it to the apply bone's pose. **Relative + Not Additive:** - Extract reference pose relative to the rest and add it to the apply bone's rest. **Not Relative + Additive:** - Extract reference pose absolutely and add it to the apply bone's pose. **Not Relative + Not Additive:** - Extract reference pose absolutely and the apply bone's pose is replaced with it. **Note:** Relative option is available only in the case `BoneConstraint3D.get_reference_type` is `BoneConstraint3D.REFERENCE_TYPE_BONE`. See also `BoneConstraint3D.ReferenceType`. **Note:** If there is a rotation greater than `180` degrees with constrained axes, flipping may occur.

**Props:**
- SettingCount: int = 0

- **setting_count**: The number of settings in the modifier.

**Methods:**
- GetApplyAxis(int index) -> int - Returns the axis of the remapping destination transform.
- GetApplyRangeMax(int index) -> float - Returns the maximum value of the remapping destination range.
- GetApplyRangeMin(int index) -> float - Returns the minimum value of the remapping destination range.
- GetApplyTransformMode(int index) -> int - Returns the operation of the remapping destination transform.
- GetReferenceAxis(int index) -> int - Returns the axis of the remapping source transform.
- GetReferenceRangeMax(int index) -> float - Returns the maximum value of the remapping source range.
- GetReferenceRangeMin(int index) -> float - Returns the minimum value of the remapping source range.
- GetReferenceTransformMode(int index) -> int - Returns the operation of the remapping source transform.
- IsAdditive(int index) -> bool - Returns `true` if the additive option is enabled in the setting at `index`.
- IsRelative(int index) -> bool - Returns `true` if the relative option is enabled in the setting at `index`.
- SetAdditive(int index, bool enabled) - Sets additive option in the setting at `index` to `enabled`. This mainly affects the process of applying transform to the `BoneConstraint3D.set_apply_bone`. If sets `enabled` to `true`, the processed transform is added to the pose of the current apply bone. If sets `enabled` to `false`, the pose of the current apply bone is replaced with the processed transform. However, if set `set_relative` to `true`, the transform is relative to rest.
- SetApplyAxis(int index, int axis) - Sets the axis of the remapping destination transform.
- SetApplyRangeMax(int index, float rangeMax) - Sets the maximum value of the remapping destination range.
- SetApplyRangeMin(int index, float rangeMin) - Sets the minimum value of the remapping destination range.
- SetApplyTransformMode(int index, int transformMode) - Sets the operation of the remapping destination transform.
- SetReferenceAxis(int index, int axis) - Sets the axis of the remapping source transform.
- SetReferenceRangeMax(int index, float rangeMax) - Sets the maximum value of the remapping source range.
- SetReferenceRangeMin(int index, float rangeMin) - Sets the minimum value of the remapping source range.
- SetReferenceTransformMode(int index, int transformMode) - Sets the operation of the remapping source transform.
- SetRelative(int index, bool enabled) - Sets relative option in the setting at `index` to `enabled`. If sets `enabled` to `true`, the extracted and applying transform is relative to the rest. If sets `enabled` to `false`, the extracted transform is absolute.

**Enums:**
**TransformMode:** TRANSFORM_MODE_POSITION=0, TRANSFORM_MODE_ROTATION=1, TRANSFORM_MODE_SCALE=2
  - TRANSFORM_MODE_POSITION: Convert with position. Transfer the difference.
  - TRANSFORM_MODE_ROTATION: Convert with rotation. The angle is the roll for the specified axis.
  - TRANSFORM_MODE_SCALE: Convert with scale. Transfers the ratio, not the difference.

