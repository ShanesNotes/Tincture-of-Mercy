## PhysicsServer3DRenderingServerHandler <- Object

**Methods:**
- SetAabb(Aabb aabb) - Called by the PhysicsServer3D to set the bounding box for the SoftBody3D.
- SetNormal(int vertexId, Vector3 normal) - Called by the PhysicsServer3D to set the normal for the SoftBody3D vertex at the index specified by `vertex_id`. **Note:** The `normal` parameter used to be of type `const void*` prior to Godot 4.2.
- SetVertex(int vertexId, Vector3 vertex) - Called by the PhysicsServer3D to set the position for the SoftBody3D vertex at the index specified by `vertex_id`. **Note:** The `vertex` parameter used to be of type `const void*` prior to Godot 4.2.
- SetAabb(Aabb aabb) - Sets the bounding box for the SoftBody3D.
- SetNormal(int vertexId, Vector3 normal) - Sets the normal for the SoftBody3D vertex at the index specified by `vertex_id`.
- SetVertex(int vertexId, Vector3 vertex) - Sets the position for the SoftBody3D vertex at the index specified by `vertex_id`.

