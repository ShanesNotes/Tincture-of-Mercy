## ParallaxBackground <- CanvasLayer

A ParallaxBackground uses one or more ParallaxLayer child nodes to create a parallax effect. Each ParallaxLayer can move at a different speed using `ParallaxLayer.motion_offset`. This creates an illusion of depth in a 2D game. If not used with a Camera2D, you must manually calculate the `scroll_offset`. **Note:** Each ParallaxBackground is drawn on one specific Viewport and cannot be shared between multiple Viewports, see `CanvasLayer.custom_viewport`. When using multiple Viewports, for example in a split-screen game, you need create an individual ParallaxBackground for each Viewport you want it to be drawn on.

**Props:**
- Layer: int = -100
- ScrollBaseOffset: Vector2 = Vector2(0, 0)
- ScrollBaseScale: Vector2 = Vector2(1, 1)
- ScrollIgnoreCameraZoom: bool = false
- ScrollLimitBegin: Vector2 = Vector2(0, 0)
- ScrollLimitEnd: Vector2 = Vector2(0, 0)
- ScrollOffset: Vector2 = Vector2(0, 0)

- **scroll_base_offset**: The base position offset for all ParallaxLayer children.
- **scroll_base_scale**: The base motion scale for all ParallaxLayer children.
- **scroll_ignore_camera_zoom**: If `true`, elements in ParallaxLayer child aren't affected by the zoom level of the camera.
- **scroll_limit_begin**: Top-left limits for scrolling to begin. If the camera is outside of this limit, the background will stop scrolling. Must be lower than `scroll_limit_end` to work.
- **scroll_limit_end**: Bottom-right limits for scrolling to end. If the camera is outside of this limit, the background will stop scrolling. Must be higher than `scroll_limit_begin` to work.
- **scroll_offset**: The ParallaxBackground's scroll value. Calculated automatically when using a Camera2D, but can be used to manually manage scrolling when no camera is present.

