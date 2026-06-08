## GraphElement <- Container

GraphElement allows to create custom elements for a GraphEdit graph. By default such elements can be selected, resized, and repositioned, but they cannot be connected. For a graph element that allows for connections see GraphNode.

**Props:**
- Draggable: bool = true
- PositionOffset: Vector2 = Vector2(0, 0)
- Resizable: bool = false
- ScalingMenus: bool = false
- Selectable: bool = true
- Selected: bool = false

- **draggable**: If `true`, the user can drag the GraphElement.
- **position_offset**: The offset of the GraphElement, relative to the scroll offset of the GraphEdit.
- **resizable**: If `true`, the user can resize the GraphElement. **Note:** Dragging the handle will only emit the `resize_request` and `resize_end` signals, the GraphElement needs to be resized manually.
- **scaling_menus**: If `true`, PopupMenus that are descendants of the GraphElement are scaled with the GraphEdit zoom.
- **selectable**: If `true`, the user can select the GraphElement.
- **selected**: If `true`, the GraphElement is selected.

**Signals:**
- DeleteRequest - Emitted when removing the GraphElement is requested.
- Dragged(Vector2 from, Vector2 to) - Emitted when the GraphElement is dragged.
- NodeDeselected - Emitted when the GraphElement is deselected.
- NodeSelected - Emitted when the GraphElement is selected.
- PositionOffsetChanged - Emitted when the GraphElement is moved.
- RaiseRequest - Emitted when displaying the GraphElement over other ones is requested. Happens on focusing (clicking into) the GraphElement.
- ResizeEnd(Vector2 newSize) - Emitted when releasing the mouse button after dragging the resizer handle (see `resizable`).
- ResizeRequest(Vector2 newSize) - Emitted when resizing the GraphElement is requested. Happens on dragging the resizer handle (see `resizable`).

