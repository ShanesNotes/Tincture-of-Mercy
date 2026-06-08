## Slider <- Range

Abstract base class for sliders, used to adjust a value by moving a grabber along a horizontal or vertical axis. Sliders are Range-based controls.

**Props:**
- Editable: bool = true
- FocusMode: int (Control.FocusMode) = 2
- Scrollable: bool = true
- Step: float = 1.0
- TickCount: int = 0
- TicksOnBorders: bool = false
- TicksPosition: int (Slider.TickPosition) = 0

- **editable**: If `true`, the slider can be interacted with. If `false`, the value can be changed only by code.
- **scrollable**: If `true`, the value can be changed using the mouse wheel.
- **tick_count**: Number of ticks displayed on the slider, including border ticks. Ticks are uniformly-distributed value markers.
- **ticks_on_borders**: If `true`, the slider will display ticks for minimum and maximum values.
- **ticks_position**: Sets the position of the ticks. See `TickPosition` for details.

**Signals:**
- DragEnded(bool valueChanged) - Emitted when the grabber stops being dragged. If `value_changed` is `true`, `Range.value` is different from the value when the dragging was started.
- DragStarted - Emitted when the grabber starts being dragged. This is emitted before the corresponding `Range.value_changed` signal.

**Enums:**
**TickPosition:** TICK_POSITION_BOTTOM_RIGHT=0, TICK_POSITION_TOP_LEFT=1, TICK_POSITION_BOTH=2, TICK_POSITION_CENTER=3
  - TICK_POSITION_BOTTOM_RIGHT: Places the ticks at the bottom of the HSlider, or right of the VSlider.
  - TICK_POSITION_TOP_LEFT: Places the ticks at the top of the HSlider, or left of the VSlider.
  - TICK_POSITION_BOTH: Places the ticks at the both sides of the slider.
  - TICK_POSITION_CENTER: Places the ticks at the center of the slider.

