## RDVertexAttribute <- RefCounted

This object is used by RenderingDevice.

**Props:**
- Binding: int = 4294967295
- Format: int (RenderingDevice.DataFormat) = 232
- Frequency: int (RenderingDevice.VertexFrequency) = 0
- Location: int = 0
- Offset: int = 0
- Stride: int = 0

- **binding**: The index of the buffer in the vertex buffer array to bind this vertex attribute. When set to `-1`, it defaults to the index of the attribute. **Note:** You cannot mix binding explicitly assigned attributes with implicitly assigned ones (i.e. `-1`). Either all attributes must have their binding set to `-1`, or all must have explicit bindings.
- **format**: The way that this attribute's data is interpreted when sent to a shader.
- **frequency**: The rate at which this attribute is pulled from its vertex buffer.
- **location**: The location in the shader that this attribute is bound to.
- **offset**: The number of bytes between the start of the vertex buffer and the first instance of this attribute.
- **stride**: The number of bytes between the starts of consecutive instances of this attribute.

