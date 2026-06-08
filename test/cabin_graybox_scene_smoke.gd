extends SceneTree

func _initialize() -> void:
	var packed: PackedScene = load("res://scenes/cabin/cabin_graybox.tscn")
	if packed == null:
		_fail("Could not load cabin_graybox.tscn.")
		return

	var scene: Node = packed.instantiate()
	root.add_child(scene)
	_assert_node(scene, "CanvasLayer/Panel/VBox/VisualState")
	_assert_node(scene, "Hearth")
	_assert_node(scene, "Actors/Kalev")
	_assert_node(scene, "Actors/Anna")
	_assert_node(scene, "Actors/Iiro")
	_assert_node(scene, "Actors/Wolf01")
	_assert_node(scene, "Actors/Wolf02")
	_assert_node(scene, "Actors/Wolf03")
	quit(0)

func _assert_node(scene: Node, path: NodePath) -> void:
	if scene.get_node_or_null(path) == null:
		_fail("Missing node %s." % path)

func _fail(message: String) -> void:
	push_error(message)
	quit(1)
