## ImageFormatLoaderExtension <- ImageFormatLoader

The engine supports multiple image formats out of the box (PNG, SVG, JPEG, WebP to name a few), but you can choose to implement support for additional image formats by extending this class. Be sure to respect the documented return types and values. You should create an instance of it, and call `add_format_loader` to register that loader during the initialization phase.

**Methods:**
- GetRecognizedExtensions() -> string[] - Returns the list of file extensions for this image format. Files with the given extensions will be treated as image file and loaded using this class.
- LoadImage(Image image, FileAccess fileaccess, int flags, float scale) -> int - Loads the content of `fileaccess` into the provided `image`.
- AddFormatLoader() - Add this format loader to the engine, allowing it to recognize the file extensions returned by `_get_recognized_extensions`.
- RemoveFormatLoader() - Remove this format loader from the engine.

