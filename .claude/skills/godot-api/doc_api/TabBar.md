## TabBar <- Control

A control that provides a horizontal bar with tabs. Similar to TabContainer but is only in charge of drawing tabs, not interacting with children.

**Props:**
- ClipTabs: bool = true
- CloseWithMiddleMouse: bool = true
- CurrentTab: int = -1
- DeselectEnabled: bool = false
- DragToRearrangeEnabled: bool = false
- FocusMode: int (Control.FocusMode) = 2
- MaxTabWidth: int = 0
- ScrollToSelected: bool = true
- ScrollingEnabled: bool = true
- SelectWithRmb: bool = false
- SwitchOnDragHover: bool = true
- TabAlignment: int (TabBar.AlignmentMode) = 0
- TabCloseDisplayPolicy: int (TabBar.CloseButtonDisplayPolicy) = 0
- TabCount: int = 0
- Tab{index}/disabled: bool = false
- Tab{index}/icon: Texture2D
- Tab{index}/title: string = ""
- Tab{index}/tooltip: string = ""
- TabsRearrangeGroup: int = -1

- **clip_tabs**: If `true`, tabs overflowing this node's width will be hidden, displaying two navigation buttons instead. Otherwise, this node's minimum size is updated so that all tabs are visible.
- **close_with_middle_mouse**: If `true`, middle-clicking on a tab will emit the `tab_close_pressed` signal.
- **current_tab**: The index of the current selected tab. A value of `-1` means that no tab is selected and can only be set when `deselect_enabled` is `true` or if all tabs are hidden or disabled.
- **deselect_enabled**: If `true`, all tabs can be deselected so that no tab is selected. Click on the current tab to deselect it.
- **drag_to_rearrange_enabled**: If `true`, tabs can be rearranged with mouse drag.
- **max_tab_width**: Sets the maximum width which all tabs should be limited to. Unlimited if set to `0`.
- **scroll_to_selected**: If `true`, the tab offset will be changed to keep the currently selected tab visible.
- **scrolling_enabled**: if `true`, the mouse's scroll wheel can be used to navigate the scroll view.
- **select_with_rmb**: If `true`, enables selecting a tab with the right mouse button.
- **switch_on_drag_hover**: If `true`, hovering over a tab while dragging something will switch to that tab. Does not have effect when hovering another tab to rearrange. The delay for when this happens is dictated by [theme_item hover_switch_wait_msec].
- **tab_alignment**: The horizontal alignment of the tabs.
- **tab_close_display_policy**: When the close button will appear on the tabs.
- **tab_count**: The number of tabs currently in the bar.
- **tab_{index}/disabled**: If `true`, the tab at `index` is disabled. **Note:** `index` is a value in the `0 .. tab_count - 1` range.
- **tab_{index}/icon**: If `true`, the tab at `index` is hidden. **Note:** `index` is a value in the `0 .. tab_count - 1` range.
- **tab_{index}/title**: The title text of the tab at `index`. **Note:** `index` is a value in the `0 .. tab_count - 1` range.
- **tab_{index}/tooltip**: The tooltip text of the tab at `index`. **Note:** `index` is a value in the `0 .. tab_count - 1` range.
- **tabs_rearrange_group**: TabBars with the same rearrange group ID will allow dragging the tabs between them. Enable drag with `drag_to_rearrange_enabled`. Setting this to `-1` will disable rearranging between TabBars.

**Methods:**
- AddTab(string title = "", Texture2D icon = null) - Adds a new tab.
- ClearTabs() - Clears all tabs.
- EnsureTabVisible(int idx) - Moves the scroll view to make the tab visible.
- GetOffsetButtonsVisible() -> bool - Returns `true` if the offset buttons (the ones that appear when there's not enough space for all tabs) are visible.
- GetPreviousTab() -> int - Returns the previously active tab index.
- GetTabButtonIcon(int tabIdx) -> Texture2D - Returns the icon for the right button of the tab at index `tab_idx` or `null` if the right button has no icon.
- GetTabIcon(int tabIdx) -> Texture2D - Returns the icon for the tab at index `tab_idx` or `null` if the tab has no icon.
- GetTabIconMaxWidth(int tabIdx) -> int - Returns the maximum allowed width of the icon for the tab at index `tab_idx`.
- GetTabIdxAtPoint(Vector2 point) -> int - Returns the index of the tab at local coordinates `point`. Returns `-1` if the point is outside the control boundaries or if there's no tab at the queried position.
- GetTabLanguage(int tabIdx) -> string - Returns tab title language code.
- GetTabMetadata(int tabIdx) -> Variant - Returns the metadata value set to the tab at index `tab_idx` using `set_tab_metadata`. If no metadata was previously set, returns `null` by default.
- GetTabOffset() -> int - Returns the number of hidden tabs offsetted to the left.
- GetTabRect(int tabIdx) -> Rect2 - Returns tab Rect2 with local position and size.
- GetTabTextDirection(int tabIdx) -> int - Returns tab title text base writing direction.
- GetTabTitle(int tabIdx) -> string - Returns the title of the tab at index `tab_idx`.
- GetTabTooltip(int tabIdx) -> string - Returns the tooltip text of the tab at index `tab_idx`.
- IsTabDisabled(int tabIdx) -> bool - Returns `true` if the tab at index `tab_idx` is disabled.
- IsTabHidden(int tabIdx) -> bool - Returns `true` if the tab at index `tab_idx` is hidden.
- MoveTab(int from, int to) - Moves a tab from `from` to `to`.
- RemoveTab(int tabIdx) - Removes the tab at index `tab_idx`.
- SelectNextAvailable() -> bool - Selects the first available tab with greater index than the currently selected. Returns `true` if tab selection changed.
- SelectPreviousAvailable() -> bool - Selects the first available tab with lower index than the currently selected. Returns `true` if tab selection changed.
- SetTabButtonIcon(int tabIdx, Texture2D icon) - Sets an `icon` for the button of the tab at index `tab_idx` (located to the right, before the close button), making it visible and clickable (See `tab_button_pressed`). Giving it a `null` value will hide the button.
- SetTabDisabled(int tabIdx, bool disabled) - If `disabled` is `true`, disables the tab at index `tab_idx`, making it non-interactable.
- SetTabHidden(int tabIdx, bool hidden) - If `hidden` is `true`, hides the tab at index `tab_idx`, making it disappear from the tab area.
- SetTabIcon(int tabIdx, Texture2D icon) - Sets an `icon` for the tab at index `tab_idx`.
- SetTabIconMaxWidth(int tabIdx, int width) - Sets the maximum allowed width of the icon for the tab at index `tab_idx`. This limit is applied on top of the default size of the icon and on top of [theme_item icon_max_width]. The height is adjusted according to the icon's ratio.
- SetTabLanguage(int tabIdx, string language) - Sets the language code of the title for the tab at index `tab_idx` to `language`. This is used for line-breaking and text shaping algorithms. If `language` is empty, the current locale is used.
- SetTabMetadata(int tabIdx, Variant metadata) - Sets the metadata value for the tab at index `tab_idx`, which can be retrieved later using `get_tab_metadata`.
- SetTabTextDirection(int tabIdx, int direction) - Sets tab title base writing direction.
- SetTabTitle(int tabIdx, string title) - Sets a `title` for the tab at index `tab_idx`.
- SetTabTooltip(int tabIdx, string tooltip) - Sets a `tooltip` for tab at index `tab_idx`. **Note:** By default, if the `tooltip` is empty and the tab text is truncated (not all characters fit into the tab), the title will be displayed as a tooltip. To hide the tooltip, assign `" "` as the `tooltip` text.

**Signals:**
- ActiveTabRearranged(int idxTo) - Emitted when the active tab is rearranged via mouse drag. See `drag_to_rearrange_enabled`.
- TabButtonPressed(int tab) - Emitted when a tab's right button is pressed. See `set_tab_button_icon`.
- TabChanged(int tab) - Emitted when switching to another tab.
- TabClicked(int tab) - Emitted when a tab is clicked, even if it is the current tab.
- TabClosePressed(int tab) - Emitted when a tab's close button is pressed or, if `close_with_middle_mouse` is `true`, when middle-clicking on a tab. **Note:** Tabs are not removed automatically; this behavior needs to be coded manually. For example:
- TabHovered(int tab) - Emitted when a tab is hovered by the mouse.
- TabRmbClicked(int tab) - Emitted when a tab is right-clicked.
- TabSelected(int tab) - Emitted when a tab is selected via click, directional input, or script, even if it is the current tab.

**Enums:**
**AlignmentMode:** ALIGNMENT_LEFT=0, ALIGNMENT_CENTER=1, ALIGNMENT_RIGHT=2, ALIGNMENT_MAX=3
  - ALIGNMENT_LEFT: Aligns tabs to the left.
  - ALIGNMENT_CENTER: Aligns tabs in the middle.
  - ALIGNMENT_RIGHT: Aligns tabs to the right.
  - ALIGNMENT_MAX: Represents the size of the `AlignmentMode` enum.
**CloseButtonDisplayPolicy:** CLOSE_BUTTON_SHOW_NEVER=0, CLOSE_BUTTON_SHOW_ACTIVE_ONLY=1, CLOSE_BUTTON_SHOW_ALWAYS=2, CLOSE_BUTTON_MAX=3
  - CLOSE_BUTTON_SHOW_NEVER: Never show the close buttons.
  - CLOSE_BUTTON_SHOW_ACTIVE_ONLY: Only show the close button on the currently active tab.
  - CLOSE_BUTTON_SHOW_ALWAYS: Show the close button on all tabs.
  - CLOSE_BUTTON_MAX: Represents the size of the `CloseButtonDisplayPolicy` enum.

