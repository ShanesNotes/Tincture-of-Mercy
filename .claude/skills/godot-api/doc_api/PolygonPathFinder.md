## PolygonPathFinder <- Resource

**Methods:**
- FindPath(Vector2 from, Vector2 to) -> Vector2[]
- GetBounds() -> Rect2
- GetClosestPoint(Vector2 point) -> Vector2
- GetIntersections(Vector2 from, Vector2 to) -> Vector2[]
- GetPointPenalty(int idx) -> float
- IsPointInside(Vector2 point) -> bool - Returns `true` if `point` falls inside the polygon area.
- SetPointPenalty(int idx, float penalty)
- Setup(Vector2[] points, int[] connections) - Sets up PolygonPathFinder with an array of points that define the vertices of the polygon, and an array of indices that determine the edges of the polygon. The length of `connections` must be even, returns an error if odd.

