## NavigationPolygon <- Resource

A navigation mesh can be created either by baking it with the help of the NavigationServer2D, or by adding vertices and convex polygon indices arrays manually. To bake a navigation mesh at least one outline needs to be added that defines the outer bounds of the baked area. Adding vertices and polygon indices manually.

**Props:**
- AgentRadius: float = 10.0
- BakingRect: Rect2 = Rect2(0, 0, 0, 0)
- BakingRectOffset: Vector2 = Vector2(0, 0)
- BorderSize: float = 0.0
- CellSize: float = 1.0
- ParsedCollisionMask: int = 4294967295
- ParsedGeometryType: int (NavigationPolygon.ParsedGeometryType) = 2
- SamplePartitionType: int (NavigationPolygon.SamplePartitionType) = 0
- SourceGeometryGroupName: StringName = &"navigation_polygon_source_geometry_group"
- SourceGeometryMode: int (NavigationPolygon.SourceGeometryMode) = 0

- **agent_radius**: The distance to erode/shrink the walkable surface when baking the navigation mesh. **Note:** The radius must be equal or higher than `0.0`. If the radius is `0.0`, it won't be possible to fix invalid outline overlaps and other precision errors during the baking process. As a result, some obstacles may be excluded incorrectly from the final navigation mesh, or may delete the navigation mesh's polygons.
- **baking_rect**: If the baking Rect2 has an area the navigation mesh baking will be restricted to its enclosing area.
- **baking_rect_offset**: The position offset applied to the `baking_rect` Rect2.
- **border_size**: The size of the non-navigable border around the bake bounding area defined by the `baking_rect` Rect2. In conjunction with the `baking_rect` the border size can be used to bake tile aligned navigation meshes without the tile edges being shrunk by `agent_radius`.
- **cell_size**: The cell size used to rasterize the navigation mesh vertices. Must match with the cell size on the navigation map.
- **parsed_collision_mask**: The physics layers to scan for static colliders. Only used when `parsed_geometry_type` is `PARSED_GEOMETRY_STATIC_COLLIDERS` or `PARSED_GEOMETRY_BOTH`.
- **parsed_geometry_type**: Determines which type of nodes will be parsed as geometry.
- **sample_partition_type**: Partitioning algorithm for creating the navigation mesh polys.
- **source_geometry_group_name**: The group name of nodes that should be parsed for baking source geometry. Only used when `source_geometry_mode` is `SOURCE_GEOMETRY_GROUPS_WITH_CHILDREN` or `SOURCE_GEOMETRY_GROUPS_EXPLICIT`.
- **source_geometry_mode**: The source of the geometry used when baking.

**Methods:**
- AddOutline(Vector2[] outline) - Appends a PackedVector2Array that contains the vertices of an outline to the internal array that contains all the outlines.
- AddOutlineAtIndex(Vector2[] outline, int index) - Adds a PackedVector2Array that contains the vertices of an outline to the internal array that contains all the outlines at a fixed position.
- AddPolygon(int[] polygon) - Adds a polygon using the indices of the vertices you get when calling `get_vertices`.
- Clear() - Clears the internal arrays for vertices and polygon indices.
- ClearOutlines() - Clears the array of the outlines, but it doesn't clear the vertices and the polygons that were created by them.
- ClearPolygons() - Clears the array of polygons, but it doesn't clear the array of outlines and vertices.
- GetNavigationMesh() -> NavigationMesh - Returns the NavigationMesh resulting from this navigation polygon. This navigation mesh can be used to update the navigation mesh of a region with the `NavigationServer3D.region_set_navigation_mesh` API directly.
- GetOutline(int idx) -> Vector2[] - Returns a PackedVector2Array containing the vertices of an outline that was created in the editor or by script.
- GetOutlineCount() -> int - Returns the number of outlines that were created in the editor or by script.
- GetParsedCollisionMaskValue(int layerNumber) -> bool - Returns whether or not the specified layer of the `parsed_collision_mask` is enabled, given a `layer_number` between 1 and 32.
- GetPolygon(int idx) -> int[] - Returns a PackedInt32Array containing the indices of the vertices of a created polygon.
- GetPolygonCount() -> int - Returns the count of all polygons.
- GetVertices() -> Vector2[] - Returns a PackedVector2Array containing all the vertices being used to create the polygons.
- MakePolygonsFromOutlines() - Creates polygons from the outlines added in the editor or by script.
- RemoveOutline(int idx) - Removes an outline created in the editor or by script. You have to call `make_polygons_from_outlines` for the polygons to update.
- SetOutline(int idx, Vector2[] outline) - Changes an outline created in the editor or by script. You have to call `make_polygons_from_outlines` for the polygons to update.
- SetParsedCollisionMaskValue(int layerNumber, bool value) - Based on `value`, enables or disables the specified layer in the `parsed_collision_mask`, given a `layer_number` between 1 and 32.
- SetVertices(Vector2[] vertices) - Sets the vertices that can be then indexed to create polygons with the `add_polygon` method.

**Enums:**
**SamplePartitionType:** SAMPLE_PARTITION_CONVEX_PARTITION=0, SAMPLE_PARTITION_TRIANGULATE=1, SAMPLE_PARTITION_MAX=2
  - SAMPLE_PARTITION_CONVEX_PARTITION: Convex partitioning that results in a navigation mesh with convex polygons.
  - SAMPLE_PARTITION_TRIANGULATE: Triangulation partitioning that results in a navigation mesh with triangle polygons.
  - SAMPLE_PARTITION_MAX: Represents the size of the `SamplePartitionType` enum.
**ParsedGeometryType:** PARSED_GEOMETRY_MESH_INSTANCES=0, PARSED_GEOMETRY_STATIC_COLLIDERS=1, PARSED_GEOMETRY_BOTH=2, PARSED_GEOMETRY_MAX=3
  - PARSED_GEOMETRY_MESH_INSTANCES: Parses mesh instances as obstruction geometry. This includes Polygon2D, MeshInstance2D, MultiMeshInstance2D, and TileMap nodes. Meshes are only parsed when they use a 2D vertices surface format.
  - PARSED_GEOMETRY_STATIC_COLLIDERS: Parses StaticBody2D and TileMap colliders as obstruction geometry. The collider should be in any of the layers specified by `parsed_collision_mask`.
  - PARSED_GEOMETRY_BOTH: Both `PARSED_GEOMETRY_MESH_INSTANCES` and `PARSED_GEOMETRY_STATIC_COLLIDERS`.
  - PARSED_GEOMETRY_MAX: Represents the size of the `ParsedGeometryType` enum.
**SourceGeometryMode:** SOURCE_GEOMETRY_ROOT_NODE_CHILDREN=0, SOURCE_GEOMETRY_GROUPS_WITH_CHILDREN=1, SOURCE_GEOMETRY_GROUPS_EXPLICIT=2, SOURCE_GEOMETRY_MAX=3
  - SOURCE_GEOMETRY_ROOT_NODE_CHILDREN: Scans the child nodes of the root node recursively for geometry.
  - SOURCE_GEOMETRY_GROUPS_WITH_CHILDREN: Scans nodes in a group and their child nodes recursively for geometry. The group is specified by `source_geometry_group_name`.
  - SOURCE_GEOMETRY_GROUPS_EXPLICIT: Uses nodes in a group for geometry. The group is specified by `source_geometry_group_name`.
  - SOURCE_GEOMETRY_MAX: Represents the size of the `SourceGeometryMode` enum.

