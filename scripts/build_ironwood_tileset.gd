@tool
extends SceneTree

const ATLAS_PATH := "res://art/environment/tilesets/ironwood_cabin_runtime_32.png"
const TILESET_PATH := "res://art/environment/tilesets/ironwood_cabin_runtime_32.tres"
const TILE_SIZE := Vector2i(32, 32)
const TILE_COUNT := 44
const COLUMNS := 8
const BLOCKED_IDS := {
	6: true,   # wall
	8: true,   # tree
	9: true,   # brush
	10: true,  # stone
	11: true,  # hearth
	12: true,  # bed
	13: true,  # table
	14: true,  # icon
	16: true,  # fence
	17: true,  # logs
	19: true,  # cabinet
	29: true,  # roof
	30: true,  # roof snow
	32: true,  # hearth left
	33: true,  # hearth right
	34: true,  # bed head
	35: true,  # bed foot
	36: true,  # table long
	37: true,  # chair
	38: true,  # herb shelf
	39: true,  # crate
	40: true,  # barrel
	41: true,  # candle stand
	42: true,  # pine small
	43: true,  # stump
}

func _initialize() -> void:
	var texture := load(ATLAS_PATH) as Texture2D
	if texture == null:
		push_error("Missing atlas: %s" % ATLAS_PATH)
		quit(1)
		return

	var tile_set := TileSet.new()
	tile_set.tile_size = TILE_SIZE
	tile_set.add_custom_data_layer()
	tile_set.set_custom_data_layer_name(0, "blocked")
	tile_set.set_custom_data_layer_type(0, TYPE_BOOL)

	var source := TileSetAtlasSource.new()
	source.texture = texture
	source.texture_region_size = TILE_SIZE
	source.use_texture_padding = false

	for tile_id in TILE_COUNT:
		var coords := Vector2i(tile_id % COLUMNS, tile_id / COLUMNS)
		source.create_tile(coords)

	var source_id := tile_set.add_source(source, 0)
	if source_id != 0:
		push_error("Expected atlas source id 0, got %s" % source_id)
		quit(1)
		return

	for tile_id in TILE_COUNT:
		var coords := Vector2i(tile_id % COLUMNS, tile_id / COLUMNS)
		var tile_data := source.get_tile_data(coords, 0)
		tile_data.set_custom_data("blocked", BLOCKED_IDS.has(tile_id))

	var error := ResourceSaver.save(tile_set, TILESET_PATH)
	if error != OK:
		push_error("Failed to save %s: %s" % [TILESET_PATH, error])
		quit(1)
		return

	print("wrote %s (%d tiles, %d blocked)" % [TILESET_PATH, TILE_COUNT, BLOCKED_IDS.size()])
	quit()
