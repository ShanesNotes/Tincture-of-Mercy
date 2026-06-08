## XRVRS <- Object

This class is used by various XR interfaces to generate VRS textures that can be used to speed up rendering.

**Props:**
- VrsMinRadius: float = 20.0
- VrsRenderRegion: Rect2i = Rect2i(0, 0, 0, 0)
- VrsStrength: float = 1.0

- **vrs_min_radius**: The minimum radius around the focal point where full quality is guaranteed if VRS is used as a percentage of screen size.
- **vrs_render_region**: The render region that the VRS texture will be scaled to when generated.
- **vrs_strength**: The strength used to calculate the VRS density map. The greater this value, the more noticeable VRS is.

**Methods:**
- MakeVrsTexture(Vector2 targetSize, Vector2[] eyeFoci) -> Rid - Generates the VRS texture based on a render `target_size` adjusted by our VRS tile size. For each eyes focal point passed in `eye_foci` a layer is created. Focal point should be in NDC. The result will be cached, requesting a VRS texture with unchanged parameters and settings will return the cached RID.

