## GraphNode <- GraphElement

GraphNode allows to create nodes for a GraphEdit graph with customizable content based on its child controls. GraphNode is derived from Container and it is responsible for placing its children on screen. This works similar to VBoxContainer. Children, in turn, provide GraphNode with so-called slots, each of which can have a connection port on either side. Each GraphNode slot is defined by its index and can provide the node with up to two ports: one on the left, and one on the right. By convention the left port is also referred to as the **input port** and the right port is referred to as the **output port**. Each port can be enabled and configured individually, using different type and color. The type is an arbitrary value that you can define using your own considerations. The parent GraphEdit will receive this information on each connect and disconnect request. Slots can be configured in the Inspector dock once you add at least one child Control. The properties are grouped by each slot's index in the "Slot" section. **Note:** While GraphNode is set up using slots and slot indices, connections are made between the ports which are enabled. Because of that GraphEdit uses the port's index and not the slot's index. You can use `get_input_port_slot` and `get_output_port_slot` to get the slot index from the port index.

**Props:**
- FocusMode: int (Control.FocusMode) = 3
- IgnoreInvalidConnectionType: bool = false
- MouseFilter: int (Control.MouseFilter) = 0
- SlotsFocusMode: int (Control.FocusMode) = 3
- Title: string = ""

- **ignore_invalid_connection_type**: If `true`, you can connect ports with different types, even if the connection was not explicitly allowed in the parent GraphEdit.
- **slots_focus_mode**: Determines how connection slots can be focused. - If set to `Control.FOCUS_CLICK`, connections can only be made with the mouse. - If set to `Control.FOCUS_ALL`, slots can also be focused using the `ProjectSettings.input/ui_up` and `ProjectSettings.input/ui_down` and connected using `ProjectSettings.input/ui_left` and `ProjectSettings.input/ui_right` input actions. - If set to `Control.FOCUS_ACCESSIBILITY`, slot input actions are only enabled when the screen reader is active.
- **title**: The text displayed in the GraphNode's title bar.

**Methods:**
- DrawPort(int slotIndex, Vector2i position, bool left, Color color)
- ClearAllSlots() - Disables all slots of the GraphNode. This will remove all input/output ports from the GraphNode.
- ClearSlot(int slotIndex) - Disables the slot with the given `slot_index`. This will remove the corresponding input and output port from the GraphNode.
- GetInputPortColor(int portIdx) -> Color - Returns the Color of the input port with the given `port_idx`.
- GetInputPortCount() -> int - Returns the number of slots with an enabled input port.
- GetInputPortPosition(int portIdx) -> Vector2 - Returns the position of the input port with the given `port_idx`.
- GetInputPortSlot(int portIdx) -> int - Returns the corresponding slot index of the input port with the given `port_idx`.
- GetInputPortType(int portIdx) -> int - Returns the type of the input port with the given `port_idx`.
- GetOutputPortColor(int portIdx) -> Color - Returns the Color of the output port with the given `port_idx`.
- GetOutputPortCount() -> int - Returns the number of slots with an enabled output port.
- GetOutputPortPosition(int portIdx) -> Vector2 - Returns the position of the output port with the given `port_idx`.
- GetOutputPortSlot(int portIdx) -> int - Returns the corresponding slot index of the output port with the given `port_idx`.
- GetOutputPortType(int portIdx) -> int - Returns the type of the output port with the given `port_idx`.
- GetSlotColorLeft(int slotIndex) -> Color - Returns the left (input) Color of the slot with the given `slot_index`.
- GetSlotColorRight(int slotIndex) -> Color - Returns the right (output) Color of the slot with the given `slot_index`.
- GetSlotCustomIconLeft(int slotIndex) -> Texture2D - Returns the left (input) custom Texture2D of the slot with the given `slot_index`.
- GetSlotCustomIconRight(int slotIndex) -> Texture2D - Returns the right (output) custom Texture2D of the slot with the given `slot_index`.
- GetSlotMetadataLeft(int slotIndex) -> Variant - Returns the left (input) metadata of the slot with the given `slot_index`.
- GetSlotMetadataRight(int slotIndex) -> Variant - Returns the right (output) metadata of the slot with the given `slot_index`.
- GetSlotTypeLeft(int slotIndex) -> int - Returns the left (input) type of the slot with the given `slot_index`.
- GetSlotTypeRight(int slotIndex) -> int - Returns the right (output) type of the slot with the given `slot_index`.
- GetTitlebarHbox() -> HBoxContainer - Returns the HBoxContainer used for the title bar, only containing a Label for displaying the title by default. This can be used to add custom controls to the title bar such as option or close buttons.
- IsSlotDrawStylebox(int slotIndex) -> bool - Returns `true` if the background StyleBox of the slot with the given `slot_index` is drawn.
- IsSlotEnabledLeft(int slotIndex) -> bool - Returns `true` if left (input) side of the slot with the given `slot_index` is enabled.
- IsSlotEnabledRight(int slotIndex) -> bool - Returns `true` if right (output) side of the slot with the given `slot_index` is enabled.
- SetSlot(int slotIndex, bool enableLeftPort, int typeLeft, Color colorLeft, bool enableRightPort, int typeRight, Color colorRight, Texture2D customIconLeft = null, Texture2D customIconRight = null, bool drawStylebox = true) - Sets properties of the slot with the given `slot_index`. If `enable_left_port`/`enable_right_port` is `true`, a port will appear and the slot will be able to be connected from this side. With `type_left`/`type_right` an arbitrary type can be assigned to each port. Two ports can be connected if they share the same type, or if the connection between their types is allowed in the parent GraphEdit (see `GraphEdit.add_valid_connection_type`). Keep in mind that the GraphEdit has the final say in accepting the connection. Type compatibility simply allows the `GraphEdit.connection_request` signal to be emitted. Ports can be further customized using `color_left`/`color_right` and `custom_icon_left`/`custom_icon_right`. The color parameter adds a tint to the icon. The custom icon can be used to override the default port dot. Additionally, `draw_stylebox` can be used to enable or disable drawing of the background stylebox for each slot. See [theme_item slot]. Individual properties can also be set using one of the `set_slot_*` methods. **Note:** This method only sets properties of the slot. To create the slot itself, add a Control-derived child to the GraphNode.
- SetSlotColorLeft(int slotIndex, Color color) - Sets the Color of the left (input) side of the slot with the given `slot_index` to `color`.
- SetSlotColorRight(int slotIndex, Color color) - Sets the Color of the right (output) side of the slot with the given `slot_index` to `color`.
- SetSlotCustomIconLeft(int slotIndex, Texture2D customIcon) - Sets the custom Texture2D of the left (input) side of the slot with the given `slot_index` to `custom_icon`.
- SetSlotCustomIconRight(int slotIndex, Texture2D customIcon) - Sets the custom Texture2D of the right (output) side of the slot with the given `slot_index` to `custom_icon`.
- SetSlotDrawStylebox(int slotIndex, bool enable) - Toggles the background StyleBox of the slot with the given `slot_index`.
- SetSlotEnabledLeft(int slotIndex, bool enable) - Toggles the left (input) side of the slot with the given `slot_index`. If `enable` is `true`, a port will appear on the left side and the slot will be able to be connected from this side.
- SetSlotEnabledRight(int slotIndex, bool enable) - Toggles the right (output) side of the slot with the given `slot_index`. If `enable` is `true`, a port will appear on the right side and the slot will be able to be connected from this side.
- SetSlotMetadataLeft(int slotIndex, Variant value) - Sets the custom metadata for the left (input) side of the slot with the given `slot_index` to `value`.
- SetSlotMetadataRight(int slotIndex, Variant value) - Sets the custom metadata for the right (output) side of the slot with the given `slot_index` to `value`.
- SetSlotTypeLeft(int slotIndex, int type) - Sets the left (input) type of the slot with the given `slot_index` to `type`. If the value is negative, all connections will be disallowed to be created via user inputs.
- SetSlotTypeRight(int slotIndex, int type) - Sets the right (output) type of the slot with the given `slot_index` to `type`. If the value is negative, all connections will be disallowed to be created via user inputs.

**Signals:**
- SlotSizesChanged - Emitted when any slot's size might have changed.
- SlotUpdated(int slotIndex) - Emitted when any GraphNode's slot is updated.

