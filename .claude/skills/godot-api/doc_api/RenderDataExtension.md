## RenderDataExtension <- RenderData

This class allows for a RenderData implementation to be made in GDExtension.

**Methods:**
- GetCameraAttributes() -> Rid - Implement this in GDExtension to return the RID for the implementation's camera attributes object.
- GetEnvironment() -> Rid - Implement this in GDExtension to return the RID of the implementation's environment object.
- GetRenderSceneBuffers() -> RenderSceneBuffers - Implement this in GDExtension to return the implementation's RenderSceneBuffers object.
- GetRenderSceneData() -> RenderSceneData - Implement this in GDExtension to return the implementation's RenderSceneDataExtension object.

