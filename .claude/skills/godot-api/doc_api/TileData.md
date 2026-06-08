## TileData <- Object

TileData object represents a single tile in a TileSet. It is usually edited using the tileset editor, but it can be modified at runtime using `TileMapLayer._tile_data_runtime_update`.

**Props:**
- FlipH: bool = false
- FlipV: bool = false
- Material: Material
- Modulate: Color = Color(1, 1, 1, 1)
- Probability: float = 1.0
- Terrain: int = -1
- TerrainSet: int = -1
- TextureOrigin: Vector2i = Vector2i(0, 0)
- Transpose: bool = false
- YSortOrigin: int = 0
- ZIndex: int = 0

- **flip_h**: If `true`, the tile will have its texture flipped horizontally.
- **flip_v**: If `true`, the tile will have its texture flipped vertically.
- **material**: The Material to use for this TileData. This can be a CanvasItemMaterial to use the default shader, or a ShaderMaterial to use a custom shader.
- **modulate**: Color modulation of the tile.
- **probability**: Relative probability of this tile being selected when drawing a pattern of random tiles.
- **terrain**: ID of the terrain from the terrain set that the tile uses.
- **terrain_set**: ID of the terrain set that the tile uses.
- **texture_origin**: Offsets the position of where the tile is drawn.
- **transpose**: If `true`, the tile will display transposed, i.e. with horizontal and vertical texture UVs swapped.
- **y_sort_origin**: Vertical point of the tile used for determining y-sorted order.
- **z_index**: Ordering index of this tile, relative to TileMapLayer.

**Methods:**
- AddCollisionPolygon(int layerId) - Adds a collision polygon to the tile on the given TileSet physics layer.
- AddOccluderPolygon(int layerId) - Adds an occlusion polygon to the tile on the TileSet occlusion layer with index `layer_id`.
- GetCollisionPolygonOneWayMargin(int layerId, int polygonIndex) -> float - Returns the one-way margin (for one-way platforms) of the polygon at index `polygon_index` for TileSet physics layer with index `layer_id`.
- GetCollisionPolygonPoints(int layerId, int polygonIndex) -> Vector2[] - Returns the points of the polygon at index `polygon_index` for TileSet physics layer with index `layer_id`.
- GetCollisionPolygonsCount(int layerId) -> int - Returns how many polygons the tile has for TileSet physics layer with index `layer_id`.
- GetConstantAngularVelocity(int layerId) -> float - Returns the constant angular velocity applied to objects colliding with this tile.
- GetConstantLinearVelocity(int layerId) -> Vector2 - Returns the constant linear velocity applied to objects colliding with this tile.
- GetCustomData(string layerName) -> Variant - Returns the custom data value for custom data layer named `layer_name`. To check if a custom data layer exists, use `has_custom_data`.
- GetCustomDataByLayerId(int layerId) -> Variant - Returns the custom data value for custom data layer with index `layer_id`.
- GetNavigationPolygon(int layerId, bool flipH = false, bool flipV = false, bool transpose = false) -> NavigationPolygon - Returns the navigation polygon of the tile for the TileSet navigation layer with index `layer_id`. `flip_h`, `flip_v`, and `transpose` allow transforming the returned polygon.
- GetOccluder(int layerId, bool flipH = false, bool flipV = false, bool transpose = false) -> OccluderPolygon2D - Returns the occluder polygon of the tile for the TileSet occlusion layer with index `layer_id`. `flip_h`, `flip_v`, and `transpose` allow transforming the returned polygon.
- GetOccluderPolygon(int layerId, int polygonIndex, bool flipH = false, bool flipV = false, bool transpose = false) -> OccluderPolygon2D - Returns the occluder polygon at index `polygon_index` from the TileSet occlusion layer with index `layer_id`. The `flip_h`, `flip_v`, and `transpose` parameters can be `true` to transform the returned polygon.
- GetOccluderPolygonsCount(int layerId) -> int - Returns the number of occluder polygons of the tile in the TileSet occlusion layer with index `layer_id`.
- GetTerrainPeeringBit(int peeringBit) -> int - Returns the tile's terrain bit for the given `peering_bit` direction. To check that a direction is valid, use `is_valid_terrain_peering_bit`.
- HasCustomData(string layerName) -> bool - Returns whether there exists a custom data layer named `layer_name`.
- IsCollisionPolygonOneWay(int layerId, int polygonIndex) -> bool - Returns whether one-way collisions are enabled for the polygon at index `polygon_index` for TileSet physics layer with index `layer_id`.
- IsValidTerrainPeeringBit(int peeringBit) -> bool - Returns whether the given `peering_bit` direction is valid for this tile.
- RemoveCollisionPolygon(int layerId, int polygonIndex) - Removes the polygon at index `polygon_index` for TileSet physics layer with index `layer_id`.
- RemoveOccluderPolygon(int layerId, int polygonIndex) - Removes the polygon at index `polygon_index` for TileSet occlusion layer with index `layer_id`.
- SetCollisionPolygonOneWay(int layerId, int polygonIndex, bool oneWay) - Enables/disables one-way collisions on the polygon at index `polygon_index` for TileSet physics layer with index `layer_id`.
- SetCollisionPolygonOneWayMargin(int layerId, int polygonIndex, float oneWayMargin) - Sets the one-way margin (for one-way platforms) of the polygon at index `polygon_index` for TileSet physics layer with index `layer_id`.
- SetCollisionPolygonPoints(int layerId, int polygonIndex, Vector2[] polygon) - Sets the points of the polygon at index `polygon_index` for TileSet physics layer with index `layer_id`.
- SetCollisionPolygonsCount(int layerId, int polygonsCount) - Sets the polygons count for TileSet physics layer with index `layer_id`.
- SetConstantAngularVelocity(int layerId, float velocity) - Sets the constant angular velocity. This does not rotate the tile. This angular velocity is applied to objects colliding with this tile.
- SetConstantLinearVelocity(int layerId, Vector2 velocity) - Sets the constant linear velocity. This does not move the tile. This linear velocity is applied to objects colliding with this tile. This is useful to create conveyor belts.
- SetCustomData(string layerName, Variant value) - Sets the tile's custom data value for the TileSet custom data layer with name `layer_name`.
- SetCustomDataByLayerId(int layerId, Variant value) - Sets the tile's custom data value for the TileSet custom data layer with index `layer_id`.
- SetNavigationPolygon(int layerId, NavigationPolygon navigationPolygon) - Sets the navigation polygon for the TileSet navigation layer with index `layer_id`.
- SetOccluder(int layerId, OccluderPolygon2D occluderPolygon) - Sets the occluder for the TileSet occlusion layer with index `layer_id`.
- SetOccluderPolygon(int layerId, int polygonIndex, OccluderPolygon2D polygon) - Sets the occluder for polygon with index `polygon_index` in the TileSet occlusion layer with index `layer_id`.
- SetOccluderPolygonsCount(int layerId, int polygonsCount) - Sets the occluder polygon count in the TileSet occlusion layer with index `layer_id`.
- SetTerrainPeeringBit(int peeringBit, int terrain) - Sets the tile's terrain bit for the given `peering_bit` direction. To check that a direction is valid, use `is_valid_terrain_peering_bit`.

**Signals:**
- Changed - Emitted when any of the properties are changed.

