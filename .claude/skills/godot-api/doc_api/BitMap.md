## BitMap <- Resource

A two-dimensional array of boolean values, can be used to efficiently store a binary matrix (every matrix element takes only one bit) and query the values using natural cartesian coordinates.

**Methods:**
- ConvertToImage() -> Image - Returns an image of the same size as the bitmap and with an `Image.Format` of type `Image.FORMAT_L8`. `true` bits of the bitmap are being converted into white pixels, and `false` bits into black.
- Create(Vector2i size) - Creates a bitmap with the specified size, filled with `false`.
- CreateFromImageAlpha(Image image, float threshold = 0.1) - Creates a bitmap that matches the given image dimensions, every element of the bitmap is set to `false` if the alpha value of the image at that position is equal to `threshold` or less, and `true` in other case.
- GetBit(int x, int y) -> bool - Returns bitmap's value at the specified position.
- GetBitv(Vector2i position) -> bool - Returns bitmap's value at the specified position.
- GetSize() -> Vector2i - Returns bitmap's dimensions.
- GetTrueBitCount() -> int - Returns the number of bitmap elements that are set to `true`.
- GrowMask(int pixels, Rect2i rect) - Applies morphological dilation or erosion to the bitmap. If `pixels` is positive, dilation is applied to the bitmap. If `pixels` is negative, erosion is applied to the bitmap. `rect` defines the area where the morphological operation is applied. Pixels located outside the `rect` are unaffected by `grow_mask`.
- OpaqueToPolygons(Rect2i rect, float epsilon = 2.0) -> PackedVector2Array[] - Creates an Array of polygons covering a rectangular portion of the bitmap. It uses a marching squares algorithm, followed by Ramer-Douglas-Peucker (RDP) reduction of the number of vertices. Each polygon is described as a PackedVector2Array of its vertices. To get polygons covering the whole bitmap, pass: `epsilon` is passed to RDP to control how accurately the polygons cover the bitmap: a lower `epsilon` corresponds to more points in the polygons.
- Resize(Vector2i newSize) - Resizes the image to `new_size`.
- SetBit(int x, int y, bool bit) - Sets the bitmap's element at the specified position, to the specified value.
- SetBitRect(Rect2i rect, bool bit) - Sets a rectangular portion of the bitmap to the specified value.
- SetBitv(Vector2i position, bool bit) - Sets the bitmap's element at the specified position, to the specified value.

