## MultiplayerAPIExtension <- MultiplayerAPI

This class can be used to extend or replace the default MultiplayerAPI implementation via script or extensions. The following example extend the default implementation (SceneMultiplayer) by logging every RPC being made, and every object being configured for replication. Then in your main scene or in an autoload call `SceneTree.set_multiplayer` to start using your custom MultiplayerAPI: Native extensions can alternatively use the `MultiplayerAPI.set_default_interface` method during initialization to configure themselves as the default implementation.

**Methods:**
- GetMultiplayerPeer() -> MultiplayerPeer - Called when the `MultiplayerAPI.multiplayer_peer` is retrieved.
- GetPeerIds() -> int[] - Callback for `MultiplayerAPI.get_peers`.
- GetRemoteSenderId() -> int - Callback for `MultiplayerAPI.get_remote_sender_id`.
- GetUniqueId() -> int - Callback for `MultiplayerAPI.get_unique_id`.
- ObjectConfigurationAdd(Object object, Variant configuration) -> int - Callback for `MultiplayerAPI.object_configuration_add`.
- ObjectConfigurationRemove(Object object, Variant configuration) -> int - Callback for `MultiplayerAPI.object_configuration_remove`.
- Poll() -> int - Callback for `MultiplayerAPI.poll`.
- Rpc(int peer, Object object, StringName method, Godot.Collections.Array args) -> int - Callback for `MultiplayerAPI.rpc`.
- SetMultiplayerPeer(MultiplayerPeer multiplayerPeer) - Called when the `MultiplayerAPI.multiplayer_peer` is set.

