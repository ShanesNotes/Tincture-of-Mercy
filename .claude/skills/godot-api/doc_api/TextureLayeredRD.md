## TextureLayeredRD <- TextureLayered

Base class for Texture2DArrayRD, TextureCubemapRD and TextureCubemapArrayRD. Cannot be used directly, but contains all the functions necessary for accessing the derived resource types. **Note:** TextureLayeredRD is intended for low-level usage with RenderingDevice. For most use cases, use TextureLayered instead.

**Props:**
- TextureRdRid: Rid

- **texture_rd_rid**: The RID of the texture object created on the RenderingDevice.

