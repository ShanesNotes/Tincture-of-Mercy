## PhysicsRayQueryParameters3D <- RefCounted

By changing various properties of this object, such as the ray position, you can configure the parameters for `PhysicsDirectSpaceState3D.intersect_ray`.

**Props:**
- CollideWithAreas: bool = false
- CollideWithBodies: bool = true
- CollisionMask: int = 4294967295
- Exclude: RID[] = []
- From: Vector3 = Vector3(0, 0, 0)
- HitBackFaces: bool = true
- HitFromInside: bool = false
- To: Vector3 = Vector3(0, 0, 0)

- **collide_with_areas**: If `true`, the query will take Area3Ds into account.
- **collide_with_bodies**: If `true`, the query will take PhysicsBody3Ds into account.
- **collision_mask**: The physics layers the query will detect (as a bitmask). By default, all collision layers are detected. See in the documentation for more information.
- **exclude**: The list of object RIDs that will be excluded from collisions. Use `CollisionObject3D.get_rid` to get the RID associated with a CollisionObject3D-derived node. **Note:** The returned array is copied and any changes to it will not update the original property value. To update the value you need to modify the returned array, and then assign it to the property again.
- **from**: The starting point of the ray being queried for, in global coordinates.
- **hit_back_faces**: If `true`, the query will hit back faces with concave polygon shapes with back face enabled or heightmap shapes.
- **hit_from_inside**: If `true`, the query will detect a hit when starting inside shapes. In this case the collision normal will be `Vector3(0, 0, 0)`. Does not affect concave polygon shapes or heightmap shapes.
- **to**: The ending point of the ray being queried for, in global coordinates.

**Methods:**
- Create(Vector3 from, Vector3 to, int collisionMask = 4294967295, RID[] exclude = []) -> PhysicsRayQueryParameters3D - Returns a new, pre-configured PhysicsRayQueryParameters3D object. Use it to quickly create query parameters using the most common options.

