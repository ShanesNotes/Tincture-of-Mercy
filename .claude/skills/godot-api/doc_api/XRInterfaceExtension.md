## XRInterfaceExtension <- XRInterface

External XR interface plugins should inherit from this class.

**Methods:**
- EndFrame() - Called if interface is active and queues have been submitted.
- GetAnchorDetectionIsEnabled() -> bool - Return `true` if anchor detection is enabled for this interface.
- GetCameraFeedId() -> int - Returns the camera feed ID for the CameraFeed registered with the CameraServer that should be presented as the background on an AR capable device (if applicable).
- GetCameraTransform() -> Transform3D - Returns the Transform3D that positions the XRCamera3D in the world.
- GetCapabilities() -> int - Returns the capabilities of this interface.
- GetColorTexture() -> Rid - Return color texture into which to render (if applicable).
- GetDepthTexture() -> Rid - Return depth texture into which to render (if applicable).
- GetName() -> StringName - Returns the name of this interface.
- GetPlayArea() -> Vector3[] - Returns a PackedVector3Array that represents the play areas boundaries (if applicable).
- GetPlayAreaMode() -> int - Returns the play area mode that sets up our play area.
- GetProjectionForView(int view, float aspect, float zNear, float zFar) -> double[] - Returns the projection matrix for the given view as a PackedFloat64Array.
- GetRenderTargetSize() -> Vector2 - Returns the size of our render target for this interface, this overrides the size of the Viewport marked as the xr viewport.
- GetSuggestedPoseNames(StringName trackerName) -> string[] - Returns a PackedStringArray with pose names configured by this interface. Note that user configuration can override this list.
- GetSuggestedTrackerNames() -> string[] - Returns a PackedStringArray with tracker names configured by this interface. Note that user configuration can override this list.
- GetSystemInfo() -> Godot.Collections.Dictionary - Returns a Dictionary with system information related to this interface.
- GetTrackingStatus() -> int - Returns the current status of our tracking.
- GetTransformForView(int view, Transform3D camTransform) -> Transform3D - Returns a Transform3D for a given view.
- GetVelocityTexture() -> Rid - Return velocity texture into which to render (if applicable).
- GetViewCount() -> int - Returns the number of views this interface requires, 1 for mono, 2 for stereoscopic.
- GetVrsTexture() -> Rid
- GetVrsTextureFormat() -> int - Returns the format of the texture returned by `_get_vrs_texture`.
- Initialize() -> bool - Initializes the interface, returns `true` on success.
- IsInitialized() -> bool - Returns `true` if this interface has been initialized.
- PostDrawViewport(Rid renderTarget, Rect2 screenRect) - Called after the XR Viewport draw logic has completed.
- PreDrawViewport(Rid renderTarget) -> bool - Called if this is our primary XRInterfaceExtension before we start processing a Viewport for every active XR Viewport, returns `true` if that viewport should be rendered. An XR interface may return `false` if the user has taken off their headset and we can pause rendering.
- PreRender() - Called if this XRInterfaceExtension is active before rendering starts. Most XR interfaces will sync tracking at this point in time.
- Process() - Called if this XRInterfaceExtension is active before our physics and game process is called. Most XR interfaces will update its XRPositionalTrackers at this point in time.
- SetAnchorDetectionIsEnabled(bool enabled) - Enables anchor detection on this interface if supported.
- SetPlayAreaMode(int mode) -> bool - Set the play area mode for this interface.
- SupportsPlayAreaMode(int mode) -> bool - Returns `true` if this interface supports this play area mode.
- TriggerHapticPulse(string actionName, StringName trackerName, float frequency, float amplitude, float durationSec, float delaySec) - Triggers a haptic pulse to be emitted on the specified tracker.
- Uninitialize() - Uninitialize the interface.
- AddBlit(Rid renderTarget, Rect2 srcRect, Rect2i dstRect, bool useLayer, int layer, bool applyLensDistortion, Vector2 eyeCenter, float k1, float k2, float upscale, float aspectRatio) - Blits our render results to screen optionally applying lens distortion. This can only be called while processing `_commit_views`.
- GetColorTexture() -> Rid
- GetDepthTexture() -> Rid
- GetRenderTargetTexture(Rid renderTarget) -> Rid - Returns a valid RID for a texture to which we should render the current frame if supported by the interface.
- GetVelocityTexture() -> Rid

