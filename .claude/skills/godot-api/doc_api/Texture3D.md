## Texture3D <- Texture

Base class for ImageTexture3D and CompressedTexture3D. Cannot be used directly, but contains all the functions necessary for accessing the derived resource types. Texture3D is the base class for all 3-dimensional texture types. See also TextureLayered. All images need to have the same width, height and number of mipmap levels. To create such a texture file yourself, reimport your image files using the Godot Editor import presets.

**Methods:**
- GetData() -> Image[] - Called when the Texture3D's data is queried.
- GetDepth() -> int - Called when the Texture3D's depth is queried.
- GetFormat() -> int - Called when the Texture3D's format is queried.
- GetHeight() -> int - Called when the Texture3D's height is queried.
- GetWidth() -> int - Called when the Texture3D's width is queried.
- HasMipmaps() -> bool - Called when the presence of mipmaps in the Texture3D is queried.
- CreatePlaceholder() -> Resource - Creates a placeholder version of this resource (PlaceholderTexture3D).
- GetData() -> Image[] - Returns the Texture3D's data as an array of Images. Each Image represents a *slice* of the Texture3D, with different slices mapping to different depth (Z axis) levels.
- GetDepth() -> int - Returns the Texture3D's depth in pixels. Depth is typically represented by the Z axis (a dimension not present in Texture2D).
- GetFormat() -> int - Returns the current format being used by this texture.
- GetHeight() -> int - Returns the Texture3D's height in pixels. Width is typically represented by the Y axis.
- GetWidth() -> int - Returns the Texture3D's width in pixels. Width is typically represented by the X axis.
- HasMipmaps() -> bool - Returns `true` if the Texture3D has generated mipmaps.

