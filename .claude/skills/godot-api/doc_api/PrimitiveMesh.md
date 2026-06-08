## PrimitiveMesh <- Mesh

Base class for all primitive meshes. Handles applying a Material to a primitive mesh. Examples include BoxMesh, CapsuleMesh, CylinderMesh, PlaneMesh, PrismMesh, and SphereMesh.

**Props:**
- AddUv2: bool = false
- CustomAabb: Aabb = AABB(0, 0, 0, 0, 0, 0)
- FlipFaces: bool = false
- Material: Material
- Uv2Padding: float = 2.0

- **add_uv2**: If set, generates UV2 UV coordinates applying a padding using the `uv2_padding` setting. UV2 is needed for lightmapping.
- **custom_aabb**: Overrides the AABB with one defined by user for use with frustum culling. Especially useful to avoid unexpected culling when using a shader to offset vertices.
- **flip_faces**: If `true`, the order of the vertices in each triangle is reversed, resulting in the backside of the mesh being drawn. This gives the same result as using `BaseMaterial3D.CULL_FRONT` in `BaseMaterial3D.cull_mode`.
- **material**: The current Material of the primitive mesh.
- **uv2_padding**: If `add_uv2` is set, specifies the padding in pixels applied along seams of the mesh. Lower padding values allow making better use of the lightmap texture (resulting in higher texel density), but may introduce visible lightmap bleeding along edges. If the size of the lightmap texture can't be determined when generating the mesh, UV2 is calculated assuming a texture size of 1024x1024.

**Methods:**
- CreateMeshArray() -> Godot.Collections.Array - Override this method to customize how this primitive mesh should be generated. Should return an Array where each element is another Array of values required for the mesh (see the `Mesh.ArrayType` constants).
- GetMeshArrays() -> Godot.Collections.Array - Returns the mesh arrays used to make up the surface of this primitive mesh. **Example:** Pass the result to `ArrayMesh.add_surface_from_arrays` to create a new surface:
- RequestUpdate() - Request an update of this primitive mesh based on its properties.

