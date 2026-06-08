## SplineIK3D <- ChainIK3D

A SkeletonModifier3D for aligning bones along a Path3D. The smoothness of the fitting depends on the `Curve3D.bake_interval`. If you want the Path3D to attach to a specific bone, it is recommended to place a ModifierBoneTarget3D before the SplineIK3D in the SkeletonModifier3D list (children of the Skeleton3D), and then place a Path3D as the ModifierBoneTarget3D's child. Bone twist is determined based on the `Curve3D.get_point_tilt`. If the root bone joint and the start point of the Curve3D are separated, it assumes that there is a linear line segment between them. This means that the vector pointing toward the start point of the Curve3D takes precedence over the shortest intersection point along the Curve3D. If the end bone joint exceeds the path length, it is bent as close as possible to the end point of the Curve3D. **Note:** All the methods in this class take an `index` parameter. This parameter specifies which setting list entry to return if the IK has multiple entries (e.g. `settings/<index>/root_bone_name`).

**Props:**
- SettingCount: int = 0

- **setting_count**: The number of settings.

**Methods:**
- GetPath3d(int index) -> NodePath - Returns the node path of the Path3D which is describing the path.
- GetTiltFadeIn(int index) -> int - Returns the tilt interpolation method used between the root bone and the start point of the Curve3D when they are apart. See also `set_tilt_fade_in`.
- GetTiltFadeOut(int index) -> int - Returns the tilt interpolation method used between the end bone and the end point of the Curve3D when they are apart. See also `set_tilt_fade_out`.
- IsTiltEnabled(int index) -> bool - Returns if the tilt property of the Curve3D affects the bone twist.
- SetPath3d(int index, NodePath path3d) - Sets the node path of the Path3D which is describing the path.
- SetTiltEnabled(int index, bool enabled) - Sets if the tilt property of the Curve3D should affect the bone twist.
- SetTiltFadeIn(int index, int size) - If `size` is greater than `0`, the tilt is interpolated between `size` start bones from the start point of the Curve3D when they are apart. If `size` is equal `0`, the tilts between the root bone head and the start point of the Curve3D are unified with a tilt of the start point of the Curve3D. If `size` is less than `0`, the tilts between the root bone and the start point of the Curve3D are `0.0`.
- SetTiltFadeOut(int index, int size) - If `size` is greater than `0`, the tilt is interpolated between `size` end bones from the end point of the Curve3D when they are apart. If `size` is equal `0`, the tilts between the end bone tail and the end point of the Curve3D are unified with a tilt of the end point of the Curve3D. If `size` is less than `0`, the tilts between the end bone and the end point of the Curve3D are `0.0`.

