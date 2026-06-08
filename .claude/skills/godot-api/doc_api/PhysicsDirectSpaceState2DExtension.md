## PhysicsDirectSpaceState2DExtension <- PhysicsDirectSpaceState2D

This class extends PhysicsDirectSpaceState2D by providing additional virtual methods that can be overridden. When these methods are overridden, they will be called instead of the internal methods of the physics server. Intended for use with GDExtension to create custom implementations of PhysicsDirectSpaceState2D.

**Methods:**
- CastMotion(Rid shapeRid, Transform2D transform, Vector2 motion, float margin, int collisionMask, bool collideWithBodies, bool collideWithAreas, float* rClosestSafe, float* rClosestUnsafe) -> bool
- CollideShape(Rid shapeRid, Transform2D transform, Vector2 motion, float margin, int collisionMask, bool collideWithBodies, bool collideWithAreas, void* rResults, int maxResults, int32_t* rResultCount) -> bool
- IntersectPoint(Vector2 position, int canvasInstanceId, int collisionMask, bool collideWithBodies, bool collideWithAreas, PhysicsServer2DExtensionShapeResult* rResults, int maxResults) -> int
- IntersectRay(Vector2 from, Vector2 to, int collisionMask, bool collideWithBodies, bool collideWithAreas, bool hitFromInside, PhysicsServer2DExtensionRayResult* rResult) -> bool
- IntersectShape(Rid shapeRid, Transform2D transform, Vector2 motion, float margin, int collisionMask, bool collideWithBodies, bool collideWithAreas, PhysicsServer2DExtensionShapeResult* rResult, int maxResults) -> int
- RestInfo(Rid shapeRid, Transform2D transform, Vector2 motion, float margin, int collisionMask, bool collideWithBodies, bool collideWithAreas, PhysicsServer2DExtensionShapeRestInfo* rRestInfo) -> bool
- IsBodyExcludedFromQuery(Rid body) -> bool

