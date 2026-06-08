## CompressedTextureLayered <- TextureLayered

Base class for CompressedTexture2DArray and CompressedTexture3D. Cannot be used directly, but contains all the functions necessary for accessing the derived resource types. See also TextureLayered.

**Props:**
- LoadPath: string = ""

- **load_path**: The path the texture should be loaded from.

**Methods:**
- Load(string path) -> int - Loads the texture at `path`.

