@tool
extends SceneTree

const TILESET_PATH := "res://art/environment/tilesets/ironwood_cabin_runtime_32.tres"
const COLUMNS := 8
const TILE_COUNT := 44
const EXPECTED_BLOCKED := [6, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 29, 30, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43]

func _initialize() -> void:
	var tile_set := load(TILESET_PATH) as TileSet
	if tile_set == null:
		push_error("Missing TileSet: %s" % TILESET_PATH)
		quit(1)
		return
	if tile_set.tile_size != Vector2i(32, 32):
		push_error("Unexpected tile_size: %s" % tile_set.tile_size)
		quit(1)
		return
	if not tile_set.has_custom_data_layer_by_name("blocked"):
		push_error("Missing blocked custom data layer")
		quit(1)
		return
	var source := tile_set.get_source(0) as TileSetAtlasSource
	if source == null:
		push_error("Missing atlas source 0")
		quit(1)
		return
	var blocked_seen: Array[int] = []
	for tile_id in TILE_COUNT:
		var coords := Vector2i(tile_id % COLUMNS, tile_id / COLUMNS)
		var data := source.get_tile_data(coords, 0)
		if data == null:
			push_error("Missing tile %d at %s" % [tile_id, coords])
			quit(1)
			return
		if bool(data.get_custom_data("blocked")):
			blocked_seen.append(tile_id)
	blocked_seen.sort()
	if blocked_seen != EXPECTED_BLOCKED:
		push_error("Blocked mismatch: %s" % [blocked_seen])
		quit(1)
		return
	print("verified %s (%d tiles, %d blocked)" % [TILESET_PATH, TILE_COUNT, blocked_seen.size()])
	quit()
