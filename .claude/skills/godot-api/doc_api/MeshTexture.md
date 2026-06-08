## MeshTexture <- Texture2D

Simple texture that uses a mesh to draw itself. It's limited because flags can't be changed and region drawing is not supported.

**Props:**
- BaseTexture: Texture2D
- ImageSize: Vector2 = Vector2(0, 0)
- Mesh: Mesh
- ResourceLocalToScene: bool = false

- **base_texture**: Sets the base texture that the Mesh will use to draw.
- **image_size**: Sets the size of the image, needed for reference.
- **mesh**: Sets the mesh used to draw. It must be a mesh using 2D vertices.

