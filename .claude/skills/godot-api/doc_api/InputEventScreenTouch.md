## InputEventScreenTouch <- InputEventFromWindow

Stores information about multi-touch press/release input events. Supports touch press, touch release and `index` for multi-touch count and order.

**Props:**
- Canceled: bool = false
- DoubleTap: bool = false
- Index: int = 0
- Position: Vector2 = Vector2(0, 0)
- Pressed: bool = false

- **canceled**: If `true`, the touch event has been canceled.
- **double_tap**: If `true`, the touch's state is a double tap.
- **index**: The touch index in the case of a multi-touch event. One index = one finger.
- **position**: The touch position in the viewport the node is in, using the coordinate system of this viewport.
- **pressed**: If `true`, the touch's state is pressed. If `false`, the touch's state is released.

