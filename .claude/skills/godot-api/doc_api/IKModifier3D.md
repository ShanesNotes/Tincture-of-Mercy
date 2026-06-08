## IKModifier3D <- SkeletonModifier3D

Base class of SkeletonModifier3Ds that has some joint lists and applies inverse kinematics. This class has some structs, enums, and helper methods which are useful to solve inverse kinematics.

**Props:**
- MutableBoneAxes: bool = true

- **mutable_bone_axes**: If `true`, the solver retrieves the bone axis from the bone pose every frame. If `false`, the solver retrieves the bone axis from the bone rest and caches it, which increases performance slightly, but position changes in the bone pose made before processing this IKModifier3D are ignored.

**Methods:**
- ClearSettings() - Clears all settings.
- GetSettingCount() -> int - Returns the number of settings.
- Reset() - Resets a state with respect to the current bone pose.
- SetSettingCount(int count) - Sets the number of settings.

