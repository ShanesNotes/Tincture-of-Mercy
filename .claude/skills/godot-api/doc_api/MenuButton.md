## MenuButton <- Button

A button that brings up a PopupMenu when clicked. To create new items inside this PopupMenu, use `get_popup().add_item("My Item Name")`. You can also create them directly from Godot editor's inspector. See also BaseButton which contains common properties and methods associated with this node.

**Props:**
- ActionMode: int (BaseButton.ActionMode) = 0
- Flat: bool = true
- FocusMode: int (Control.FocusMode) = 3
- ItemCount: int = 0
- Popup/item{index}/checkable: int = 0
- Popup/item{index}/checked: bool = false
- Popup/item{index}/disabled: bool = false
- Popup/item{index}/icon: Texture2D
- Popup/item{index}/id: int = 0
- Popup/item{index}/separator: bool = false
- Popup/item{index}/text: string = ""
- SwitchOnHover: bool = false
- ToggleMode: bool = true

- **item_count**: The number of items currently in the list.
- **popup/item_{index}/checkable**: The checkable item type of the item at `index`. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **popup/item_{index}/checked**: If `true`, the item at `index` is checked. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **popup/item_{index}/disabled**: If `true`, the item at `index` is disabled. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **popup/item_{index}/icon**: The icon of the item at `index`. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **popup/item_{index}/id**: The ID of the item at `index`. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **popup/item_{index}/separator**: If `true`, the item at `index` is a separator. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **popup/item_{index}/text**: The text of the item at `index`. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **switch_on_hover**: If `true`, when the cursor hovers above another MenuButton within the same parent which also has `switch_on_hover` enabled, it will close the current MenuButton and open the other one.

**Methods:**
- GetPopup() -> PopupMenu - Returns the PopupMenu contained in this button. **Warning:** This is a required internal node, removing and freeing it may cause a crash. If you wish to hide it or any of its children, use their `Window.visible` property.
- SetDisableShortcuts(bool disabled) - If `true`, shortcuts are disabled and cannot be used to trigger the button.
- ShowPopup() - Adjusts popup position and sizing for the MenuButton, then shows the PopupMenu. Prefer this over using `get_popup().popup()`.

**Signals:**
- AboutToPopup - Emitted when the PopupMenu of this MenuButton is about to show.

