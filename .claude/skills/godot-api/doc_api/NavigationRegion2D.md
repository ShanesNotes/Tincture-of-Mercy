## NavigationRegion2D <- Node2D

A traversable 2D region based on a NavigationPolygon that NavigationAgent2Ds can use for pathfinding. Two regions can be connected to each other if they share a similar edge. You can set the minimum distance between two vertices required to connect two edges by using `NavigationServer2D.map_set_edge_connection_margin`. **Note:** Overlapping two regions' navigation polygons is not enough for connecting two regions. They must share a similar edge. The pathfinding cost of entering a region from another region can be controlled with the `enter_cost` value. **Note:** This value is not added to the path cost when the start position is already inside this region. The pathfinding cost of traveling distances inside this region can be controlled with the `travel_cost` multiplier. **Note:** This node caches changes to its properties, so if you make changes to the underlying region RID in NavigationServer2D, they will not be reflected in this node's properties.

**Props:**
- Enabled: bool = true
- EnterCost: float = 0.0
- NavigationLayers: int = 1
- NavigationPolygon: NavigationPolygon
- TravelCost: float = 1.0
- UseEdgeConnections: bool = true

- **enabled**: Determines if the NavigationRegion2D is enabled or disabled.
- **enter_cost**: When pathfinding enters this region's navigation mesh from another regions navigation mesh the `enter_cost` value is added to the path distance for determining the shortest path.
- **navigation_layers**: A bitfield determining all navigation layers the region belongs to. These navigation layers can be checked upon when requesting a path with `NavigationServer2D.map_get_path`.
- **navigation_polygon**: The NavigationPolygon resource to use.
- **travel_cost**: When pathfinding moves inside this region's navigation mesh the traveled distances are multiplied with `travel_cost` for determining the shortest path.
- **use_edge_connections**: If enabled the navigation region will use edge connections to connect with other navigation regions within proximity of the navigation map edge connection margin.

**Methods:**
- BakeNavigationPolygon(bool onThread = true) - Bakes the NavigationPolygon. If `on_thread` is set to `true` (default), the baking is done on a separate thread.
- GetBounds() -> Rect2 - Returns the axis-aligned rectangle for the region's transformed navigation mesh.
- GetNavigationLayerValue(int layerNumber) -> bool - Returns whether or not the specified layer of the `navigation_layers` bitmask is enabled, given a `layer_number` between 1 and 32.
- GetNavigationMap() -> Rid - Returns the current navigation map RID used by this region.
- GetRegionRid() -> Rid - Returns the RID of this region on the NavigationServer2D.
- GetRid() -> Rid - Returns the RID of this region on the NavigationServer2D. Combined with `NavigationServer2D.map_get_closest_point_owner` can be used to identify the NavigationRegion2D closest to a point on the merged navigation map.
- IsBaking() -> bool - Returns `true` when the NavigationPolygon is being baked on a background thread.
- SetNavigationLayerValue(int layerNumber, bool value) - Based on `value`, enables or disables the specified layer in the `navigation_layers` bitmask, given a `layer_number` between 1 and 32.
- SetNavigationMap(Rid navigationMap) - Sets the RID of the navigation map this region should use. By default the region will automatically join the World2D default navigation map so this function is only required to override the default map.

**Signals:**
- BakeFinished - Emitted when a navigation polygon bake operation is completed.
- NavigationPolygonChanged - Emitted when the used navigation polygon is replaced or changes to the internals of the current navigation polygon are committed.

