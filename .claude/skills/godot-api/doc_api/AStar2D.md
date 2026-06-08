## AStar2D <- RefCounted

An implementation of the A* algorithm, used to find the shortest path between two vertices on a connected graph in 2D space. See AStar3D for a more thorough explanation on how to use this class. AStar2D is a wrapper for AStar3D that enforces 2D coordinates.

**Props:**
- NeighborFilterEnabled: bool = false

- **neighbor_filter_enabled**: If `true` enables the filtering of neighbors via `_filter_neighbor`.

**Methods:**
- ComputeCost(int fromId, int toId) -> float - Called when computing the cost between two connected points. Note that this function is hidden in the default AStar2D class.
- EstimateCost(int fromId, int endId) -> float - Called when estimating the cost between a point and the path's ending point. Note that this function is hidden in the default AStar2D class.
- FilterNeighbor(int fromId, int neighborId) -> bool - Called when neighboring enters processing and if `neighbor_filter_enabled` is `true`. If `true` is returned the point will not be processed. Note that this function is hidden in the default AStar2D class.
- AddPoint(int id, Vector2 position, float weightScale = 1.0) - Adds a new point at the given position with the given identifier. The `id` must be 0 or larger, and the `weight_scale` must be 0.0 or greater. The `weight_scale` is multiplied by the result of `_compute_cost` when determining the overall cost of traveling across a segment from a neighboring point to this point. Thus, all else being equal, the algorithm prefers points with lower `weight_scale`s to form a path. If there already exists a point for the given `id`, its position and weight scale are updated to the given values.
- ArePointsConnected(int id, int toId, bool bidirectional = true) -> bool - Returns whether there is a connection/segment between the given points. If `bidirectional` is `false`, returns whether movement from `id` to `to_id` is possible through this segment.
- Clear() - Clears all the points and segments.
- ConnectPoints(int id, int toId, bool bidirectional = true) - Creates a segment between the given points. If `bidirectional` is `false`, only movement from `id` to `to_id` is allowed, not the reverse direction.
- DisconnectPoints(int id, int toId, bool bidirectional = true) - Deletes the segment between the given points. If `bidirectional` is `false`, only movement from `id` to `to_id` is prevented, and a unidirectional segment possibly remains.
- GetAvailablePointId() -> int - Returns the next available point ID with no point associated to it.
- GetClosestPoint(Vector2 toPosition, bool includeDisabled = false) -> int - Returns the ID of the closest point to `to_position`, optionally taking disabled points into account. Returns `-1` if there are no points in the points pool. **Note:** If several points are the closest to `to_position`, the one with the smallest ID will be returned, ensuring a deterministic result.
- GetClosestPositionInSegment(Vector2 toPosition) -> Vector2 - Returns the closest position to `to_position` that resides inside a segment between two connected points. The result is in the segment that goes from `y = 0` to `y = 5`. It's the closest position in the segment to the given point.
- GetIdPath(int fromId, int toId, bool allowPartialPath = false) -> long[] - Returns an array with the IDs of the points that form the path found by AStar2D between the given points. The array is ordered from the starting point to the ending point of the path. If `from_id` point is disabled, returns an empty array (even if `from_id == to_id`). If `from_id` point is not disabled, there is no valid path to the target, and `allow_partial_path` is `true`, returns a path to the point closest to the target that can be reached. **Note:** When `allow_partial_path` is `true` and `to_id` is disabled the search may take an unusually long time to finish. If you change the 2nd point's weight to 3, then the result will be `[1, 4, 3]` instead, because now even though the distance is longer, it's "easier" to get through point 4 than through point 2.
- GetPointCapacity() -> int - Returns the capacity of the structure backing the points, useful in conjunction with `reserve_space`.
- GetPointConnections(int id) -> long[] - Returns an array with the IDs of the points that form the connection with the given point.
- GetPointCount() -> int - Returns the number of points currently in the points pool.
- GetPointIds() -> long[] - Returns an array of all point IDs.
- GetPointPath(int fromId, int toId, bool allowPartialPath = false) -> Vector2[] - Returns an array with the points that are in the path found by AStar2D between the given points. The array is ordered from the starting point to the ending point of the path. If `from_id` point is disabled, returns an empty array (even if `from_id == to_id`). If `from_id` point is not disabled, there is no valid path to the target, and `allow_partial_path` is `true`, returns a path to the point closest to the target that can be reached. **Note:** This method is not thread-safe; it can only be used from a single Thread at a given time. Consider using Mutex to ensure exclusive access to one thread to avoid race conditions. Additionally, when `allow_partial_path` is `true` and `to_id` is disabled the search may take an unusually long time to finish.
- GetPointPosition(int id) -> Vector2 - Returns the position of the point associated with the given `id`.
- GetPointWeightScale(int id) -> float - Returns the weight scale of the point associated with the given `id`.
- HasPoint(int id) -> bool - Returns whether a point associated with the given `id` exists.
- IsPointDisabled(int id) -> bool - Returns whether a point is disabled or not for pathfinding. By default, all points are enabled.
- RemovePoint(int id) - Removes the point associated with the given `id` from the points pool.
- ReserveSpace(int numNodes) - Reserves space internally for `num_nodes` points. Useful if you're adding a known large number of points at once, such as points on a grid.
- SetPointDisabled(int id, bool disabled = true) - Disables or enables the specified point for pathfinding. Useful for making a temporary obstacle.
- SetPointPosition(int id, Vector2 position) - Sets the `position` for the point with the given `id`.
- SetPointWeightScale(int id, float weightScale) - Sets the `weight_scale` for the point with the given `id`. The `weight_scale` is multiplied by the result of `_compute_cost` when determining the overall cost of traveling across a segment from a neighboring point to this point.

