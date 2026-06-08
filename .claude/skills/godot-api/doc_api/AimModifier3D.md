## AimModifier3D <- BoneConstraint3D

This is a simple version of LookAtModifier3D that only allows bone to the reference without advanced options such as angle limitation or time-based interpolation. The feature is simplified, but instead it is implemented with smooth tracking without euler, see `set_use_euler`.

**Props:**
- SettingCount: int = 0

- **setting_count**: The number of settings in the modifier.

**Methods:**
- GetForwardAxis(int index) -> int - Returns the forward axis of the bone.
- GetPrimaryRotationAxis(int index) -> int - Returns the axis of the first rotation. It is enabled only if `is_using_euler` is `true`.
- IsRelative(int index) -> bool - Returns `true` if the relative option is enabled in the setting at `index`.
- IsUsingEuler(int index) -> bool - Returns `true` if it provides rotation with using euler.
- IsUsingSecondaryRotation(int index) -> bool - Returns `true` if it provides rotation by two axes. It is enabled only if `is_using_euler` is `true`.
- SetForwardAxis(int index, int axis) - Sets the forward axis of the bone.
- SetPrimaryRotationAxis(int index, int axis) - Sets the axis of the first rotation. It is enabled only if `is_using_euler` is `true`.
- SetRelative(int index, bool enabled) - Sets relative option in the setting at `index` to `enabled`. If sets `enabled` to `true`, the rotation is applied relative to the pose. If sets `enabled` to `false`, the rotation is applied relative to the rest. It means to replace the current pose with the AimModifier3D's result.
- SetUseEuler(int index, bool enabled) - If sets `enabled` to `true`, it provides rotation with using euler. If sets `enabled` to `false`, it provides rotation with using rotation by arc generated from the forward axis vector and the vector toward the reference.
- SetUseSecondaryRotation(int index, bool enabled) - If sets `enabled` to `true`, it provides rotation by two axes. It is enabled only if `is_using_euler` is `true`.

