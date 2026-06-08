## SkeletonModificationStack2D <- Resource

This resource is used by the Skeleton and holds a stack of SkeletonModification2Ds. This controls the order of the modifications and how they are applied. Modification order is especially important for full-body IK setups, as you need to execute the modifications in the correct order to get the desired results. For example, you want to execute a modification on the spine *before* the arms on a humanoid skeleton. This resource also controls how strongly all of the modifications are applied to the Skeleton2D.

**Props:**
- Enabled: bool = false
- ModificationCount: int = 0
- Strength: float = 1.0

- **enabled**: If `true`, the modification's in the stack will be called. This is handled automatically through the Skeleton2D node.
- **modification_count**: The number of modifications in the stack.
- **strength**: The interpolation strength of the modifications in stack. A value of `0` will make it where the modifications are not applied, a strength of `0.5` will be half applied, and a strength of `1` will allow the modifications to be fully applied and override the Skeleton2D Bone2D poses.

**Methods:**
- AddModification(SkeletonModification2D modification) - Adds the passed-in SkeletonModification2D to the stack.
- DeleteModification(int modIdx) - Deletes the SkeletonModification2D at the index position `mod_idx`, if it exists.
- EnableAllModifications(bool enabled) - Enables all SkeletonModification2Ds in the stack.
- Execute(float delta, int executionMode) - Executes all of the SkeletonModification2Ds in the stack that use the same execution mode as the passed-in `execution_mode`, starting from index `0` to `modification_count`. **Note:** The order of the modifications can matter depending on the modifications. For example, modifications on a spine should operate before modifications on the arms in order to get proper results.
- GetIsSetup() -> bool - Returns a boolean that indicates whether the modification stack is setup and can execute.
- GetModification(int modIdx) -> SkeletonModification2D - Returns the SkeletonModification2D at the passed-in index, `mod_idx`.
- GetSkeleton() -> Skeleton2D - Returns the Skeleton2D node that the SkeletonModificationStack2D is bound to.
- SetModification(int modIdx, SkeletonModification2D modification) - Sets the modification at `mod_idx` to the passed-in modification, `modification`.
- Setup() - Sets up the modification stack so it can execute. This function should be called by Skeleton2D and shouldn't be manually called unless you know what you are doing.

