## OptionButton <- Button

OptionButton is a type of button that brings up a dropdown with selectable items when pressed. The item selected becomes the "current" item and is displayed as the button text. See also BaseButton which contains common properties and methods associated with this node. **Note:** The IDs used for items are limited to signed 32-bit integers, not the full 64 bits of [int]. These have a range of `-2^31` to `2^31 - 1`, that is, `-2147483648` to `2147483647`. **Note:** The `Button.text` and `Button.icon` properties are set automatically based on the selected item. They shouldn't be changed manually.

**Props:**
- ActionMode: int (BaseButton.ActionMode) = 0
- Alignment: int (HorizontalAlignment) = 0
- AllowReselect: bool = false
- EnableSearchBarOnItemCount: int = 0
- FitToLongestItem: bool = true
- ItemCount: int = 0
- Popup/item{index}/disabled: bool = false
- Popup/item{index}/icon: Texture2D
- Popup/item{index}/id: int = 0
- Popup/item{index}/separator: bool = false
- Popup/item{index}/text: string = ""
- SearchBarFuzzySearchEnabled: bool = true
- SearchBarFuzzySearchMaxMisses: int = 2
- Selected: int = -1
- ToggleMode: bool = true

- **allow_reselect**: If `true`, the currently selected item can be selected again.
- **enable_search_bar_on_item_count**: Enables the PopupMenu search bar if the item count is greater than `0`.
- **fit_to_longest_item**: If `true`, minimum size will be determined by the longest item's text, instead of the currently selected one's. **Note:** For performance reasons, the minimum size doesn't update immediately when adding, removing or modifying items.
- **item_count**: The number of items to select from.
- **popup/item_{index}/disabled**: If `true`, the item at `index` is disabled. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **popup/item_{index}/icon**: The icon of the item at `index`. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **popup/item_{index}/id**: The ID of the item at `index`. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **popup/item_{index}/separator**: If `true`, the item at `index` is a separator. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **popup/item_{index}/text**: The text of the item at `index`. **Note:** `index` is a value in the `0 .. item_count - 1` range.
- **search_bar_fuzzy_search_enabled**: If `true`, enables fuzzy searching in the PopupMenu search bar. This allows the search results to include items that almost match the search query, as well items that match the individual characters of the search query, but not in sequence. Use `search_bar_fuzzy_search_max_misses` to set the maximum number of mismatches allowed in the search results.
- **search_bar_fuzzy_search_max_misses**: Sets the maximum number of mismatches allowed in each search result when fuzzy searching is enabled for the PopupMenu search bar. Any item with more mismatches will be hidden from the search results.
- **selected**: The index of the currently selected item, or `-1` if no item is selected.

**Methods:**
- AddIconItem(Texture2D texture, string label, int id = -1) - Adds an item, with a `texture` icon, text `label` and (optionally) `id`. If no `id` is passed, the item index will be used as the item's ID. New items are appended at the end. **Note:** The item will be selected if there are no other items.
- AddItem(string label, int id = -1) - Adds an item, with text `label` and (optionally) `id`. If no `id` is passed, the item index will be used as the item's ID. New items are appended at the end. **Note:** The item will be selected if there are no other items.
- AddSeparator(string text = "") - Adds a separator to the list of items. Separators help to group items, and can optionally be given a `text` header. A separator also gets an index assigned, and is appended at the end of the item list.
- Clear() - Clears all the items in the OptionButton.
- GetItemAutoTranslateMode(int idx) -> int - Returns the auto translate mode of the item at index `idx`.
- GetItemIcon(int idx) -> Texture2D - Returns the icon of the item at index `idx`.
- GetItemId(int idx) -> int - Returns the ID of the item at index `idx`.
- GetItemIndex(int id) -> int - Returns the index of the item with the given `id`.
- GetItemMetadata(int idx) -> Variant - Retrieves the metadata of an item. Metadata may be any type and can be used to store extra information about an item, such as an external string ID.
- GetItemText(int idx) -> string - Returns the text of the item at index `idx`.
- GetItemTooltip(int idx) -> string - Returns the tooltip of the item at index `idx`.
- GetPopup() -> PopupMenu - Returns the PopupMenu contained in this button. **Warning:** This is a required internal node, removing and freeing it may cause a crash. If you wish to hide it or any of its children, use their `Window.visible` property.
- GetSelectableItem(bool fromLast = false) -> int - Returns the index of the first item which is not disabled, or marked as a separator. If `from_last` is `true`, the items will be searched in reverse order. Returns `-1` if no item is found.
- GetSelectedId() -> int - Returns the ID of the selected item, or `-1` if no item is selected.
- GetSelectedMetadata() -> Variant - Gets the metadata of the selected item. Metadata for items can be set using `set_item_metadata`.
- HasSelectableItems() -> bool - Returns `true` if this button contains at least one item which is not disabled, or marked as a separator.
- IsItemDisabled(int idx) -> bool - Returns `true` if the item at index `idx` is disabled.
- IsItemSeparator(int idx) -> bool - Returns `true` if the item at index `idx` is marked as a separator.
- IsSearchBarEnabled() -> bool - Returns `true` if the search bar is enabled.
- RemoveItem(int idx) - Removes the item at index `idx`.
- Select(int idx) - Selects an item by index and makes it the current item. This will work even if the item is disabled. Passing `-1` as the index deselects any currently selected item.
- SetDisableShortcuts(bool disabled) - If `true`, shortcuts are disabled and cannot be used to trigger the button.
- SetItemAutoTranslateMode(int idx, int mode) - Sets the auto translate mode of the item at index `idx`. Items use `Node.AUTO_TRANSLATE_MODE_INHERIT` by default, which uses the same auto translate mode as the OptionButton itself.
- SetItemDisabled(int idx, bool disabled) - Sets whether the item at index `idx` is disabled. Disabled items are drawn differently in the dropdown and are not selectable by the user. If the current selected item is set as disabled, it will remain selected.
- SetItemIcon(int idx, Texture2D texture) - Sets the icon of the item at index `idx`.
- SetItemId(int idx, int id) - Sets the ID of the item at index `idx`.
- SetItemMetadata(int idx, Variant metadata) - Sets the metadata of an item. Metadata may be of any type and can be used to store extra information about an item, such as an external string ID.
- SetItemText(int idx, string text) - Sets the text of the item at index `idx`.
- SetItemTooltip(int idx, string tooltip) - Sets the tooltip of the item at index `idx`.
- ShowPopup() - Adjusts popup position and sizing for the OptionButton, then shows the PopupMenu. Prefer this over using `get_popup().popup()`.

**Signals:**
- ItemFocused(int index) - Emitted when the user navigates to an item using the `ProjectSettings.input/ui_up` or `ProjectSettings.input/ui_down` input actions. The index of the item focused is passed as argument.
- ItemSelected(int index) - Emitted when the current item has been changed by the user. The index of the item selected is passed as argument. `allow_reselect` must be enabled to reselect an item.

