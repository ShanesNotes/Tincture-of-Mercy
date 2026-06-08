## RenderSceneDataExtension <- RenderSceneData

This class allows for a RenderSceneData implementation to be made in GDExtension.

**Methods:**
- GetCamProjection() -> Projection - Implement this in GDExtension to return the camera Projection.
- GetCamTransform() -> Transform3D - Implement this in GDExtension to return the camera Transform3D.
- GetUniformBuffer() -> Rid - Implement this in GDExtension to return the RID of the uniform buffer containing the scene data as a UBO.
- GetViewCount() -> int - Implement this in GDExtension to return the view count.
- GetViewEyeOffset(int view) -> Vector3 - Implement this in GDExtension to return the eye offset for the given `view`.
- GetViewProjection(int view) -> Projection - Implement this in GDExtension to return the view Projection for the given `view`.

