## InputEventMouse <- InputEventWithModifiers

Stores general information about mouse events.

**Props:**
- ButtonMask: int (MouseButtonMask) = 0
- Device: int = 32
- GlobalPosition: Vector2 = Vector2(0, 0)
- Position: Vector2 = Vector2(0, 0)

- **button_mask**: The mouse button mask identifier, one of or a bitwise combination of the `MouseButton` button masks.
- **global_position**: When received in `Node._input` or `Node._unhandled_input`, returns the mouse's position in the root Viewport using the coordinate system of the root Viewport. When received in `Control._gui_input`, returns the mouse's position in the CanvasLayer that the Control is in using the coordinate system of the CanvasLayer.
- **position**: When received in `Node._input` or `Node._unhandled_input`, returns the mouse's position in the Viewport this Node is in using the coordinate system of this Viewport. When received in `Control._gui_input`, returns the mouse's position in the Control using the local coordinate system of the Control.

