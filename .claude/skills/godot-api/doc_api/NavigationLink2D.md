## NavigationLink2D <- Node2D

A link between two positions on NavigationRegion2Ds that agents can be routed through. These positions can be on the same NavigationRegion2D or on two different ones. Links are useful to express navigation methods other than traveling along the surface of the navigation polygon, such as ziplines, teleporters, or gaps that can be jumped across.

**Props:**
- Bidirectional: bool = true
- Enabled: bool = true
- EndPosition: Vector2 = Vector2(0, 0)
- EnterCost: float = 0.0
- NavigationLayers: int = 1
- StartPosition: Vector2 = Vector2(0, 0)
- TravelCost: float = 1.0

- **bidirectional**: Whether this link can be traveled in both directions or only from `start_position` to `end_position`.
- **enabled**: Whether this link is currently active. If `false`, `NavigationServer2D.map_get_path` will ignore this link.
- **end_position**: Ending position of the link. This position will search out the nearest polygon in the navigation mesh to attach to. The distance the link will search is controlled by `NavigationServer2D.map_set_link_connection_radius`.
- **enter_cost**: When pathfinding enters this link from another regions navigation mesh the `enter_cost` value is added to the path distance for determining the shortest path.
- **navigation_layers**: A bitfield determining all navigation layers the link belongs to. These navigation layers will be checked when requesting a path with `NavigationServer2D.map_get_path`.
- **start_position**: Starting position of the link. This position will search out the nearest polygon in the navigation mesh to attach to. The distance the link will search is controlled by `NavigationServer2D.map_set_link_connection_radius`.
- **travel_cost**: When pathfinding moves along the link the traveled distance is multiplied with `travel_cost` for determining the shortest path.

**Methods:**
- GetGlobalEndPosition() -> Vector2 - Returns the `end_position` that is relative to the link as a global position.
- GetGlobalStartPosition() -> Vector2 - Returns the `start_position` that is relative to the link as a global position.
- GetNavigationLayerValue(int layerNumber) -> bool - Returns whether or not the specified layer of the `navigation_layers` bitmask is enabled, given a `layer_number` between 1 and 32.
- GetNavigationMap() -> Rid - Returns the current navigation map RID used by this link.
- GetRid() -> Rid - Returns the RID of this link on the NavigationServer2D.
- SetGlobalEndPosition(Vector2 position) - Sets the `end_position` that is relative to the link from a global `position`.
- SetGlobalStartPosition(Vector2 position) - Sets the `start_position` that is relative to the link from a global `position`.
- SetNavigationLayerValue(int layerNumber, bool value) - Based on `value`, enables or disables the specified layer in the `navigation_layers` bitmask, given a `layer_number` between 1 and 32.
- SetNavigationMap(Rid navigationMap) - Sets the RID of the navigation map this link should use. By default the link will automatically join the World2D default navigation map so this function is only required to override the default map.

