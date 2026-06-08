## CameraFeed <- RefCounted

A camera feed gives you access to a single physical camera attached to your device. When enabled, Godot will start capturing frames from the camera which can then be used. See also CameraServer. **Note:** Many cameras will return YCbCr images which are split into two textures and need to be combined in a shader. Godot does this automatically for you if you set the environment to show the camera image in the background. **Note:** This class is currently only implemented on Linux, Android, macOS, and iOS. On other platforms no CameraFeeds will be available. To get a CameraFeed on iOS, enable `EditorExportPlatformIOS.modules/camera`.

**Props:**
- FeedIsActive: bool = false
- FeedTransform: Transform2D = Transform2D(1, 0, 0, -1, 0, 1)
- Formats: Godot.Collections.Array = []

- **feed_is_active**: If `true`, the feed is active.
- **feed_transform**: The transform applied to the camera's image.
- **formats**: Formats supported by the feed. Each entry is a Dictionary describing format parameters.

**Methods:**
- ActivateFeed() -> bool - Called when the camera feed is activated.
- DeactivateFeed() - Called when the camera feed is deactivated.
- GetFormats() -> Godot.Collections.Array - Override this method to define supported formats of the camera feed.
- SetFormat(int index, Godot.Collections.Dictionary parameters) -> bool - Override this method to set the format of the camera feed.
- GetDatatype() -> int - Returns feed image data type.
- GetId() -> int - Returns the unique ID for this feed.
- GetName() -> string - Returns the camera's name.
- GetPosition() -> int - Returns the position of camera on the device.
- GetTextureTexId(int feedImageType) -> int - Returns the texture backend ID (usable by some external libraries that need a handle to a texture to write data).
- SetExternal(int width, int height) - Sets the feed as external feed provided by another library.
- SetFormat(int index, Godot.Collections.Dictionary parameters) -> bool - Sets the feed format parameters for the given `index` in the `formats` array. Returns `true` on success. By default, the YUYV encoded stream is transformed to `FEED_RGB`. The YUYV encoded stream output format can be changed by setting `parameters`'s `output` entry to one of the following: - `"separate"` will result in `FEED_YCBCR_SEP`; - `"grayscale"` will result in desaturated `FEED_RGB`; - `"copy"` will result in `FEED_YCBCR`.
- SetName(string name) - Sets the camera's name.
- SetPosition(int position) - Sets the position of this camera.
- SetRgbImage(Image rgbImage) - Sets RGB image for this feed.
- SetYcbcrImage(Image ycbcrImage) - Sets YCbCr image for this feed.
- SetYcbcrImages(Image yImage, Image cbcrImage) - Sets Y and CbCr images for this feed.

**Signals:**
- FormatChanged - Emitted when the format has changed.
- FrameChanged - Emitted when a new frame is available.

**Enums:**
**FeedDataType:** FEED_NOIMAGE=0, FEED_RGB=1, FEED_YCBCR=2, FEED_YCBCR_SEP=3, FEED_EXTERNAL=4
  - FEED_NOIMAGE: No image set for the feed.
  - FEED_RGB: Feed supplies RGB images.
  - FEED_YCBCR: Feed supplies YCbCr images that need to be converted to RGB.
  - FEED_YCBCR_SEP: Feed supplies separate Y and CbCr images that need to be combined and converted to RGB.
  - FEED_EXTERNAL: Feed supplies external image.
**FeedPosition:** FEED_UNSPECIFIED=0, FEED_FRONT=1, FEED_BACK=2
  - FEED_UNSPECIFIED: Unspecified position.
  - FEED_FRONT: Camera is mounted at the front of the device.
  - FEED_BACK: Camera is mounted at the back of the device.

