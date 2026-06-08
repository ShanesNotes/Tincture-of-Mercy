## ScrollContainer <- Container

A container used to provide a child control with scrollbars when needed. Scrollbars will automatically be drawn at the right (for vertical) or bottom (for horizontal) and will enable dragging to move the viewable Control (and its children) within the ScrollContainer. Scrollbars will also automatically resize the grabber based on the `Control.custom_minimum_size` of the Control relative to the ScrollContainer.

**Props:**
- ClipContents: bool = true
- DrawFocusBorder: bool = false
- FollowFocus: bool = false
- HorizontalScrollMode: int (ScrollContainer.ScrollMode) = 1
- PropagateMaximumSize: bool = false
- ScrollDeadzone: int = 0
- ScrollHintMode: int (ScrollContainer.ScrollHintMode) = 0
- ScrollHorizontal: int = 0
- ScrollHorizontalByDefault: bool = false
- ScrollHorizontalCustomStep: float = -1.0
- ScrollVertical: int = 0
- ScrollVerticalCustomStep: float = -1.0
- TileScrollHint: bool = false
- VerticalScrollMode: int (ScrollContainer.ScrollMode) = 1

- **draw_focus_border**: If `true`, [theme_item focus] is drawn when the ScrollContainer or one of its descendant nodes is focused.
- **follow_focus**: If `true`, the ScrollContainer will automatically scroll to focused children (including indirect children) to make sure they are fully visible.
- **horizontal_scroll_mode**: Controls whether horizontal scrollbar can be used and when it should be visible.
- **scroll_deadzone**: Deadzone for touch scrolling. Lower deadzone makes the scrolling more sensitive.
- **scroll_hint_mode**: The way which scroll hints (indicators that show that the content can still be scrolled in a certain direction) will be shown. **Note:** Hints won't be shown if the content can be scrolled both vertically and horizontally.
- **scroll_horizontal**: The current horizontal scroll value. **Note:** If you are setting this value in the `Node._ready` function or earlier, it needs to be wrapped with `Object.set_deferred`, since scroll bar's `Range.max_value` is not initialized yet.
- **scroll_horizontal_by_default**: If `true`, the mouse wheel scrolls the view horizontally, and holding [kbd]Shift[/kbd] scrolls vertically. If `false` (default), the mouse wheel scrolls the view vertically, and holding [kbd]Shift[/kbd] scrolls horizontally.
- **scroll_horizontal_custom_step**: Overrides the `ScrollBar.custom_step` used when clicking the internal scroll bar's horizontal increment and decrement buttons or when using arrow keys when the ScrollBar is focused.
- **scroll_vertical**: The current vertical scroll value. **Note:** Setting it early needs to be deferred, just like in `scroll_horizontal`.
- **scroll_vertical_custom_step**: Overrides the `ScrollBar.custom_step` used when clicking the internal scroll bar's vertical increment and decrement buttons or when using arrow keys when the ScrollBar is focused.
- **tile_scroll_hint**: If `true`, the scroll hint texture will be tiled instead of stretched. See `scroll_hint_mode`.
- **vertical_scroll_mode**: Controls whether vertical scrollbar can be used and when it should be visible.

**Methods:**
- EnsureControlVisible(Control control) - Ensures the given `control` is visible (must be a direct or indirect child of the ScrollContainer). Used by `follow_focus`. **Note:** This will not work on a node that was just added during the same frame. If you want to scroll to a newly added child, you must wait until the next frame using `SceneTree.process_frame`:
- GetHScrollBar() -> HScrollBar - Returns the horizontal scrollbar HScrollBar of this ScrollContainer. **Warning:** This is a required internal node, removing and freeing it may cause a crash. If you wish to disable or hide a scrollbar, you can use `horizontal_scroll_mode`.
- GetVScrollBar() -> VScrollBar - Returns the vertical scrollbar VScrollBar of this ScrollContainer. **Warning:** This is a required internal node, removing and freeing it may cause a crash. If you wish to disable or hide a scrollbar, you can use `vertical_scroll_mode`.

**Signals:**
- ScrollEnded - Emitted when scrolling stops when dragging the scrollable area *with a touch event*. This signal is *not* emitted when scrolling by dragging the scrollbar, scrolling with the mouse wheel or scrolling with keyboard/gamepad events. **Note:** This signal is only emitted on Android or iOS, or on desktop/web platforms when `ProjectSettings.input_devices/pointing/emulate_touch_from_mouse` is enabled.
- ScrollStarted - Emitted when scrolling starts when dragging the scrollable area w*ith a touch event*. This signal is *not* emitted when scrolling by dragging the scrollbar, scrolling with the mouse wheel or scrolling with keyboard/gamepad events. **Note:** This signal is only emitted on Android or iOS, or on desktop/web platforms when `ProjectSettings.input_devices/pointing/emulate_touch_from_mouse` is enabled.

**Enums:**
**ScrollMode:** SCROLL_MODE_DISABLED=0, SCROLL_MODE_AUTO=1, SCROLL_MODE_SHOW_ALWAYS=2, SCROLL_MODE_SHOW_NEVER=3, SCROLL_MODE_RESERVE=4, SCROLL_MODE_MAXIMIZE_FIRST=5
  - SCROLL_MODE_DISABLED: Scrolling disabled, scrollbar will be invisible.
  - SCROLL_MODE_AUTO: Scrolling enabled, scrollbar will be visible only if necessary, i.e. container's content is bigger than the container.
  - SCROLL_MODE_SHOW_ALWAYS: Scrolling enabled, scrollbar will be always visible.
  - SCROLL_MODE_SHOW_NEVER: Scrolling enabled, scrollbar will be hidden.
  - SCROLL_MODE_RESERVE: Combines `SCROLL_MODE_AUTO` and `SCROLL_MODE_SHOW_ALWAYS`. The scrollbar is only visible if necessary, but the content size is adjusted as if it was always visible. It's useful for ensuring that content size stays the same regardless if the scrollbar is visible.
  - SCROLL_MODE_MAXIMIZE_FIRST: Behaves like `SCROLL_MODE_AUTO`, but makes the ScrollContainer report a minimum size based on its content (limited by `Control.custom_maximum_size` when set on the corresponding axis). This allows it to grow first and only start scrolling once constrained.
**ScrollHintMode:** SCROLL_HINT_MODE_DISABLED=0, SCROLL_HINT_MODE_ALL=1, SCROLL_HINT_MODE_TOP_AND_LEFT=2, SCROLL_HINT_MODE_BOTTOM_AND_RIGHT=3
  - SCROLL_HINT_MODE_DISABLED: Scroll hints will never be shown.
  - SCROLL_HINT_MODE_ALL: Scroll hints will be shown at the top and bottom (if vertical), or left and right (if horizontal).
  - SCROLL_HINT_MODE_TOP_AND_LEFT: Scroll hints will be shown at the top (if vertical), or the left (if horizontal).
  - SCROLL_HINT_MODE_BOTTOM_AND_RIGHT: Scroll hints will be shown at the bottom (if horizontal), or the right (if horizontal).

