## SkeletonModification2DLookAt <- SkeletonModification2D

This SkeletonModification2D rotates a bone to look a target. This is extremely helpful for moving character's head to look at the player, rotating a turret to look at a target, or any other case where you want to make a bone rotate towards something quickly and easily.

**Props:**
- Bone2dNode: NodePath = NodePath("")
- BoneIndex: int = -1
- TargetNodepath: NodePath = NodePath("")

- **bone2d_node**: The Bone2D node that the modification will operate on.
- **bone_index**: The index of the Bone2D node that the modification will operate on.
- **target_nodepath**: The NodePath to the node that is the target for the LookAt modification. This node is what the modification will rotate the Bone2D to.

**Methods:**
- GetAdditionalRotation() -> float - Returns the amount of additional rotation that is applied after the LookAt modification executes.
- GetConstraintAngleInvert() -> bool - Returns whether the constraints to this modification are inverted or not.
- GetConstraintAngleMax() -> float - Returns the constraint's maximum allowed angle.
- GetConstraintAngleMin() -> float - Returns the constraint's minimum allowed angle.
- GetEnableConstraint() -> bool - Returns `true` if the LookAt modification is using constraints.
- SetAdditionalRotation(float rotation) - Sets the amount of additional rotation that is to be applied after executing the modification. This allows for offsetting the results by the inputted rotation amount.
- SetConstraintAngleInvert(bool invert) - When `true`, the modification will use an inverted joint constraint. An inverted joint constraint only constraints the Bone2D to the angles *outside of* the inputted minimum and maximum angles. For this reason, it is referred to as an inverted joint constraint, as it constraints the joint to the outside of the inputted values.
- SetConstraintAngleMax(float angleMax) - Sets the constraint's maximum allowed angle.
- SetConstraintAngleMin(float angleMin) - Sets the constraint's minimum allowed angle.
- SetEnableConstraint(bool enableConstraint) - Sets whether this modification will use constraints or not. When `true`, constraints will be applied when solving the LookAt modification.

