## TileSet <- Resource

A TileSet is a library of tiles for a TileMapLayer. A TileSet handles a list of TileSetSource, each of them storing a set of tiles. Tiles can either be from a TileSetAtlasSource, which renders tiles out of a texture with support for physics, navigation, etc., or from a TileSetScenesCollectionSource, which exposes scene-based tiles. Tiles are referenced by using three IDs: their source ID, their atlas coordinates ID, and their alternative tile ID. A TileSet can be configured so that its tiles expose more or fewer properties. To do so, the TileSet resources use property layers, which you can add or remove depending on your needs. For example, adding a physics layer allows giving collision shapes to your tiles. Each layer has dedicated properties (physics layer and mask), so you may add several TileSet physics layers for each type of collision you need. See the functions to add new layers for more information.

**Props:**
- TileLayout: int (TileSet.TileLayout) = 0
- TileOffsetAxis: int (TileSet.TileOffsetAxis) = 0
- TileShape: int (TileSet.TileShape) = 0
- TileSize: Vector2i = Vector2i(16, 16)
- UvClipping: bool = false

- **tile_layout**: For all half-offset shapes (Isometric, Hexagonal and Half-Offset square), changes the way tiles are indexed in the TileMapLayer grid.
- **tile_offset_axis**: For all half-offset shapes (Isometric, Hexagonal and Half-Offset square), determines the offset axis.
- **tile_shape**: The tile shape.
- **tile_size**: The tile size, in pixels. For all tile shapes, this size corresponds to the encompassing rectangle of the tile shape. This is thus the minimal cell size required in an atlas.
- **uv_clipping**: Enables/Disable uv clipping when rendering the tiles.

**Methods:**
- AddCustomDataLayer(int toPosition = -1) - Adds a custom data layer to the TileSet at the given position `to_position` in the array. If `to_position` is -1, adds it at the end of the array. Custom data layers allow assigning custom properties to atlas tiles.
- AddNavigationLayer(int toPosition = -1) - Adds a navigation layer to the TileSet at the given position `to_position` in the array. If `to_position` is -1, adds it at the end of the array. Navigation layers allow assigning a navigable area to atlas tiles.
- AddOcclusionLayer(int toPosition = -1) - Adds an occlusion layer to the TileSet at the given position `to_position` in the array. If `to_position` is -1, adds it at the end of the array. Occlusion layers allow assigning occlusion polygons to atlas tiles.
- AddPattern(TileMapPattern pattern, int index = -1) -> int - Adds a TileMapPattern to be stored in the TileSet resource. If provided, insert it at the given `index`.
- AddPhysicsLayer(int toPosition = -1) - Adds a physics layer to the TileSet at the given position `to_position` in the array. If `to_position` is -1, adds it at the end of the array. Physics layers allow assigning collision polygons to atlas tiles.
- AddSource(TileSetSource source, int atlasSourceIdOverride = -1) -> int - Adds a TileSetSource to the TileSet. If `atlas_source_id_override` is not -1, also set its source ID. Otherwise, a unique identifier is automatically generated. The function returns the added source ID or -1 if the source could not be added. **Warning:** A source cannot belong to two TileSets at the same time. If the added source was attached to another TileSet, it will be removed from that one.
- AddTerrain(int terrainSet, int toPosition = -1) - Adds a new terrain to the given terrain set `terrain_set` at the given position `to_position` in the array. If `to_position` is -1, adds it at the end of the array.
- AddTerrainSet(int toPosition = -1) - Adds a new terrain set at the given position `to_position` in the array. If `to_position` is -1, adds it at the end of the array.
- CleanupInvalidTileProxies() - Clears tile proxies pointing to invalid tiles.
- ClearTerrains(int terrainSet) - Clears all terrain properties for the given terrain set.
- ClearTileProxies() - Clears all tile proxies.
- GetAlternativeLevelTileProxy(int sourceFrom, Vector2i coordsFrom, int alternativeFrom) -> Godot.Collections.Array - Returns the alternative-level proxy for the given identifiers. The returned array contains the three proxie's target identifiers (source ID, atlas coords ID and alternative tile ID). If the TileSet has no proxy for the given identifiers, returns an empty Array.
- GetCoordsLevelTileProxy(int sourceFrom, Vector2i coordsFrom) -> Godot.Collections.Array - Returns the coordinate-level proxy for the given identifiers. The returned array contains the two target identifiers of the proxy (source ID and atlas coordinates ID). If the TileSet has no proxy for the given identifiers, returns an empty Array.
- GetCustomDataLayerByName(string layerName) -> int - Returns the index of the custom data layer identified by the given name.
- GetCustomDataLayerName(int layerIndex) -> string - Returns the name of the custom data layer identified by the given index.
- GetCustomDataLayerType(int layerIndex) -> int - Returns the type of the custom data layer identified by the given index.
- GetCustomDataLayersCount() -> int - Returns the custom data layers count.
- GetNavigationLayerLayerValue(int layerIndex, int layerNumber) -> bool - Returns whether or not the specified navigation layer of the TileSet navigation data layer identified by the given `layer_index` is enabled, given a navigation_layers `layer_number` between 1 and 32.
- GetNavigationLayerLayers(int layerIndex) -> int - Returns the navigation layers (as in the Navigation server) of the given TileSet navigation layer.
- GetNavigationLayersCount() -> int - Returns the navigation layers count.
- GetNextSourceId() -> int - Returns a new unused source ID. This generated ID is the same that a call to `add_source` would return.
- GetOcclusionLayerLightMask(int layerIndex) -> int - Returns the light mask of the occlusion layer.
- GetOcclusionLayerSdfCollision(int layerIndex) -> bool - Returns if the occluders from this layer use `sdf_collision`.
- GetOcclusionLayersCount() -> int - Returns the occlusion layers count.
- GetPattern(int index = -1) -> TileMapPattern - Returns the TileMapPattern at the given `index`.
- GetPatternsCount() -> int - Returns the number of TileMapPattern this tile set handles.
- GetPhysicsLayerCollisionLayer(int layerIndex) -> int - Returns the collision layer (as in the physics server) bodies on the given TileSet's physics layer are in.
- GetPhysicsLayerCollisionMask(int layerIndex) -> int - Returns the collision mask of bodies on the given TileSet's physics layer.
- GetPhysicsLayerCollisionPriority(int layerIndex) -> float - Returns the collision priority of bodies on the given TileSet's physics layer.
- GetPhysicsLayerPhysicsMaterial(int layerIndex) -> PhysicsMaterial - Returns the physics material of bodies on the given TileSet's physics layer.
- GetPhysicsLayersCount() -> int - Returns the physics layers count.
- GetSource(int sourceId) -> TileSetSource - Returns the TileSetSource with ID `source_id`.
- GetSourceCount() -> int - Returns the number of TileSetSource in this TileSet.
- GetSourceId(int index) -> int - Returns the source ID for source with index `index`.
- GetSourceLevelTileProxy(int sourceFrom) -> int - Returns the source-level proxy for the given source identifier. If the TileSet has no proxy for the given identifier, returns -1.
- GetTerrainColor(int terrainSet, int terrainIndex) -> Color - Returns a terrain's color.
- GetTerrainName(int terrainSet, int terrainIndex) -> string - Returns a terrain's name.
- GetTerrainSetMode(int terrainSet) -> int - Returns a terrain set mode.
- GetTerrainSetsCount() -> int - Returns the terrain sets count.
- GetTerrainsCount(int terrainSet) -> int - Returns the number of terrains in the given terrain set.
- HasAlternativeLevelTileProxy(int sourceFrom, Vector2i coordsFrom, int alternativeFrom) -> bool - Returns if there is an alternative-level proxy for the given identifiers.
- HasCoordsLevelTileProxy(int sourceFrom, Vector2i coordsFrom) -> bool - Returns if there is a coodinates-level proxy for the given identifiers.
- HasCustomDataLayerByName(string layerName) -> bool - Returns if there is a custom data layer named `layer_name`.
- HasSource(int sourceId) -> bool - Returns if this TileSet has a source for the given source ID.
- HasSourceLevelTileProxy(int sourceFrom) -> bool - Returns if there is a source-level proxy for the given source ID.
- MapTileProxy(int sourceFrom, Vector2i coordsFrom, int alternativeFrom) -> Godot.Collections.Array - According to the configured proxies, maps the provided identifiers to a new set of identifiers. The source ID, atlas coordinates ID and alternative tile ID are returned as a 3 elements Array. This function first look for matching alternative-level proxies, then coordinates-level proxies, then source-level proxies. If no proxy corresponding to provided identifiers are found, returns the same values the ones used as arguments.
- MoveCustomDataLayer(int layerIndex, int toPosition) - Moves the custom data layer at index `layer_index` to the given position `to_position` in the array. Also updates the atlas tiles accordingly.
- MoveNavigationLayer(int layerIndex, int toPosition) - Moves the navigation layer at index `layer_index` to the given position `to_position` in the array. Also updates the atlas tiles accordingly.
- MoveOcclusionLayer(int layerIndex, int toPosition) - Moves the occlusion layer at index `layer_index` to the given position `to_position` in the array. Also updates the atlas tiles accordingly.
- MovePhysicsLayer(int layerIndex, int toPosition) - Moves the physics layer at index `layer_index` to the given position `to_position` in the array. Also updates the atlas tiles accordingly.
- MoveTerrain(int terrainSet, int terrainIndex, int toPosition) - Moves the terrain at index `terrain_index` for terrain set `terrain_set` to the given position `to_position` in the array. Also updates the atlas tiles accordingly.
- MoveTerrainSet(int terrainSet, int toPosition) - Moves the terrain set at index `terrain_set` to the given position `to_position` in the array. Also updates the atlas tiles accordingly.
- RemoveAlternativeLevelTileProxy(int sourceFrom, Vector2i coordsFrom, int alternativeFrom) - Removes an alternative-level proxy for the given identifiers.
- RemoveCoordsLevelTileProxy(int sourceFrom, Vector2i coordsFrom) - Removes a coordinates-level proxy for the given identifiers.
- RemoveCustomDataLayer(int layerIndex) - Removes the custom data layer at index `layer_index`. Also updates the atlas tiles accordingly.
- RemoveNavigationLayer(int layerIndex) - Removes the navigation layer at index `layer_index`. Also updates the atlas tiles accordingly.
- RemoveOcclusionLayer(int layerIndex) - Removes the occlusion layer at index `layer_index`. Also updates the atlas tiles accordingly.
- RemovePattern(int index) - Remove the TileMapPattern at the given index.
- RemovePhysicsLayer(int layerIndex) - Removes the physics layer at index `layer_index`. Also updates the atlas tiles accordingly.
- RemoveSource(int sourceId) - Removes the source with the given source ID.
- RemoveSourceLevelTileProxy(int sourceFrom) - Removes a source-level tile proxy.
- RemoveTerrain(int terrainSet, int terrainIndex) - Removes the terrain at index `terrain_index` in the given terrain set `terrain_set`. Also updates the atlas tiles accordingly.
- RemoveTerrainSet(int terrainSet) - Removes the terrain set at index `terrain_set`. Also updates the atlas tiles accordingly.
- SetAlternativeLevelTileProxy(int sourceFrom, Vector2i coordsFrom, int alternativeFrom, int sourceTo, Vector2i coordsTo, int alternativeTo) - Create an alternative-level proxy for the given identifiers. A proxy will map set of tile identifiers to another set of identifiers. Proxied tiles can be automatically replaced in TileMapLayer nodes using the editor.
- SetCoordsLevelTileProxy(int sourceFrom, Vector2i coordsFrom, int sourceTo, Vector2i coordsTo) - Creates a coordinates-level proxy for the given identifiers. A proxy will map set of tile identifiers to another set of identifiers. The alternative tile ID is kept the same when using coordinates-level proxies. Proxied tiles can be automatically replaced in TileMapLayer nodes using the editor.
- SetCustomDataLayerName(int layerIndex, string layerName) - Sets the name of the custom data layer identified by the given index. Names are identifiers of the layer therefore if the name is already taken it will fail and raise an error.
- SetCustomDataLayerType(int layerIndex, int layerType) - Sets the type of the custom data layer identified by the given index.
- SetNavigationLayerLayerValue(int layerIndex, int layerNumber, bool value) - Based on `value`, enables or disables the specified navigation layer of the TileSet navigation data layer identified by the given `layer_index`, given a navigation_layers `layer_number` between 1 and 32.
- SetNavigationLayerLayers(int layerIndex, int layers) - Sets the navigation layers (as in the navigation server) for navigation regions in the given TileSet navigation layer.
- SetOcclusionLayerLightMask(int layerIndex, int lightMask) - Sets the occlusion layer (as in the rendering server) for occluders in the given TileSet occlusion layer.
- SetOcclusionLayerSdfCollision(int layerIndex, bool sdfCollision) - Enables or disables SDF collision for occluders in the given TileSet occlusion layer.
- SetPhysicsLayerCollisionLayer(int layerIndex, int layer) - Sets the collision layer (as in the physics server) for bodies in the given TileSet physics layer.
- SetPhysicsLayerCollisionMask(int layerIndex, int mask) - Sets the collision mask for bodies in the given TileSet physics layer.
- SetPhysicsLayerCollisionPriority(int layerIndex, float priority) - Sets the collision priority for bodies in the given TileSet physics layer.
- SetPhysicsLayerPhysicsMaterial(int layerIndex, PhysicsMaterial physicsMaterial) - Sets the physics material for bodies in the given TileSet physics layer.
- SetSourceId(int sourceId, int newSourceId) - Changes a source's ID.
- SetSourceLevelTileProxy(int sourceFrom, int sourceTo) - Creates a source-level proxy for the given source ID. A proxy will map set of tile identifiers to another set of identifiers. Both the atlas coordinates ID and the alternative tile ID are kept the same when using source-level proxies. Proxied tiles can be automatically replaced in TileMapLayer nodes using the editor.
- SetTerrainColor(int terrainSet, int terrainIndex, Color color) - Sets a terrain's color. This color is used for identifying the different terrains in the TileSet editor.
- SetTerrainName(int terrainSet, int terrainIndex, string name) - Sets a terrain's name.
- SetTerrainSetMode(int terrainSet, int mode) - Sets a terrain mode. Each mode determines which bits of a tile shape is used to match the neighboring tiles' terrains.

**Enums:**
**TileShape:** TILE_SHAPE_SQUARE=0, TILE_SHAPE_ISOMETRIC=1, TILE_SHAPE_HALF_OFFSET_SQUARE=2, TILE_SHAPE_HEXAGON=3
  - TILE_SHAPE_SQUARE: Rectangular tile shape.
  - TILE_SHAPE_ISOMETRIC: Diamond tile shape (for isometric look). **Note:** Isometric TileSet works best if all sibling TileMapLayers and their parent inheriting from Node2D have Y-sort enabled.
  - TILE_SHAPE_HALF_OFFSET_SQUARE: Rectangular tile shape with one row/column out of two offset by half a tile.
  - TILE_SHAPE_HEXAGON: Hexagonal tile shape.
**TileLayout:** TILE_LAYOUT_STACKED=0, TILE_LAYOUT_STACKED_OFFSET=1, TILE_LAYOUT_STAIRS_RIGHT=2, TILE_LAYOUT_STAIRS_DOWN=3, TILE_LAYOUT_DIAMOND_RIGHT=4, TILE_LAYOUT_DIAMOND_DOWN=5
  - TILE_LAYOUT_STACKED: Tile coordinates layout where both axis stay consistent with their respective local horizontal and vertical axis.
  - TILE_LAYOUT_STACKED_OFFSET: Same as `TILE_LAYOUT_STACKED`, but the first half-offset is negative instead of positive.
  - TILE_LAYOUT_STAIRS_RIGHT: Tile coordinates layout where the horizontal axis stay horizontal, and the vertical one goes down-right.
  - TILE_LAYOUT_STAIRS_DOWN: Tile coordinates layout where the vertical axis stay vertical, and the horizontal one goes down-right.
  - TILE_LAYOUT_DIAMOND_RIGHT: Tile coordinates layout where the horizontal axis goes up-right, and the vertical one goes down-right.
  - TILE_LAYOUT_DIAMOND_DOWN: Tile coordinates layout where the horizontal axis goes down-right, and the vertical one goes down-left.
**TileOffsetAxis:** TILE_OFFSET_AXIS_HORIZONTAL=0, TILE_OFFSET_AXIS_VERTICAL=1
  - TILE_OFFSET_AXIS_HORIZONTAL: Horizontal half-offset.
  - TILE_OFFSET_AXIS_VERTICAL: Vertical half-offset.
**CellNeighbor:** CELL_NEIGHBOR_RIGHT_SIDE=0, CELL_NEIGHBOR_RIGHT_CORNER=1, CELL_NEIGHBOR_BOTTOM_RIGHT_SIDE=2, CELL_NEIGHBOR_BOTTOM_RIGHT_CORNER=3, CELL_NEIGHBOR_BOTTOM_SIDE=4, CELL_NEIGHBOR_BOTTOM_CORNER=5, CELL_NEIGHBOR_BOTTOM_LEFT_SIDE=6, CELL_NEIGHBOR_BOTTOM_LEFT_CORNER=7, CELL_NEIGHBOR_LEFT_SIDE=8, CELL_NEIGHBOR_LEFT_CORNER=9, ...
  - CELL_NEIGHBOR_RIGHT_SIDE: Neighbor on the right side.
  - CELL_NEIGHBOR_RIGHT_CORNER: Neighbor in the right corner.
  - CELL_NEIGHBOR_BOTTOM_RIGHT_SIDE: Neighbor on the bottom right side.
  - CELL_NEIGHBOR_BOTTOM_RIGHT_CORNER: Neighbor in the bottom right corner.
  - CELL_NEIGHBOR_BOTTOM_SIDE: Neighbor on the bottom side.
  - CELL_NEIGHBOR_BOTTOM_CORNER: Neighbor in the bottom corner.
  - CELL_NEIGHBOR_BOTTOM_LEFT_SIDE: Neighbor on the bottom left side.
  - CELL_NEIGHBOR_BOTTOM_LEFT_CORNER: Neighbor in the bottom left corner.
  - CELL_NEIGHBOR_LEFT_SIDE: Neighbor on the left side.
  - CELL_NEIGHBOR_LEFT_CORNER: Neighbor in the left corner.
  - CELL_NEIGHBOR_TOP_LEFT_SIDE: Neighbor on the top left side.
  - CELL_NEIGHBOR_TOP_LEFT_CORNER: Neighbor in the top left corner.
  - CELL_NEIGHBOR_TOP_SIDE: Neighbor on the top side.
  - CELL_NEIGHBOR_TOP_CORNER: Neighbor in the top corner.
  - CELL_NEIGHBOR_TOP_RIGHT_SIDE: Neighbor on the top right side.
  - CELL_NEIGHBOR_TOP_RIGHT_CORNER: Neighbor in the top right corner.
**TerrainMode:** TERRAIN_MODE_MATCH_CORNERS_AND_SIDES=0, TERRAIN_MODE_MATCH_CORNERS=1, TERRAIN_MODE_MATCH_SIDES=2
  - TERRAIN_MODE_MATCH_CORNERS_AND_SIDES: Requires both corners and side to match with neighboring tiles' terrains.
  - TERRAIN_MODE_MATCH_CORNERS: Requires corners to match with neighboring tiles' terrains.
  - TERRAIN_MODE_MATCH_SIDES: Requires sides to match with neighboring tiles' terrains.

