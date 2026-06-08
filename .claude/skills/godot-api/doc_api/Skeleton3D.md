## Skeleton3D <- Node3D

Skeleton3D provides an interface for managing a hierarchy of bones, including pose, rest and animation (see Animation). It can also use ragdoll physics. The overall transform of a bone with respect to the skeleton is determined by bone pose. Bone rest defines the initial transform of the bone pose. Note that "global pose" below refers to the overall transform of the bone with respect to skeleton, so it is not the actual global/world transform of the bone.

**Props:**
- AnimatePhysicalBones: bool = true
- ModifierCallbackModeProcess: int (Skeleton3D.ModifierCallbackModeProcess) = 1
- MotionScale: float = 1.0
- ShowRestOnly: bool = false

- **animate_physical_bones**: If you follow the recommended workflow and explicitly have PhysicalBoneSimulator3D as a child of Skeleton3D, you can control whether it is affected by raycasting without running `physical_bones_start_simulation`, by its `SkeletonModifier3D.active`. However, for old (deprecated) configurations, Skeleton3D has an internal virtual PhysicalBoneSimulator3D for compatibility. This property controls the internal virtual PhysicalBoneSimulator3D's `SkeletonModifier3D.active`.
- **modifier_callback_mode_process**: Sets the processing timing for the Modifier.
- **motion_scale**: Multiplies the 3D position track animation. **Note:** Unless this value is `1.0`, the key value in animation will not match the actual position value.
- **show_rest_only**: If `true`, forces the bones in their default rest pose, regardless of their values. In the editor, this also prevents the bones from being edited.

**Methods:**
- AddBone(string name) -> int - Adds a new bone with the given name. Returns the new bone's index, or `-1` if this method fails. **Note:** Bone names should be unique, non empty, and cannot include the `:` and `/` characters.
- Advance(float delta) - Manually advance the child SkeletonModifier3Ds by the specified time (in seconds). **Note:** The `delta` is temporarily accumulated in the Skeleton3D, and the deferred process uses the accumulated value to process the modification.
- ClearBones() - Clear all the bones in this skeleton.
- ClearBonesGlobalPoseOverride() - Removes the global pose override on all bones in the skeleton.
- CreateSkinFromRestTransforms() -> Skin
- FindBone(string name) -> int - Returns the bone index that matches `name` as its name. Returns `-1` if no bone with this name exists.
- ForceUpdateAllBoneTransforms() - Force updates the bone transforms/poses for all bones in the skeleton.
- ForceUpdateBoneChildTransform(int boneIdx) - Force updates the bone transform for the bone at `bone_idx` and all of its children.
- GetBoneChildren(int boneIdx) -> int[] - Returns an array containing the bone indexes of all the child node of the passed in bone, `bone_idx`.
- GetBoneCount() -> int - Returns the number of bones in the skeleton.
- GetBoneGlobalPose(int boneIdx) -> Transform3D - Returns the overall transform of the specified bone, with respect to the skeleton. Being relative to the skeleton frame, this is not the actual "global" transform of the bone. **Note:** This is the global pose you set to the skeleton in the process, the final global pose can get overridden by modifiers in the deferred process, if you want to access the final global pose, use `SkeletonModifier3D.modification_processed`.
- GetBoneGlobalPoseNoOverride(int boneIdx) -> Transform3D - Returns the overall transform of the specified bone, with respect to the skeleton, but without any global pose overrides. Being relative to the skeleton frame, this is not the actual "global" transform of the bone.
- GetBoneGlobalPoseOverride(int boneIdx) -> Transform3D - Returns the global pose override transform for `bone_idx`.
- GetBoneGlobalRest(int boneIdx) -> Transform3D - Returns the global rest transform for `bone_idx`.
- GetBoneMeta(int boneIdx, StringName key) -> Variant - Returns the metadata with the given `key` for the bone at index `bone_idx`.
- GetBoneMetaList(int boneIdx) -> StringName[] - Returns the list of all metadata keys for the bone at index `bone_idx`.
- GetBoneName(int boneIdx) -> string - Returns the name of the bone at index `bone_idx`.
- GetBoneParent(int boneIdx) -> int - Returns the bone index which is the parent of the bone at `bone_idx`. If -1, then bone has no parent. **Note:** The parent bone returned will always be less than `bone_idx`.
- GetBonePose(int boneIdx) -> Transform3D - Returns the pose transform of the specified bone. **Note:** This is the pose you set to the skeleton in the process, the final pose can get overridden by modifiers in the deferred process, if you want to access the final pose, use `SkeletonModifier3D.modification_processed`.
- GetBonePosePosition(int boneIdx) -> Vector3 - Returns the pose position of the bone at `bone_idx`. The returned Vector3 is in the local coordinate space of the Skeleton3D node.
- GetBonePoseRotation(int boneIdx) -> Quaternion - Returns the pose rotation of the bone at `bone_idx`. The returned Quaternion is local to the bone with respect to the rotation of any parent bones.
- GetBonePoseScale(int boneIdx) -> Vector3 - Returns the pose scale of the bone at `bone_idx`.
- GetBoneRest(int boneIdx) -> Transform3D - Returns the rest transform for a bone `bone_idx`.
- GetConcatenatedBoneNames() -> StringName - Returns all bone names concatenated with commas (`,`) as a single StringName. It is useful to set it as a hint for the enum property.
- GetParentlessBones() -> int[] - Returns an array with all of the bones that are parentless. Another way to look at this is that it returns the indexes of all the bones that are not dependent or modified by other bones in the Skeleton.
- GetVersion() -> int - Returns the number of times the bone hierarchy has changed within this skeleton, including renames. The Skeleton version is not serialized: only use within a single instance of Skeleton3D. Use for invalidating caches in IK solvers and other nodes which process bones.
- HasBoneMeta(int boneIdx, StringName key) -> bool - Returns `true` if the bone at index `bone_idx` has metadata with the given `key`.
- IsBoneEnabled(int boneIdx) -> bool - Returns whether the bone pose for the bone at `bone_idx` is enabled.
- LocalizeRests() - Returns all bones in the skeleton to their rest poses.
- PhysicalBonesAddCollisionException(Rid exception) - Adds a collision exception to the physical bone. Works just like the RigidBody3D node.
- PhysicalBonesRemoveCollisionException(Rid exception) - Removes a collision exception to the physical bone. Works just like the RigidBody3D node.
- PhysicalBonesStartSimulation(StringName[] bones = []) - Tells the PhysicalBone3D nodes in the Skeleton to start simulating and reacting to the physics world. Optionally, a list of bone names can be passed-in, allowing only the passed-in bones to be simulated.
- PhysicalBonesStopSimulation() - Tells the PhysicalBone3D nodes in the Skeleton to stop simulating.
- RegisterSkin(Skin skin) -> SkinReference - Binds the given Skin to the Skeleton.
- ResetBonePose(int boneIdx) - Sets the bone pose to rest for `bone_idx`.
- ResetBonePoses() - Sets all bone poses to rests.
- SetBoneEnabled(int boneIdx, bool enabled = true) - Disables the pose for the bone at `bone_idx` if `false`, enables the bone pose if `true`.
- SetBoneGlobalPose(int boneIdx, Transform3D pose) - Sets the global pose transform, `pose`, for the bone at `bone_idx`. **Note:** If other bone poses have been changed, this method executes a dirty poses recalculation and will cause performance to deteriorate. If you know that multiple global poses will be applied, consider using `set_bone_pose` with precalculation.
- SetBoneGlobalPoseOverride(int boneIdx, Transform3D pose, float amount, bool persistent = false) - Sets the global pose transform, `pose`, for the bone at `bone_idx`. `amount` is the interpolation strength that will be used when applying the pose, and `persistent` determines if the applied pose will remain. **Note:** The pose transform needs to be a global pose! To convert a world transform from a Node3D to a global bone pose, multiply the `Transform3D.affine_inverse` of the node's `Node3D.global_transform` by the desired world transform.
- SetBoneMeta(int boneIdx, StringName key, Variant value) - Sets the metadata with the given `key` to `value` for the bone at index `bone_idx`.
- SetBoneName(int boneIdx, string name) - Sets the bone name, `name`, for the bone at `bone_idx`.
- SetBoneParent(int boneIdx, int parentIdx) - Sets the bone index `parent_idx` as the parent of the bone at `bone_idx`. If -1, then bone has no parent. **Note:** `parent_idx` must be less than `bone_idx`.
- SetBonePose(int boneIdx, Transform3D pose) - Sets the pose transform, `pose`, for the bone at `bone_idx`.
- SetBonePosePosition(int boneIdx, Vector3 position) - Sets the pose position of the bone at `bone_idx` to `position`. `position` is a Vector3 describing a position local to the Skeleton3D node.
- SetBonePoseRotation(int boneIdx, Quaternion rotation) - Sets the pose rotation of the bone at `bone_idx` to `rotation`. `rotation` is a Quaternion describing a rotation in the bone's local coordinate space with respect to the rotation of any parent bones.
- SetBonePoseScale(int boneIdx, Vector3 scale) - Sets the pose scale of the bone at `bone_idx` to `scale`.
- SetBoneRest(int boneIdx, Transform3D rest) - Sets the rest transform for bone `bone_idx`.
- UnparentBoneAndRest(int boneIdx) - Unparents the bone at `bone_idx` and sets its rest position to that of its parent prior to being reset.

**Signals:**
- BoneEnabledChanged(int boneIdx) - Emitted when the bone at `bone_idx` is toggled with `set_bone_enabled`. Use `is_bone_enabled` to check the new value.
- BoneListChanged - Emitted when the list of bones changes, such as when calling `add_bone`, `set_bone_parent`, `unparent_bone_and_rest`, or `clear_bones`.
- PoseUpdated - Emitted when the pose is updated. **Note:** During the update process, this signal is not fired, so modification by SkeletonModifier3D is not detected.
- RestUpdated - Emitted when the rest is updated.
- ShowRestOnlyChanged - Emitted when the value of `show_rest_only` changes.
- SkeletonUpdated - Emitted when the final pose has been calculated will be applied to the skin in the update process. This means that all SkeletonModifier3D processing is complete. In order to detect the completion of the processing of each SkeletonModifier3D, use `SkeletonModifier3D.modification_processed`.

**Enums:**
**Constants:** NOTIFICATION_UPDATE_SKELETON=50
  - NOTIFICATION_UPDATE_SKELETON: Notification received when this skeleton's pose needs to be updated. In that case, this is called only once per frame in a deferred process.
**ModifierCallbackModeProcess:** MODIFIER_CALLBACK_MODE_PROCESS_PHYSICS=0, MODIFIER_CALLBACK_MODE_PROCESS_IDLE=1, MODIFIER_CALLBACK_MODE_PROCESS_MANUAL=2
  - MODIFIER_CALLBACK_MODE_PROCESS_PHYSICS: Set a flag to process modification during physics frames (see `Node.NOTIFICATION_INTERNAL_PHYSICS_PROCESS`).
  - MODIFIER_CALLBACK_MODE_PROCESS_IDLE: Set a flag to process modification during process frames (see `Node.NOTIFICATION_INTERNAL_PROCESS`).
  - MODIFIER_CALLBACK_MODE_PROCESS_MANUAL: Do not process modification. Use `advance` to process the modification manually.

