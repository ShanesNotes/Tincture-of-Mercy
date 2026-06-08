## PhysicsRayQueryParameters2D <- RefCounted

By changing various properties of this object, such as the ray position, you can configure the parameters for `PhysicsDirectSpaceState2D.intersect_ray`.

**Props:**
- CollideWithAreas: bool = false
- CollideWithBodies: bool = true
- CollisionMask: int = 4294967295
- Exclude: RID[] = []
- From: Vector2 = Vector2(0, 0)
- HitFromInside: bool = false
- To: Vector2 = Vector2(0, 0)

- **collide_with_areas**: If `true`, the query will take Area2Ds into account.
- **collide_with_bodies**: If `true`, the query will take PhysicsBody2Ds into account.
- **collision_mask**: The physics layers the query will detect (as a bitmask). By default, all collision layers are detected. See in the documentation for more information.
- **exclude**: The list of object RIDs that will be excluded from collisions. Use `CollisionObject2D.get_rid` to get the RID associated with a CollisionObject2D-derived node. **Note:** The returned array is copied and any changes to it will not update the original property value. To update the value you need to modify the returned array, and then assign it to the property again.
- **from**: The starting point of the ray being queried for, in global coordinates.
- **hit_from_inside**: If `true`, the query will detect a hit when starting inside shapes. In this case the collision normal will be `Vector2(0, 0)`. Does not affect concave polygon shapes.
- **to**: The ending point of the ray being queried for, in global coordinates.

**Methods:**
- Create(Vector2 from, Vector2 to, int collisionMask = 4294967295, RID[] exclude = []) -> PhysicsRayQueryParameters2D - Returns a new, pre-configured PhysicsRayQueryParameters2D object. Use it to quickly create query parameters using the most common options.

