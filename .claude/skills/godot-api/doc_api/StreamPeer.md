## StreamPeer <- RefCounted

StreamPeer is an abstract base class mostly used for stream-based protocols (such as TCP). It provides an API for sending and receiving data through streams as raw data or strings. **Note:** When exporting to Android, make sure to enable the `INTERNET` permission in the Android export preset before exporting the project or using one-click deploy. Otherwise, network communication of any kind will be blocked by Android.

**Props:**
- BigEndian: bool = false

- **big_endian**: If `true`, this StreamPeer will using big-endian format for encoding and decoding.

**Methods:**
- Get8() -> int - Gets a signed byte from the stream.
- Get16() -> int - Gets a signed 16-bit value from the stream.
- Get32() -> int - Gets a signed 32-bit value from the stream.
- Get64() -> int - Gets a signed 64-bit value from the stream.
- GetAvailableBytes() -> int - Returns the number of bytes this StreamPeer has available.
- GetData(int bytes) -> Godot.Collections.Array - Returns a chunk data with the received bytes, as an Array containing two elements: an `Error` constant and a PackedByteArray. `bytes` is the number of bytes to be received. If not enough bytes are available, the function will block until the desired amount is received.
- GetDouble() -> float - Gets a double-precision float from the stream.
- GetFloat() -> float - Gets a single-precision float from the stream.
- GetHalf() -> float - Gets a half-precision float from the stream.
- GetPartialData(int bytes) -> Godot.Collections.Array - Returns a chunk data with the received bytes, as an Array containing two elements: an `Error` constant and a PackedByteArray. `bytes` is the number of bytes to be received. If not enough bytes are available, the function will return how many were actually received.
- GetString(int bytes = -1) -> string - Gets an ASCII string with byte-length `bytes` from the stream. If `bytes` is negative (default) the length will be read from the stream using the reverse process of `put_string`.
- GetU8() -> int - Gets an unsigned byte from the stream.
- GetU16() -> int - Gets an unsigned 16-bit value from the stream.
- GetU32() -> int - Gets an unsigned 32-bit value from the stream.
- GetU64() -> int - Gets an unsigned 64-bit value from the stream.
- GetUtf8String(int bytes = -1) -> string - Gets a UTF-8 string with byte-length `bytes` from the stream (this decodes the string sent as UTF-8). If `bytes` is negative (default) the length will be read from the stream using the reverse process of `put_utf8_string`.
- GetVar(bool allowObjects = false) -> Variant - Gets a Variant from the stream. If `allow_objects` is `true`, decoding objects is allowed. Internally, this uses the same decoding mechanism as the `@GlobalScope.bytes_to_var` method. **Warning:** Deserialized objects can contain code which gets executed. Do not use this option if the serialized object comes from untrusted sources to avoid potential security threats such as remote code execution.
- Put8(int value) - Puts a signed byte into the stream.
- Put16(int value) - Puts a signed 16-bit value into the stream.
- Put32(int value) - Puts a signed 32-bit value into the stream.
- Put64(int value) - Puts a signed 64-bit value into the stream.
- PutData(byte[] data) -> int - Sends a chunk of data through the connection, blocking if necessary until the data is done sending. This function returns an `Error` code.
- PutDouble(float value) - Puts a double-precision float into the stream.
- PutFloat(float value) - Puts a single-precision float into the stream.
- PutHalf(float value) - Puts a half-precision float into the stream.
- PutPartialData(byte[] data) -> Godot.Collections.Array - Sends a chunk of data through the connection. If all the data could not be sent at once, only part of it will. This function returns two values, an `Error` code and an integer, describing how much data was actually sent.
- PutString(string value) - Puts a zero-terminated ASCII string into the stream prepended by a 32-bit unsigned integer representing its size. **Note:** To put an ASCII string without prepending its size, you can use `put_data`:
- PutU8(int value) - Puts an unsigned byte into the stream.
- PutU16(int value) - Puts an unsigned 16-bit value into the stream.
- PutU32(int value) - Puts an unsigned 32-bit value into the stream.
- PutU64(int value) - Puts an unsigned 64-bit value into the stream.
- PutUtf8String(string value) - Puts a zero-terminated UTF-8 string into the stream prepended by a 32 bits unsigned integer representing its size. **Note:** To put a UTF-8 string without prepending its size, you can use `put_data`:
- PutVar(Variant value, bool fullObjects = false) - Puts a Variant into the stream. If `full_objects` is `true` encoding objects is allowed (and can potentially include code). Internally, this uses the same encoding mechanism as the `@GlobalScope.var_to_bytes` method.

