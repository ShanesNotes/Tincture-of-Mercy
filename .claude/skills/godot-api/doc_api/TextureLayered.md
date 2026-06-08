## TextureLayered <- Texture

Base class for ImageTextureLayered and CompressedTextureLayered. Cannot be used directly, but contains all the functions necessary for accessing the derived resource types. See also Texture3D. Data is set on a per-layer basis. For Texture2DArrays, the layer specifies the array layer. All images need to have the same width, height and number of mipmap levels. A TextureLayered can be loaded with `ResourceLoader.load`. Internally, Godot maps these files to their respective counterparts in the target rendering driver (Vulkan, OpenGL3).

**Methods:**
- GetFormat() -> int - Called when the TextureLayered's format is queried.
- GetHeight() -> int - Called when the TextureLayered's height is queried.
- GetLayerData(int layerIndex) -> Image - Called when the data for a layer in the TextureLayered is queried.
- GetLayeredType() -> int - Called when the layers' type in the TextureLayered is queried.
- GetLayers() -> int - Called when the number of layers in the TextureLayered is queried.
- GetWidth() -> int - Called when the TextureLayered's width queried.
- HasMipmaps() -> bool - Called when the presence of mipmaps in the TextureLayered is queried.
- GetFormat() -> int - Returns the current format being used by this texture.
- GetHeight() -> int - Returns the height of the texture in pixels. Height is typically represented by the Y axis.
- GetLayerData(int layer) -> Image - Returns an Image resource with the data from specified `layer`.
- GetLayeredType() -> int - Returns the TextureLayered's type. The type determines how the data is accessed, with cubemaps having special types.
- GetLayers() -> int - Returns the number of referenced Images.
- GetWidth() -> int - Returns the width of the texture in pixels. Width is typically represented by the X axis.
- HasMipmaps() -> bool - Returns `true` if the layers have generated mipmaps.

**Enums:**
**LayeredType:** LAYERED_TYPE_2D_ARRAY=0, LAYERED_TYPE_CUBEMAP=1, LAYERED_TYPE_CUBEMAP_ARRAY=2
  - LAYERED_TYPE_2D_ARRAY: Texture is a generic Texture2DArray.
  - LAYERED_TYPE_CUBEMAP: Texture is a Cubemap, with each side in its own layer (6 in total).
  - LAYERED_TYPE_CUBEMAP_ARRAY: Texture is a CubemapArray, with each cubemap being made of 6 layers.

