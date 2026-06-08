## TextServerManager <- Object

TextServerManager is the API backend for loading, enumerating, and switching TextServers. **Note:** Switching text server at runtime is possible, but will invalidate all fonts and text buffers. Make sure to unload all controls, fonts, and themes before doing so.

**Methods:**
- AddInterface(TextServer interface) - Registers a TextServer interface.
- FindInterface(string name) -> TextServer - Finds an interface by its `name`.
- GetInterface(int idx) -> TextServer - Returns the interface registered at a given index.
- GetInterfaceCount() -> int - Returns the number of interfaces currently registered.
- GetInterfaces() -> Dictionary[] - Returns a list of available interfaces, with the index and name of each interface.
- GetPrimaryInterface() -> TextServer - Returns the primary TextServer interface currently in use.
- RemoveInterface(TextServer interface) - Removes an interface. All fonts and shaped text caches should be freed before removing an interface.
- SetPrimaryInterface(TextServer index) - Sets the primary TextServer interface.

**Signals:**
- InterfaceAdded(StringName interfaceName) - Emitted when a new interface has been added.
- InterfaceRemoved(StringName interfaceName) - Emitted when an interface is removed.

