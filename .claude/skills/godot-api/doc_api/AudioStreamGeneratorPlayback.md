## AudioStreamGeneratorPlayback <- AudioStreamPlaybackResampled

This class is meant to be used with AudioStreamGenerator to play back the generated audio in real-time.

**Methods:**
- CanPushBuffer(int amount) -> bool - Returns `true` if a buffer of the size `amount` can be pushed to the audio sample data buffer without overflowing it, `false` otherwise.
- ClearBuffer() - Clears the audio sample data buffer.
- GetFramesAvailable() -> int - Returns the number of frames that can be pushed to the audio sample data buffer without overflowing it. If the result is `0`, the buffer is full.
- GetSkips() -> int - Returns the number of times the playback skipped due to a buffer underrun in the audio sample data. This value is reset at the start of the playback.
- PushBuffer(Vector2[] frames) -> bool - Pushes several audio data frames to the buffer. This is usually more efficient than `push_frame` in C# and compiled languages via GDExtension, but `push_buffer` may be *less* efficient in GDScript.
- PushFrame(Vector2 frame) -> bool - Pushes a single audio data frame to the buffer. This is usually less efficient than `push_buffer` in C# and compiled languages via GDExtension, but `push_frame` may be *more* efficient in GDScript.

