## TileMapPattern <- Resource

This resource holds a set of cells to help bulk manipulations of TileMap. A pattern always starts at the `(0, 0)` coordinates and cannot have cells with negative coordinates.

**Methods:**
- GetCellAlternativeTile(Vector2i coords) -> int - Returns the tile alternative ID of the cell at `coords`.
- GetCellAtlasCoords(Vector2i coords) -> Vector2i - Returns the tile atlas coordinates ID of the cell at `coords`.
- GetCellSourceId(Vector2i coords) -> int - Returns the tile source ID of the cell at `coords`.
- GetSize() -> Vector2i - Returns the size, in cells, of the pattern.
- GetUsedCells() -> Vector2i[] - Returns the list of used cell coordinates in the pattern.
- HasCell(Vector2i coords) -> bool - Returns whether the pattern has a tile at the given coordinates.
- IsEmpty() -> bool - Returns whether the pattern is empty or not.
- RemoveCell(Vector2i coords, bool updateSize) - Remove the cell at the given coordinates.
- SetCell(Vector2i coords, int sourceId = -1, Vector2i atlasCoords = Vector2i(-1, -1), int alternativeTile = -1) - Sets the tile identifiers for the cell at coordinates `coords`. See `TileMap.set_cell`.
- SetSize(Vector2i size) - Sets the size of the pattern.

