## FoldableGroup <- Resource

A group of FoldableContainer-derived nodes. Only one container can be expanded at a time.

**Props:**
- AllowFoldingAll: bool = false
- ResourceLocalToScene: bool = true

- **allow_folding_all**: If `true`, it is possible to fold all containers in this FoldableGroup.

**Methods:**
- GetContainers() -> FoldableContainer[] - Returns an Array of FoldableContainers that have this as their FoldableGroup (see `FoldableContainer.foldable_group`). This is equivalent to ButtonGroup but for FoldableContainers.
- GetExpandedContainer() -> FoldableContainer - Returns the current expanded container.

**Signals:**
- Expanded(FoldableContainer container) - Emitted when one of the containers of the group is expanded.

