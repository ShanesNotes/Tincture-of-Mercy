## RDPipelineRasterizationState <- RefCounted

This object is used by RenderingDevice.

**Props:**
- CullMode: int (RenderingDevice.PolygonCullMode) = 0
- DepthBiasClamp: float = 0.0
- DepthBiasConstantFactor: float = 0.0
- DepthBiasEnabled: bool = false
- DepthBiasSlopeFactor: float = 0.0
- DiscardPrimitives: bool = false
- EnableDepthClamp: bool = false
- FrontFace: int (RenderingDevice.PolygonFrontFace) = 0
- LineWidth: float = 1.0
- PatchControlPoints: int = 1
- Wireframe: bool = false

- **cull_mode**: The cull mode to use when drawing polygons, which determines whether front faces or backfaces are hidden.
- **depth_bias_clamp**: A limit for how much each depth value can be offset. If negative, it serves as a minimum value, but if positive, it serves as a maximum value.
- **depth_bias_constant_factor**: A constant offset added to each depth value. Applied after `depth_bias_slope_factor`.
- **depth_bias_enabled**: If `true`, each generated depth value will by offset by some amount. The specific amount is generated per polygon based on the values of `depth_bias_slope_factor` and `depth_bias_constant_factor`.
- **depth_bias_slope_factor**: A constant scale applied to the slope of each polygons' depth. Applied before `depth_bias_constant_factor`.
- **discard_primitives**: If `true`, primitives are discarded immediately before the rasterization stage.
- **enable_depth_clamp**: If `true`, clamps depth values according to the minimum and maximum depth of the associated viewport.
- **front_face**: The winding order to use to determine which face of a triangle is considered its front face.
- **line_width**: The line width to use when drawing lines (in pixels). Thick lines may not be supported on all hardware.
- **patch_control_points**: The number of control points to use when drawing a patch with tessellation enabled. Higher values result in higher quality at the cost of performance.
- **wireframe**: If `true`, performs wireframe rendering for triangles instead of flat or textured rendering.

