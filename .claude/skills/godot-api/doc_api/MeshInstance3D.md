## MeshInstance3D <- GeometryInstance3D

MeshInstance3D is a node that takes a Mesh resource and adds it to the current scenario by creating an instance of it. This is the class most often used to render 3D geometry and can be used to instance a single Mesh in many places. This allows reusing geometry, which can save on resources. When a Mesh has to be instantiated more than thousands of times at close proximity, consider using a MultiMesh in a MultiMeshInstance3D instead.

**Props:**
- Mesh: Mesh
- Skeleton: NodePath = NodePath("")
- Skin: Skin

- **mesh**: The Mesh resource for the instance.
- **skeleton**: NodePath to the Skeleton3D associated with the instance. **Note:** The default value of this property has changed in Godot 4.6. Enable `ProjectSettings.animation/compatibility/default_parent_skeleton_in_mesh_instance_3d` if the old behavior is needed for compatibility.
- **skin**: The Skin to be used by this instance.

**Methods:**
- BakeMeshFromCurrentBlendShapeMix(ArrayMesh existing = null) -> ArrayMesh - Takes a snapshot from the current ArrayMesh with all blend shapes applied according to their current weights and bakes it to the provided `existing` mesh. If no `existing` mesh is provided a new ArrayMesh is created, baked and returned. Mesh surface materials are not copied. **Performance:** Mesh data needs to be received from the GPU, stalling the RenderingServer in the process.
- BakeMeshFromCurrentSkeletonPose(ArrayMesh existing = null) -> ArrayMesh - Takes a snapshot of the current animated skeleton pose of the skinned mesh and bakes it to the provided `existing` mesh. If no `existing` mesh is provided a new ArrayMesh is created, baked, and returned. Requires a skeleton with a registered skin to work. Blendshapes are ignored. Mesh surface materials are not copied. **Performance:** Mesh data needs to be retrieved from the GPU, stalling the RenderingServer in the process.
- CreateConvexCollision(bool clean = true, bool simplify = false) - This helper creates a StaticBody3D child node with a ConvexPolygonShape3D collision shape calculated from the mesh geometry. It's mainly used for testing. If `clean` is `true` (default), duplicate and interior vertices are removed automatically. You can set it to `false` to make the process faster if not needed. If `simplify` is `true`, the geometry can be further simplified to reduce the number of vertices. Disabled by default.
- CreateDebugTangents() - This helper creates a MeshInstance3D child node with gizmos at every vertex calculated from the mesh geometry. It's mainly used for testing.
- CreateMultipleConvexCollisions(MeshConvexDecompositionSettings settings = null) - This helper creates a StaticBody3D child node with multiple ConvexPolygonShape3D collision shapes calculated from the mesh geometry via convex decomposition. The convex decomposition operation can be controlled with parameters from the optional `settings`.
- CreateTrimeshCollision() - This helper creates a StaticBody3D child node with a ConcavePolygonShape3D collision shape calculated from the mesh geometry. It's mainly used for testing.
- FindBlendShapeByName(StringName name) -> int - Returns the index of the blend shape with the given `name`. Returns `-1` if no blend shape with this name exists, including when `mesh` is `null`.
- GetActiveMaterial(int surface) -> Material - Returns the Material that will be used by the Mesh when drawing. This can return the `GeometryInstance3D.material_override`, the surface override Material defined in this MeshInstance3D, or the surface Material defined in the `mesh`. For example, if `GeometryInstance3D.material_override` is used, all surfaces will return the override material. Returns `null` if no material is active, including when `mesh` is `null`.
- GetBlendShapeCount() -> int - Returns the number of blend shapes available. Produces an error if `mesh` is `null`.
- GetBlendShapeValue(int blendShapeIdx) -> float - Returns the value of the blend shape at the given `blend_shape_idx`. Returns `0.0` and produces an error if `mesh` is `null` or doesn't have a blend shape at that index.
- GetSkinReference() -> SkinReference - Returns the internal SkinReference containing the skeleton's RID attached to this RID. See also `Resource.get_rid`, `SkinReference.get_skeleton`, and `RenderingServer.instance_attach_skeleton`.
- GetSurfaceOverrideMaterial(int surface) -> Material - Returns the override Material for the specified `surface` of the Mesh resource. See also `get_surface_override_material_count`. **Note:** This returns the Material associated to the MeshInstance3D's Surface Material Override properties, not the material within the Mesh resource. To get the material within the Mesh resource, use `Mesh.surface_get_material` instead.
- GetSurfaceOverrideMaterialCount() -> int - Returns the number of surface override materials. This is equivalent to `Mesh.get_surface_count`. See also `get_surface_override_material`.
- SetBlendShapeValue(int blendShapeIdx, float value) - Sets the value of the blend shape at `blend_shape_idx` to `value`. Produces an error if `mesh` is `null` or doesn't have a blend shape at that index.
- SetSurfaceOverrideMaterial(int surface, Material material) - Sets the override `material` for the specified `surface` of the Mesh resource. This material is associated with this MeshInstance3D rather than with `mesh`. **Note:** This assigns the Material associated to the MeshInstance3D's Surface Material Override properties, not the material within the Mesh resource. To set the material within the Mesh resource, use `Mesh.surface_set_material` instead.

