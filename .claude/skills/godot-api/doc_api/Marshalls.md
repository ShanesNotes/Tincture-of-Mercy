## Marshalls <- Object

Provides data transformation and encoding utility functions.

**Methods:**
- Base64ToRaw(string base64Str) -> byte[] - Returns a decoded PackedByteArray corresponding to the Base64-encoded string `base64_str`.
- Base64ToUtf8(string base64Str) -> string - Returns a decoded string corresponding to the Base64-encoded string `base64_str`.
- Base64ToVariant(string base64Str, bool allowObjects = false) -> Variant - Returns a decoded Variant corresponding to the Base64-encoded string `base64_str`. If `allow_objects` is `true`, decoding objects is allowed. Internally, this uses the same decoding mechanism as the `@GlobalScope.bytes_to_var` method. **Warning:** Deserialized objects can contain code which gets executed. Do not use this option if the serialized object comes from untrusted sources to avoid potential security threats such as remote code execution.
- RawToBase64(byte[] array) -> string - Returns a Base64-encoded string of a given PackedByteArray.
- Utf8ToBase64(string utf8Str) -> string - Returns a Base64-encoded string of the UTF-8 string `utf8_str`.
- VariantToBase64(Variant variant, bool fullObjects = false) -> string - Returns a Base64-encoded string of the Variant `variant`. If `full_objects` is `true`, encoding objects is allowed (and can potentially include code). Internally, this uses the same encoding mechanism as the `@GlobalScope.var_to_bytes` method.

