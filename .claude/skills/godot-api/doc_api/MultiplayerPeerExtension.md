## MultiplayerPeerExtension <- MultiplayerPeer

This class is designed to be inherited from a GDExtension plugin to implement custom networking layers for the multiplayer API (such as WebRTC). All the methods below **must** be implemented to have a working custom multiplayer implementation. See also MultiplayerAPI.

**Methods:**
- Close() - Called when the multiplayer peer should be immediately closed (see `MultiplayerPeer.close`).
- DisconnectPeer(int peer, bool force) - Called when the connected `peer` should be forcibly disconnected (see `MultiplayerPeer.disconnect_peer`).
- GetAvailablePacketCount() -> int - Called when the available packet count is internally requested by the MultiplayerAPI.
- GetConnectionStatus() -> int - Called when the connection status is requested on the MultiplayerPeer (see `MultiplayerPeer.get_connection_status`).
- GetMaxPacketSize() -> int - Called when the maximum allowed packet size (in bytes) is requested by the MultiplayerAPI.
- GetPacket(const uint8_t ** rBuffer, int32_t* rBufferSize) -> int - Called when a packet needs to be received by the MultiplayerAPI, with `r_buffer_size` being the size of the binary `r_buffer` in bytes.
- GetPacketChannel() -> int - Called to get the channel over which the next available packet was received. See `MultiplayerPeer.get_packet_channel`.
- GetPacketMode() -> int - Called to get the transfer mode the remote peer used to send the next available packet. See `MultiplayerPeer.get_packet_mode`.
- GetPacketPeer() -> int - Called when the ID of the MultiplayerPeer who sent the most recent packet is requested (see `MultiplayerPeer.get_packet_peer`).
- GetPacketScript() -> byte[] - Called when a packet needs to be received by the MultiplayerAPI, if `_get_packet` isn't implemented. Use this when extending this class via GDScript.
- GetTransferChannel() -> int - Called when the transfer channel to use is read on this MultiplayerPeer (see `MultiplayerPeer.transfer_channel`).
- GetTransferMode() -> int - Called when the transfer mode to use is read on this MultiplayerPeer (see `MultiplayerPeer.transfer_mode`).
- GetUniqueId() -> int - Called when the unique ID of this MultiplayerPeer is requested (see `MultiplayerPeer.get_unique_id`). The value must be between `1` and `2147483647`.
- IsRefusingNewConnections() -> bool - Called when the "refuse new connections" status is requested on this MultiplayerPeer (see `MultiplayerPeer.refuse_new_connections`).
- IsServer() -> bool - Called when the "is server" status is requested on the MultiplayerAPI. See `MultiplayerAPI.is_server`.
- IsServerRelaySupported() -> bool - Called to check if the server can act as a relay in the current configuration. See `MultiplayerPeer.is_server_relay_supported`.
- Poll() - Called when the MultiplayerAPI is polled. See `MultiplayerAPI.poll`.
- PutPacket(const uint8_t* buffer, int bufferSize) -> int - Called when a packet needs to be sent by the MultiplayerAPI, with `buffer_size` being the size of the binary `buffer` in bytes.
- PutPacketScript(byte[] buffer) -> int - Called when a packet needs to be sent by the MultiplayerAPI, if `_put_packet` isn't implemented. Use this when extending this class via GDScript.
- SetRefuseNewConnections(bool enable) - Called when the "refuse new connections" status is set on this MultiplayerPeer (see `MultiplayerPeer.refuse_new_connections`).
- SetTargetPeer(int peer) - Called when the target peer to use is set for this MultiplayerPeer (see `MultiplayerPeer.set_target_peer`).
- SetTransferChannel(int channel) - Called when the channel to use is set for this MultiplayerPeer (see `MultiplayerPeer.transfer_channel`).
- SetTransferMode(int mode) - Called when the transfer mode is set on this MultiplayerPeer (see `MultiplayerPeer.transfer_mode`).

