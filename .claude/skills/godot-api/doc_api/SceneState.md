## SceneState <- RefCounted

Maintains a list of resources, nodes, exported and overridden properties, and built-in scripts associated with a scene. They cannot be modified from a SceneState, only accessed. Useful for peeking into what a PackedScene contains without instantiating it. This class cannot be instantiated directly, it is retrieved for a given scene as the result of `PackedScene.get_state`.

**Methods:**
- GetBaseSceneState() -> SceneState - Returns the SceneState of the scene that this scene inherits from, or `null` if it doesn't inherit from any scene.
- GetConnectionBinds(int idx) -> Godot.Collections.Array - Returns the list of bound parameters for the signal at `idx`.
- GetConnectionCount() -> int - Returns the number of signal connections in the scene. The `idx` argument used to query connection metadata in other `get_connection_*` methods in the interval `[0, get_connection_count() - 1]`.
- GetConnectionFlags(int idx) -> int - Returns the connection flags for the signal at `idx`. See `Object.ConnectFlags` constants.
- GetConnectionMethod(int idx) -> StringName - Returns the method connected to the signal at `idx`.
- GetConnectionSignal(int idx) -> StringName - Returns the name of the signal at `idx`.
- GetConnectionSource(int idx) -> NodePath - Returns the path to the node that owns the signal at `idx`, relative to the root node.
- GetConnectionTarget(int idx) -> NodePath - Returns the path to the node that owns the method connected to the signal at `idx`, relative to the root node.
- GetConnectionUnbinds(int idx) -> int - Returns the number of unbound parameters for the signal at `idx`.
- GetNodeCount() -> int - Returns the number of nodes in the scene. The `idx` argument used to query node data in other `get_node_*` methods in the interval `[0, get_node_count() - 1]`.
- GetNodeGroups(int idx) -> string[] - Returns the list of group names associated with the node at `idx`.
- GetNodeIndex(int idx) -> int - Returns the node's index, which is its position relative to its siblings. This is only relevant and saved in scenes for cases where new nodes are added to an instantiated or inherited scene among siblings from the base scene. Despite the name, this index is not related to the `idx` argument used here and in other methods.
- GetNodeInstance(int idx) -> PackedScene - Returns a PackedScene for the node at `idx` (i.e. the whole branch starting at this node, with its child nodes and resources), or `null` if the node is not an instance.
- GetNodeInstancePlaceholder(int idx) -> string - Returns the path to the represented scene file if the node at `idx` is an InstancePlaceholder.
- GetNodeName(int idx) -> StringName - Returns the name of the node at `idx`.
- GetNodeOwnerPath(int idx) -> NodePath - Returns the path to the owner of the node at `idx`, relative to the root node.
- GetNodePath(int idx, bool forParent = false) -> NodePath - Returns the path to the node at `idx`. If `for_parent` is `true`, returns the path of the `idx` node's parent instead.
- GetNodePropertyCount(int idx) -> int - Returns the number of exported or overridden properties for the node at `idx`. The `prop_idx` argument used to query node property data in other `get_node_property_*` methods in the interval `[0, get_node_property_count() - 1]`.
- GetNodePropertyName(int idx, int propIdx) -> StringName - Returns the name of the property at `prop_idx` for the node at `idx`.
- GetNodePropertyValue(int idx, int propIdx) -> Variant - Returns the value of the property at `prop_idx` for the node at `idx`.
- GetNodeType(int idx) -> StringName - Returns the type of the node at `idx`.
- GetPath() -> string - Returns the resource path to the represented PackedScene.
- IsNodeInstancePlaceholder(int idx) -> bool - Returns `true` if the node at `idx` is an InstancePlaceholder.

**Enums:**
**GenEditState:** GEN_EDIT_STATE_DISABLED=0, GEN_EDIT_STATE_INSTANCE=1, GEN_EDIT_STATE_MAIN=2, GEN_EDIT_STATE_MAIN_INHERITED=3
  - GEN_EDIT_STATE_DISABLED: If passed to `PackedScene.instantiate`, blocks edits to the scene state.
  - GEN_EDIT_STATE_INSTANCE: If passed to `PackedScene.instantiate`, provides inherited scene resources to the local scene. **Note:** Only available in editor builds.
  - GEN_EDIT_STATE_MAIN: If passed to `PackedScene.instantiate`, provides local scene resources to the local scene. Only the main scene should receive the main edit state. **Note:** Only available in editor builds.
  - GEN_EDIT_STATE_MAIN_INHERITED: If passed to `PackedScene.instantiate`, it's similar to `GEN_EDIT_STATE_MAIN`, but for the case where the scene is being instantiated to be the base of another one. **Note:** Only available in editor builds.

