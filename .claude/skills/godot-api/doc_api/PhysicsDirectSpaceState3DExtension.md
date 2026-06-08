## PhysicsDirectSpaceState3DExtension <- PhysicsDirectSpaceState3D

This class extends PhysicsDirectSpaceState3D by providing additional virtual methods that can be overridden. When these methods are overridden, they will be called instead of the internal methods of the physics server. Intended for use with GDExtension to create custom implementations of PhysicsDirectSpaceState3D.

**Methods:**
- CastMotion(Rid shapeRid, Transform3D transform, Vector3 motion, float margin, int collisionMask, bool collideWithBodies, bool collideWithAreas, float* rClosestSafe, float* rClosestUnsafe, PhysicsServer3DExtensionShapeRestInfo* rInfo) -> bool
- CollideShape(Rid shapeRid, Transform3D transform, Vector3 motion, float margin, int collisionMask, bool collideWithBodies, bool collideWithAreas, void* rResults, int maxResults, int32_t* rResultCount) -> bool
- GetClosestPointToObjectVolume(Rid object, Vector3 point) -> Vector3
- IntersectPoint(Vector3 position, int collisionMask, bool collideWithBodies, bool collideWithAreas, PhysicsServer3DExtensionShapeResult* rResults, int maxResults) -> int
- IntersectRay(Vector3 from, Vector3 to, int collisionMask, bool collideWithBodies, bool collideWithAreas, bool hitFromInside, bool hitBackFaces, bool pickRay, PhysicsServer3DExtensionRayResult* rResult) -> bool
- IntersectShape(Rid shapeRid, Transform3D transform, Vector3 motion, float margin, int collisionMask, bool collideWithBodies, bool collideWithAreas, PhysicsServer3DExtensionShapeResult* rResultCount, int maxResults) -> int
- RestInfo(Rid shapeRid, Transform3D transform, Vector3 motion, float margin, int collisionMask, bool collideWithBodies, bool collideWithAreas, PhysicsServer3DExtensionShapeRestInfo* rRestInfo) -> bool
- IsBodyExcludedFromQuery(Rid body) -> bool

