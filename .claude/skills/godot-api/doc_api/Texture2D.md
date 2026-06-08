## Texture2D <- Texture

A texture works by registering an image in the video hardware, which then can be used in 3D models or 2D Sprite2D or GUI Control. Textures are often created by loading them from a file. See `@GDScript.load`. Texture2D is a base for other resources. It cannot be used directly. **Note:** The maximum texture size is 16384×16384 pixels due to graphics hardware limitations. Larger textures may fail to import.

**Methods:**
- Draw(Rid toCanvasItem, Vector2 pos, Color modulate, bool transpose) - Called when the entire Texture2D is requested to be drawn over a CanvasItem, with the top-left offset specified in `pos`. `modulate` specifies a multiplier for the colors being drawn, while `transpose` specifies whether drawing should be performed in column-major order instead of row-major order (resulting in 90-degree clockwise rotation). **Note:** This is only used in 2D rendering, not 3D.
- DrawRect(Rid toCanvasItem, Rect2 rect, bool tile, Color modulate, bool transpose) - Called when the Texture2D is requested to be drawn onto CanvasItem's specified `rect`. `modulate` specifies a multiplier for the colors being drawn, while `transpose` specifies whether drawing should be performed in column-major order instead of row-major order (resulting in 90-degree clockwise rotation). **Note:** This is only used in 2D rendering, not 3D.
- DrawRectRegion(Rid toCanvasItem, Rect2 rect, Rect2 srcRect, Color modulate, bool transpose, bool clipUv) - Called when a part of the Texture2D specified by `src_rect`'s coordinates is requested to be drawn onto CanvasItem's specified `rect`. `modulate` specifies a multiplier for the colors being drawn, while `transpose` specifies whether drawing should be performed in column-major order instead of row-major order (resulting in 90-degree clockwise rotation). **Note:** This is only used in 2D rendering, not 3D.
- GetFormat() -> int - Called when `get_format` is called.
- GetHeight() -> int - Called when the Texture2D's height is queried.
- GetImage() -> Image - Called when `get_image` is called.
- GetMipmapCount() -> int - Called when `get_mipmap_count` is called.
- GetWidth() -> int - Called when the Texture2D's width is queried.
- HasAlpha() -> bool - Called when the presence of an alpha channel in the Texture2D is queried.
- HasMipmaps() -> bool - Called when `has_mipmaps` is called.
- IsPixelOpaque(int x, int y) -> bool - Called when a pixel's opaque state in the Texture2D is queried at the specified `(x, y)` position.
- CreatePlaceholder() -> Resource - Creates a placeholder version of this resource (PlaceholderTexture2D).
- Draw(Rid canvasItem, Vector2 position, Color modulate = Color(1, 1, 1, 1), bool transpose = false) - Draws the texture using a CanvasItem with the RenderingServer API at the specified `position`.
- DrawRect(Rid canvasItem, Rect2 rect, bool tile, Color modulate = Color(1, 1, 1, 1), bool transpose = false) - Draws the texture using a CanvasItem with the RenderingServer API.
- DrawRectRegion(Rid canvasItem, Rect2 rect, Rect2 srcRect, Color modulate = Color(1, 1, 1, 1), bool transpose = false, bool clipUv = true) - Draws a part of the texture using a CanvasItem with the RenderingServer API.
- GetFormat() -> int - Returns the image format of the texture.
- GetHeight() -> int - Returns the texture height in pixels.
- GetImage() -> Image - Returns an Image that is a copy of data from this Texture2D (a new Image is created each time). Images can be accessed and manipulated directly. **Note:** This will return `null` if this Texture2D is invalid. **Note:** This will fetch the texture data from the GPU, which might cause performance problems when overused. Avoid calling `get_image` every frame, especially on large textures.
- GetMipmapCount() -> int - Returns the number of mipmaps of the texture.
- GetSize() -> Vector2 - Returns the texture size in pixels.
- GetWidth() -> int - Returns the texture width in pixels.
- HasAlpha() -> bool - Returns `true` if this Texture2D has an alpha channel.
- HasMipmaps() -> bool - Returns `true` if the texture has mipmaps.

