## CameraTexture <- Texture2D

This texture gives access to the camera texture provided by a CameraFeed. **Note:** Many cameras supply YCbCr images which need to be converted in a shader.

**Props:**
- CameraFeedId: int = 0
- CameraIsActive: bool = false
- ResourceLocalToScene: bool = false
- WhichFeed: int (CameraServer.FeedImage) = 0

- **camera_feed_id**: The ID of the CameraFeed for which we want to display the image.
- **camera_is_active**: Convenience property that gives access to the active property of the CameraFeed.
- **which_feed**: Which image within the CameraFeed we want access to, important if the camera image is split in a Y and CbCr component.

