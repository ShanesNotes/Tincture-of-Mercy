## StreamPeerBuffer <- StreamPeer

A data buffer stream peer that uses a byte array as the stream. This object can be used to handle binary data from network sessions. To handle binary data stored in files, FileAccess can be used directly. A StreamPeerBuffer object keeps an internal cursor which is the offset in bytes to the start of the buffer. Get and put operations are performed at the cursor position and will move the cursor accordingly.

**Props:**
- DataArray: byte[] = PackedByteArray()

- **data_array**: The underlying data buffer. Setting this value resets the cursor.

**Methods:**
- Clear() - Clears the `data_array` and resets the cursor.
- Duplicate() -> StreamPeerBuffer - Returns a new StreamPeerBuffer with the same `data_array` content.
- GetPosition() -> int - Returns the current cursor position.
- GetSize() -> int - Returns the size of `data_array`.
- Resize(int size) - Resizes the `data_array`. This *doesn't* update the cursor.
- Seek(int position) - Moves the cursor to the specified position. `position` must be a valid index of `data_array`.

