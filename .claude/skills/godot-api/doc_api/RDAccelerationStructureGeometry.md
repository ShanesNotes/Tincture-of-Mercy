## RDAccelerationStructureGeometry <- RefCounted

RDAccelerationStructureGeometry describes a set of triangles used as raytracing geometry in the `RenderingDevice.blas_create` method. The geometry is always in triangle list form, either indexed or non-indexed. Triangle strips are not supported.

**Props:**
- Flags: int (RenderingDevice.AccelerationStructureGeometryFlagBits) = 0
- IndexBuffer: Rid = RID()
- IndexCount: int = 0
- IndexOffset: int = 0
- VertexBuffer: Rid = RID()
- VertexCount: int = 0
- VertexFormat: int (RenderingDevice.DataFormat) = 232
- VertexOffset: int = 0
- VertexStride: int = 0

- **flags**: Flags for the geometry.
- **index_buffer**: Buffer containing vertex indices. If `null`, triangles are non-indexed.
- **index_count**: Number of indices used by this geometry in `index_buffer`.
- **index_offset**: Byte offset of the first index in `index_buffer`.
- **vertex_buffer**: Buffer containing vertices.
- **vertex_count**: Number of vertices used by this geometry in `vertex_buffer`.
- **vertex_format**: Format of the vertices in `vertex_buffer`.
- **vertex_offset**: Byte offset of the first vertex in `vertex_buffer`.
- **vertex_stride**: Number of bytes between each vertex in `vertex_buffer`.

