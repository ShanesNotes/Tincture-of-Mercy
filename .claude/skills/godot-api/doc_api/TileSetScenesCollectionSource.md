## TileSetScenesCollectionSource <- TileSetSource

When placed on a TileMapLayer, tiles from TileSetScenesCollectionSource will automatically instantiate an associated scene at the cell's position in the TileMapLayer. Scenes are instantiated as children of the TileMapLayer after it enters the tree, at the end of the frame (their creation is deferred). If you add/remove a scene tile in the TileMapLayer that is already inside the tree, the TileMapLayer will automatically instantiate/free the scene accordingly. **Note:** Scene tiles all occupy one tile slot and instead use alternate tile ID to identify scene index. `TileSetSource.get_tiles_count` will always return `1`. Use `get_scene_tiles_count` to get a number of scenes in a TileSetScenesCollectionSource. Use this code if you want to find the scene path at a given tile in TileMapLayer:

**Methods:**
- CreateSceneTile(PackedScene packedScene, int idOverride = -1) -> int - Creates a scene-based tile out of the given scene. Returns a newly generated unique ID.
- GetNextSceneTileId() -> int - Returns the scene ID a following call to `create_scene_tile` would return.
- GetSceneTileDisplayPlaceholder(int id) -> bool - Returns whether the scene tile with `id` displays a placeholder in the editor.
- GetSceneTileId(int index) -> int - Returns the scene tile ID of the scene tile at `index`.
- GetSceneTileScene(int id) -> PackedScene - Returns the PackedScene resource of scene tile with `id`.
- GetSceneTilesCount() -> int - Returns the number or scene tiles this TileSet source has.
- HasSceneTileId(int id) -> bool - Returns whether this TileSet source has a scene tile with `id`.
- RemoveSceneTile(int id) - Remove the scene tile with `id`.
- SetSceneTileDisplayPlaceholder(int id, bool displayPlaceholder) - Sets whether or not the scene tile with `id` should display a placeholder in the editor. This might be useful for scenes that are not visible.
- SetSceneTileId(int id, int newId) - Changes a scene tile's ID from `id` to `new_id`. This will fail if there is already a tile with an ID equal to `new_id`.
- SetSceneTileScene(int id, PackedScene packedScene) - Assigns a PackedScene resource to the scene tile with `id`. This will fail if the scene does not extend CanvasItem, as positioning properties are needed to place the scene on the TileMapLayer.

