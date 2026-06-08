## MenuBar <- Control

A horizontal menu bar that creates a menu for each PopupMenu child. New items are created by adding PopupMenus to this node. Item title is determined by `Window.title`, or node name if `Window.title` is empty. Item title can be overridden using `set_menu_title`.

**Props:**
- Flat: bool = false
- FocusMode: int (Control.FocusMode) = 3
- Language: string = ""
- PreferGlobalMenu: bool = true
- StartIndex: int = -1
- SwitchOnHover: bool = true
- TextDirection: int (Control.TextDirection) = 0

- **flat**: Flat MenuBar don't display item decoration.
- **language**: Language code used for line-breaking and text shaping algorithms. If left empty, the current locale is used instead.
- **prefer_global_menu**: If `true`, MenuBar will use system global menu when supported. **Note:** If `true` and global menu is supported, this node is not displayed, has zero size, and all its child nodes except PopupMenus are inaccessible. **Note:** This property overrides the value of the `PopupMenu.prefer_native_menu` property of the child nodes.
- **start_index**: Position order in the global menu to insert MenuBar items at. All menu items in the MenuBar are always inserted as a continuous range. Menus with lower `start_index` are inserted first. Menus with `start_index` equal to `-1` are inserted last.
- **switch_on_hover**: If `true`, when the cursor hovers above menu item, it will close the current PopupMenu and open the other one.
- **text_direction**: Base text writing direction.

**Methods:**
- GetMenuCount() -> int - Returns number of menu items.
- GetMenuPopup(int menu) -> PopupMenu - Returns PopupMenu associated with menu item.
- GetMenuTitle(int menu) -> string - Returns menu item title.
- GetMenuTooltip(int menu) -> string - Returns menu item tooltip.
- IsMenuDisabled(int menu) -> bool - Returns `true` if the menu item is disabled.
- IsMenuHidden(int menu) -> bool - Returns `true` if the menu item is hidden.
- IsNativeMenu() -> bool - Returns `true` if the current system's global menu is supported and used by this MenuBar.
- SetDisableShortcuts(bool disabled) - If `true`, shortcuts are disabled and cannot be used to trigger the button.
- SetMenuDisabled(int menu, bool disabled) - If `true`, menu item is disabled.
- SetMenuHidden(int menu, bool hidden) - If `true`, menu item is hidden.
- SetMenuTitle(int menu, string title) - Sets menu item title.
- SetMenuTooltip(int menu, string tooltip) - Sets menu item tooltip.

