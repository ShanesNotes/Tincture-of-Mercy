## AStarGrid2D <- RefCounted

AStarGrid2D is a variant of AStar2D that is specialized for partial 2D grids. It is simpler to use because it doesn't require you to manually create points and connect them together. This class also supports multiple types of heuristics, modes for diagonal movement, and a jumping mode to speed up calculations. To use AStarGrid2D, you only need to set the `region` of the grid, optionally set the `cell_size`, and then call the `update` method: To remove a point from the pathfinding grid, it must be set as "solid" with `set_point_solid`.

**Props:**
- CellShape: int (AStarGrid2D.CellShape) = 0
- CellSize: Vector2 = Vector2(1, 1)
- DefaultComputeHeuristic: int (AStarGrid2D.Heuristic) = 0
- DefaultEstimateHeuristic: int (AStarGrid2D.Heuristic) = 0
- DiagonalMode: int (AStarGrid2D.DiagonalMode) = 0
- JumpingEnabled: bool = false
- Offset: Vector2 = Vector2(0, 0)
- Region: Rect2i = Rect2i(0, 0, 0, 0)
- Size: Vector2i = Vector2i(0, 0)

- **cell_shape**: The cell shape. Affects how the positions are placed in the grid. If changed, `update` needs to be called before finding the next path.
- **cell_size**: The size of the point cell which will be applied to calculate the resulting point position returned by `get_point_path`. If changed, `update` needs to be called before finding the next path.
- **default_compute_heuristic**: The default `Heuristic` which will be used to calculate the cost between two points if `_compute_cost` was not overridden.
- **default_estimate_heuristic**: The default `Heuristic` which will be used to calculate the cost between the point and the end point if `_estimate_cost` was not overridden.
- **diagonal_mode**: A specific `DiagonalMode` mode which will force the path to avoid or accept the specified diagonals.
- **jumping_enabled**: Enables or disables jumping to skip up the intermediate points and speeds up the searching algorithm. **Note:** Currently, toggling it on disables the consideration of weight scaling in pathfinding.
- **offset**: The offset of the grid which will be applied to calculate the resulting point position returned by `get_point_path`. If changed, `update` needs to be called before finding the next path.
- **region**: The region of grid cells available for pathfinding. If changed, `update` needs to be called before finding the next path.
- **size**: The size of the grid (number of cells of size `cell_size` on each axis). If changed, `update` needs to be called before finding the next path.

**Methods:**
- ComputeCost(Vector2i fromId, Vector2i toId) -> float - Called when computing the cost between two connected points. Note that this function is hidden in the default AStarGrid2D class.
- EstimateCost(Vector2i fromId, Vector2i endId) -> float - Called when estimating the cost between a point and the path's ending point. Note that this function is hidden in the default AStarGrid2D class.
- Clear() - Clears the grid and sets the `region` to `Rect2i(0, 0, 0, 0)`.
- FillSolidRegion(Rect2i region, bool solid = true) - Fills the given `region` on the grid with the specified value for the solid flag. **Note:** Calling `update` is not needed after the call of this function.
- FillWeightScaleRegion(Rect2i region, float weightScale) - Fills the given `region` on the grid with the specified value for the weight scale. **Note:** Calling `update` is not needed after the call of this function.
- GetIdPath(Vector2i fromId, Vector2i toId, bool allowPartialPath = false) -> Vector2i[] - Returns an array with the IDs of the points that form the path found by AStar2D between the given points. The array is ordered from the starting point to the ending point of the path. If `from_id` point is disabled, returns an empty array (even if `from_id == to_id`). If `from_id` point is not disabled, there is no valid path to the target, and `allow_partial_path` is `true`, returns a path to the point closest to the target that can be reached. **Note:** When `allow_partial_path` is `true` and `to_id` is solid the search may take an unusually long time to finish.
- GetPointDataInRegion(Rect2i region) -> Dictionary[] - Returns an array of dictionaries with point data (`id`: Vector2i, `position`: Vector2, `solid`: [bool], `weight_scale`: [float]) within a `region`.
- GetPointPath(Vector2i fromId, Vector2i toId, bool allowPartialPath = false) -> Vector2[] - Returns an array with the points that are in the path found by AStarGrid2D between the given points. The array is ordered from the starting point to the ending point of the path. If `from_id` point is disabled, returns an empty array (even if `from_id == to_id`). If `from_id` point is not disabled, there is no valid path to the target, and `allow_partial_path` is `true`, returns a path to the point closest to the target that can be reached. **Note:** This method is not thread-safe; it can only be used from a single Thread at a given time. Consider using Mutex to ensure exclusive access to one thread to avoid race conditions. Additionally, when `allow_partial_path` is `true` and `to_id` is solid the search may take an unusually long time to finish.
- GetPointPosition(Vector2i id) -> Vector2 - Returns the position of the point associated with the given `id`.
- GetPointWeightScale(Vector2i id) -> float - Returns the weight scale of the point associated with the given `id`.
- IsDirty() -> bool - Indicates that the grid parameters were changed and `update` needs to be called.
- IsInBounds(int x, int y) -> bool - Returns `true` if the `x` and `y` is a valid grid coordinate (id), i.e. if it is inside `region`. Equivalent to `region.has_point(Vector2i(x, y))`.
- IsInBoundsv(Vector2i id) -> bool - Returns `true` if the `id` vector is a valid grid coordinate, i.e. if it is inside `region`. Equivalent to `region.has_point(id)`.
- IsPointSolid(Vector2i id) -> bool - Returns `true` if a point is disabled for pathfinding. By default, all points are enabled.
- SetPointSolid(Vector2i id, bool solid = true) - Disables or enables the specified point for pathfinding. Useful for making an obstacle. By default, all points are enabled. **Note:** Calling `update` is not needed after the call of this function.
- SetPointWeightScale(Vector2i id, float weightScale) - Sets the `weight_scale` for the point with the given `id`. The `weight_scale` is multiplied by the result of `_compute_cost` when determining the overall cost of traveling across a segment from a neighboring point to this point. **Note:** Calling `update` is not needed after the call of this function.
- Update() - Updates the internal state of the grid according to the parameters to prepare it to search the path. Needs to be called if parameters like `region`, `cell_size` or `offset` are changed. `is_dirty` will return `true` if this is the case and this needs to be called. **Note:** All point data (solidity and weight scale) will be cleared.

**Enums:**
**Heuristic:** HEURISTIC_EUCLIDEAN=0, HEURISTIC_MANHATTAN=1, HEURISTIC_OCTILE=2, HEURISTIC_CHEBYSHEV=3, HEURISTIC_MAX=4
  - HEURISTIC_EUCLIDEAN: The to be used for the pathfinding using the following formula: **Note:** This is also the internal heuristic used in AStar3D and AStar2D by default (with the inclusion of possible z-axis coordinate).
  - HEURISTIC_MANHATTAN: The to be used for the pathfinding using the following formula: **Note:** This heuristic is intended to be used with 4-side orthogonal movements, provided by setting the `diagonal_mode` to `DIAGONAL_MODE_NEVER`.
  - HEURISTIC_OCTILE: The Octile heuristic to be used for the pathfinding using the following formula:
  - HEURISTIC_CHEBYSHEV: The to be used for the pathfinding using the following formula:
  - HEURISTIC_MAX: Represents the size of the `Heuristic` enum.
**DiagonalMode:** DIAGONAL_MODE_ALWAYS=0, DIAGONAL_MODE_NEVER=1, DIAGONAL_MODE_AT_LEAST_ONE_WALKABLE=2, DIAGONAL_MODE_ONLY_IF_NO_OBSTACLES=3, DIAGONAL_MODE_MAX=4
  - DIAGONAL_MODE_ALWAYS: The pathfinding algorithm will ignore solid neighbors around the target cell and allow passing using diagonals.
  - DIAGONAL_MODE_NEVER: The pathfinding algorithm will ignore all diagonals and the way will be always orthogonal.
  - DIAGONAL_MODE_AT_LEAST_ONE_WALKABLE: The pathfinding algorithm will avoid using diagonals if at least two obstacles have been placed around the neighboring cells of the specific path segment.
  - DIAGONAL_MODE_ONLY_IF_NO_OBSTACLES: The pathfinding algorithm will avoid using diagonals if any obstacle has been placed around the neighboring cells of the specific path segment.
  - DIAGONAL_MODE_MAX: Represents the size of the `DiagonalMode` enum.
**CellShape:** CELL_SHAPE_SQUARE=0, CELL_SHAPE_ISOMETRIC_RIGHT=1, CELL_SHAPE_ISOMETRIC_DOWN=2, CELL_SHAPE_MAX=3
  - CELL_SHAPE_SQUARE: Rectangular cell shape.
  - CELL_SHAPE_ISOMETRIC_RIGHT: Diamond cell shape (for isometric look). Cell coordinates layout where the horizontal axis goes up-right, and the vertical one goes down-right.
  - CELL_SHAPE_ISOMETRIC_DOWN: Diamond cell shape (for isometric look). Cell coordinates layout where the horizontal axis goes down-right, and the vertical one goes down-left.
  - CELL_SHAPE_MAX: Represents the size of the `CellShape` enum.

