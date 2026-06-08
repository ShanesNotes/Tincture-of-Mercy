## ItemList <- Control

This control provides a vertical list of selectable items that may be in a single or in multiple columns, with each item having options for text and an icon. Tooltips are supported and may be different for every item in the list. Selectable items in the list may be selected or deselected and multiple selection may be enabled. Selection with right mouse button may also be enabled to allow use of popup context menus. Items may also be "activated" by double-clicking them or by pressing [kbd]Enter[/kbd]. Item text only supports single-line strings. Newline characters (e.g. `\n`) in the string won't produce a newline. Text wrapping is enabled in `ICON_MODE_TOP` mode, but the column's width is adjusted to fully fit its content by default. You need to set `fixed_column_width` greater than zero to wrap the text. All `set_*` methods allow negative item indices, i.e. `-1` to access the last item, `-2` to select the second-to-last item, and so on. **Incremental search:** Like PopupMenu and Tree, ItemList supports searching within the list while the control is focused. Press a key that matches the first letter of an item's name to select the first item starting with the given letter. After that point, there are two ways to perform incremental search: 1) Press the same key again before the timeout duration to select the next item starting with the same letter. 2) Press letter keys that match the rest of the word before the timeout duration to match to select the item in question directly. Both of these actions will be reset to the beginning of the list if the timeout duration has passed since the last keystroke was registered. You can adjust the timeout duration by changing `ProjectSettings.gui/timers/incremental_search_max_interval_msec`.

**Props:**
- AllowReselect: bool = false
- AllowRmbSelect: bool = false
- AllowSearch: bool = true
- AutoHeight: bool = false
- AutoWidth: bool = false
- ClipContents: bool = true
- FixedColumnWidth: int = 0
- FixedIconSize: Vector2i = Vector2i(0, 0)
- FocusMode: int (Control.FocusMode) = 2
- IconMode: int (ItemList.IconMode) = 1
- IconScale: float = 1.0
- ItemCount: int = 0
- Item{index}/disabled: bool = false
- Item{index}/icon: Texture2D
- Item{index}/selectable: bool = true
- Item{index}/text: string = ""
- MaxColumns: int = 1
- MaxTextLines: int = 1
- SameColumnWidth: bool = false
- ScrollHintMode: int (ItemList.ScrollHintMode) = 0
- SelectMode: int (ItemList.SelectMode) = 0
- TextOverrunBehavior: int (TextServer.OverrunBehavior) = 3
- TileScrollHint: bool = false
- WraparoundItems: bool = true

- **allow_reselect**: If `true`, the currently selected item can be selected again.
- **allow_rmb_select**: If `true`, right mouse button click can select items.
- **allow_search**: If `true`, allows navigating the ItemList with letter keys through incremental search.
- **auto_height**: If `true`, the control will automatically resize the height to fit its content.
- **auto_width**: If `true`, the control will automatically resize the width to fit its content.
- **fixed_column_width**: The width all columns will be adjusted to. A value of zero disables the adjustment, each item will have a width equal to the width of its content and the columns will have an uneven width.
- **fixed_icon_size**: The size all icons will be adjusted to. If either X or Y component is not greater than zero, icon size won't be affected.
- **icon_mode**: The icon position, whether above or to the left of the text. See the `IconMode` constants.
- **icon_scale**: The scale of icon applied after `fixed_icon_size` and transposing takes effect.
- **item_count**: The number of items currently in the list.
- **item_{index}/disabled**: If `true`, the item at `index` is disabled. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **item_{index}/icon**: The icon of the item at `index`. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **item_{index}/selectable**: If `true`, the item at `index` is selectable. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **item_{index}/text**: The text of the item at `index`. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **max_columns**: Maximum columns the list will have. If greater than zero, the content will be split among the specified columns. A value of zero means unlimited columns, i.e. all items will be put in the same row.
- **max_text_lines**: Maximum lines of text allowed in each item. Space will be reserved even when there is not enough lines of text to display. **Note:** This property takes effect only when `icon_mode` is `ICON_MODE_TOP`. To make the text wrap, `fixed_column_width` should be greater than zero.
- **same_column_width**: Whether all columns will have the same width. If `true`, the width is equal to the largest column width of all columns.
- **scroll_hint_mode**: The way which scroll hints (indicators that show that the content can still be scrolled in a certain direction) will be shown.
- **select_mode**: Allows single or multiple item selection. See the `SelectMode` constants.
- **text_overrun_behavior**: The clipping behavior when the text exceeds an item's bounding rectangle.
- **tile_scroll_hint**: If `true`, the scroll hint texture will be tiled instead of stretched. See `scroll_hint_mode`.
- **wraparound_items**: If `true`, the control will automatically move items into a new row to fit its content. See also HFlowContainer for this behavior. If `false`, the control will add a horizontal scrollbar to make all items visible.

**Methods:**
- AddIconItem(Texture2D icon, bool selectable = true) -> int - Adds an item to the item list with no text, only an icon. Returns the index of an added item.
- AddItem(string text, Texture2D icon = null, bool selectable = true) -> int - Adds an item to the item list with specified text. Returns the index of an added item. Specify an `icon`, or use `null` as the `icon` for a list item with no icon. If `selectable` is `true`, the list item will be selectable.
- CenterOnCurrent(bool centerVerically = true, bool centerHorizontally = true) - Ensures the currently selected item (the first selected item if multiple selection is enabled) is visible, adjusting the scroll position as necessary to place the item at the center of the list if possible. See also `ensure_current_is_visible`. Fails and prints an error if both arguments are `false`.
- Clear() - Removes all items from the list.
- Deselect(int idx) - Ensures the item associated with the specified index is not selected.
- DeselectAll() - Ensures there are no items selected.
- EnsureCurrentIsVisible() - Ensures the currently selected item (the first selected item if multiple selection is enabled) is visible, adjusting the scroll position as necessary. See also `center_on_current`.
- ForceUpdateListSize() - Forces an update to the list size based on its items. This happens automatically whenever size of the items, or other relevant settings like `auto_height`, change. The method can be used to trigger the update ahead of next drawing pass.
- GetHScrollBar() -> HScrollBar - Returns the horizontal scrollbar. **Warning:** This is a required internal node, removing and freeing it may cause a crash. If you wish to hide it or any of its children, use their `CanvasItem.visible` property.
- GetItemAtPosition(Vector2 position, bool exact = false) -> int - Returns the item index at the given `position`. When there is no item at that point, -1 will be returned if `exact` is `true`, and the closest item index will be returned otherwise. **Note:** The returned value is unreliable if called right after modifying the ItemList, before it redraws in the next frame.
- GetItemAutoTranslateMode(int idx) -> int - Returns item's auto translate mode.
- GetItemCustomBgColor(int idx) -> Color - Returns the custom background color of the item specified by `idx` index.
- GetItemCustomFgColor(int idx) -> Color - Returns the custom foreground color of the item specified by `idx` index.
- GetItemIcon(int idx) -> Texture2D - Returns the icon associated with the specified index.
- GetItemIconModulate(int idx) -> Color - Returns a Color modulating item's icon at the specified index.
- GetItemIconRegion(int idx) -> Rect2 - Returns the region of item's icon used. The whole icon will be used if the region has no area.
- GetItemLanguage(int idx) -> string - Returns item's text language code.
- GetItemMetadata(int idx) -> Variant - Returns the metadata value of the specified index.
- GetItemRect(int idx, bool expand = true) -> Rect2 - Returns the position and size of the item with the specified index, in the coordinate system of the ItemList node. If `expand` is `true` the last column expands to fill the rest of the row. **Note:** The returned value is unreliable if called right after modifying the ItemList, before it redraws in the next frame.
- GetItemText(int idx) -> string - Returns the text associated with the specified index.
- GetItemTextDirection(int idx) -> int - Returns item's text base writing direction.
- GetItemTooltip(int idx) -> string - Returns the tooltip hint associated with the specified index.
- GetSelectedItems() -> int[] - Returns an array with the indexes of the selected items.
- GetVScrollBar() -> VScrollBar - Returns the vertical scrollbar. **Warning:** This is a required internal node, removing and freeing it may cause a crash. If you wish to hide it or any of its children, use their `CanvasItem.visible` property.
- IsAnythingSelected() -> bool - Returns `true` if one or more items are selected.
- IsItemDisabled(int idx) -> bool - Returns `true` if the item at the specified index is disabled.
- IsItemIconTransposed(int idx) -> bool - Returns `true` if the item icon will be drawn transposed, i.e. the X and Y axes are swapped.
- IsItemSelectable(int idx) -> bool - Returns `true` if the item at the specified index is selectable.
- IsItemTooltipEnabled(int idx) -> bool - Returns `true` if the tooltip is enabled for specified item index.
- IsSelected(int idx) -> bool - Returns `true` if the item at the specified index is currently selected.
- MoveItem(int fromIdx, int toIdx) - Moves item from index `from_idx` to `to_idx`.
- RemoveItem(int idx) - Removes the item specified by `idx` index from the list.
- Select(int idx, bool single = true) - Selects the item at the specified index. **Note:** This method does not trigger the item selection signal.
- SetItemAutoTranslateMode(int idx, int mode) - Sets the auto translate mode of the item associated with the specified index. Items use `Node.AUTO_TRANSLATE_MODE_INHERIT` by default, which uses the same auto translate mode as the ItemList itself.
- SetItemCustomBgColor(int idx, Color customBgColor) - Sets the background color of the item specified by `idx` index to the specified Color.
- SetItemCustomFgColor(int idx, Color customFgColor) - Sets the foreground color of the item specified by `idx` index to the specified Color.
- SetItemDisabled(int idx, bool disabled) - Disables (or enables) the item at the specified index. Disabled items cannot be selected and do not trigger activation signals (when double-clicking or pressing [kbd]Enter[/kbd]).
- SetItemIcon(int idx, Texture2D icon) - Sets (or replaces) the icon's Texture2D associated with the specified index.
- SetItemIconModulate(int idx, Color modulate) - Sets a modulating Color of the item associated with the specified index.
- SetItemIconRegion(int idx, Rect2 rect) - Sets the region of item's icon used. The whole icon will be used if the region has no area.
- SetItemIconTransposed(int idx, bool transposed) - Sets whether the item icon will be drawn transposed.
- SetItemLanguage(int idx, string language) - Sets the language code of the text for the item at the given index to `language`. This is used for line-breaking and text shaping algorithms. If `language` is empty, the current locale is used.
- SetItemMetadata(int idx, Variant metadata) - Sets a value (of any type) to be stored with the item associated with the specified index.
- SetItemSelectable(int idx, bool selectable) - Allows or disallows selection of the item associated with the specified index.
- SetItemText(int idx, string text) - Sets text of the item associated with the specified index.
- SetItemTextDirection(int idx, int direction) - Sets item's text base writing direction.
- SetItemTooltip(int idx, string tooltip) - Sets the tooltip hint for the item associated with the specified index.
- SetItemTooltipEnabled(int idx, bool enable) - Sets whether the tooltip hint is enabled for specified item index.
- SortItemsByText() - Sorts items in the list by their text.

**Signals:**
- EmptyClicked(Vector2 atPosition, int mouseButtonIndex) - Emitted when any mouse click is issued within the rect of the list but on empty space. `at_position` is the click position in this control's local coordinate system.
- ItemActivated(int index) - Emitted when specified list item is activated via double-clicking or by pressing [kbd]Enter[/kbd].
- ItemClicked(int index, Vector2 atPosition, int mouseButtonIndex) - Emitted when specified list item has been clicked with any mouse button. `at_position` is the click position in this control's local coordinate system.
- ItemSelected(int index) - Emitted when specified item has been selected. Only applicable in single selection mode. `allow_reselect` must be enabled to reselect an item.
- MultiSelected(int index, bool selected) - Emitted when a multiple selection is altered on a list allowing multiple selection.

**Enums:**
**IconMode:** ICON_MODE_TOP=0, ICON_MODE_LEFT=1
  - ICON_MODE_TOP: Icon is drawn above the text.
  - ICON_MODE_LEFT: Icon is drawn to the left of the text.
**SelectMode:** SELECT_SINGLE=0, SELECT_MULTI=1, SELECT_TOGGLE=2
  - SELECT_SINGLE: Only allow selecting a single item.
  - SELECT_MULTI: Allows selecting multiple items by holding [kbd]Ctrl[/kbd] or [kbd]Shift[/kbd].
  - SELECT_TOGGLE: Allows selecting multiple items by toggling them on and off.
**ScrollHintMode:** SCROLL_HINT_MODE_DISABLED=0, SCROLL_HINT_MODE_BOTH=1, SCROLL_HINT_MODE_TOP=2, SCROLL_HINT_MODE_BOTTOM=3
  - SCROLL_HINT_MODE_DISABLED: Scroll hints will never be shown.
  - SCROLL_HINT_MODE_BOTH: Scroll hints will be shown at the top and bottom.
  - SCROLL_HINT_MODE_TOP: Only the top scroll hint will be shown.
  - SCROLL_HINT_MODE_BOTTOM: Only the bottom scroll hint will be shown.

