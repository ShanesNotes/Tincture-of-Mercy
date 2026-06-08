## ScrollBar <- Range

Abstract base class for scrollbars, typically used to navigate through content that extends beyond the visible area of a control. Scrollbars are Range-based controls.

**Props:**
- CustomStep: float = -1.0
- FocusMode: int (Control.FocusMode) = 3
- Step: float = 0.0

- **custom_step**: Overrides the step used when clicking increment and decrement buttons or when using arrow keys when the ScrollBar is focused.

**Signals:**
- Scrolling - Emitted when the scrollbar is being scrolled.

