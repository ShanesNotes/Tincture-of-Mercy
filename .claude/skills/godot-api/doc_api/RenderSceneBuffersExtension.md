## RenderSceneBuffersExtension <- RenderSceneBuffers

This class allows for a RenderSceneBuffer implementation to be made in GDExtension.

**Methods:**
- Configure(RenderSceneBuffersConfiguration config) - Implement this in GDExtension to handle the (re)sizing of a viewport.
- SetAnisotropicFilteringLevel(int anisotropicFilteringLevel) - Implement this in GDExtension to change the anisotropic filtering level.
- SetFsrSharpness(float fsrSharpness) - Implement this in GDExtension to record a new FSR sharpness value.
- SetTextureMipmapBias(float textureMipmapBias) - Implement this in GDExtension to change the texture mipmap bias.
- SetUseDebanding(bool useDebanding) - Implement this in GDExtension to react to the debanding flag changing.

