## Popup <- Window

Popup is a base class for contextual windows and panels with fixed position. It's a modal by default (see `Window.popup_window`) and provides methods for implementing custom popup behavior. **Note:** Popup is invisible by default. To make it visible, call one of the `popup_*` methods from Window on the node, such as `Window.popup_centered_clamped`.

**Props:**
- Borderless: bool = true
- MaximizeDisabled: bool = true
- MinimizeDisabled: bool = true
- PopupWindow: bool = true
- PopupWmHint: bool = true
- Transient: bool = true
- Unresizable: bool = true
- Visible: bool = false
- WrapControls: bool = true


**Signals:**
- PopupHide - Emitted when the popup is hidden.

