## RenderSceneBuffersRD <- RenderSceneBuffers

This object manages all 3D rendering buffers for the rendering device based renderers. An instance of this object is created for every viewport that has 3D rendering enabled. See also RenderSceneBuffers. All buffers are organized in **contexts**. The default context is called **render_buffers** and can contain amongst others the color buffer, depth buffer, velocity buffers, VRS density map and MSAA variants of these buffers. Buffers are only guaranteed to exist during rendering of the viewport. **Note:** This is an internal rendering server object. Do not instantiate this class from a script.

**Methods:**
- ClearContext(StringName context) - Frees all buffers related to this context.
- CreateTexture(StringName context, StringName name, int dataFormat, int usageBits, int textureSamples, Vector2i size, int layers, int mipmaps, bool unique, bool discardable) -> Rid - Create a new texture with the given definition and cache this under the given name. Will return the existing texture if it already exists.
- CreateTextureFromFormat(StringName context, StringName name, RDTextureFormat format, RDTextureView view, bool unique) -> Rid - Create a new texture using the given format and view and cache this under the given name. Will return the existing texture if it already exists.
- CreateTextureView(StringName context, StringName name, StringName viewName, RDTextureView view) -> Rid - Create a new texture view for an existing texture and cache this under the given `view_name`. Will return the existing texture view if it already exists. Will error if the source texture doesn't exist.
- GetColorLayer(int layer, bool msaa = false) -> Rid - Returns the specified layer from the color texture we are rendering 3D content to. If `msaa` is `true` and MSAA is enabled, this returns the MSAA variant of the buffer.
- GetColorTexture(bool msaa = false) -> Rid - Returns the color texture we are rendering 3D content to. If multiview is used this will be a texture array with all views. If `msaa` is `true` and MSAA is enabled, this returns the MSAA variant of the buffer.
- GetDepthLayer(int layer, bool msaa = false) -> Rid - Returns the specified layer from the depth texture we are rendering 3D content to. If `msaa` is `true` and MSAA is enabled, this returns the MSAA variant of the buffer.
- GetDepthTexture(bool msaa = false) -> Rid - Returns the depth texture we are rendering 3D content to. If multiview is used this will be a texture array with all views. If `msaa` is `true` and MSAA is enabled, this returns the MSAA variant of the buffer.
- GetFsrSharpness() -> float - Returns the FSR sharpness value used while rendering the 3D content (if `get_scaling_3d_mode` is an FSR mode).
- GetInternalSize() -> Vector2i - Returns the internal size of the render buffer (size before upscaling) with which textures are created by default.
- GetMsaa3d() -> int - Returns the applied 3D MSAA mode for this viewport.
- GetRenderTarget() -> Rid - Returns the render target associated with this buffers object.
- GetScaling3dMode() -> int - Returns the scaling mode used for upscaling.
- GetScreenSpaceAa() -> int - Returns the screen-space antialiasing method applied.
- GetTargetSize() -> Vector2i - Returns the target size of the render buffer (size after upscaling).
- GetTexture(StringName context, StringName name) -> Rid - Returns a cached texture with this name.
- GetTextureFormat(StringName context, StringName name) -> RDTextureFormat - Returns the texture format information with which a cached texture was created.
- GetTextureSamples() -> int - Returns the number of MSAA samples used.
- GetTextureSlice(StringName context, StringName name, int layer, int mipmap, int layers, int mipmaps) -> Rid - Returns a specific slice (layer or mipmap) for a cached texture.
- GetTextureSliceSize(StringName context, StringName name, int mipmap) -> Vector2i - Returns the texture size of a given slice of a cached texture.
- GetTextureSliceView(StringName context, StringName name, int layer, int mipmap, int layers, int mipmaps, RDTextureView view) -> Rid - Returns a specific view of a slice (layer or mipmap) for a cached texture.
- GetUseDebanding() -> bool - Returns `true` if debanding is enabled.
- GetUseTaa() -> bool - Returns `true` if TAA is enabled.
- GetVelocityLayer(int layer, bool msaa = false) -> Rid - Returns the specified layer from the velocity texture we are rendering 3D content to.
- GetVelocityTexture(bool msaa = false) -> Rid - Returns the velocity texture we are rendering 3D content to. If multiview is used this will be a texture array with all views. If `msaa` is **true** and MSAA is enabled, this returns the MSAA variant of the buffer.
- GetViewCount() -> int - Returns the view count for the associated viewport.
- HasTexture(StringName context, StringName name) -> bool - Returns `true` if a cached texture exists for this name.

