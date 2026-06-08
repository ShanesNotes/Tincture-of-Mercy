## NavigationServer3DManager <- Object

NavigationServer3DManager is the API for registering NavigationServer3D implementations and setting the default implementation. **Note:** It is not possible to switch servers at runtime. This class is only used on startup at the server initialization level.

**Methods:**
- RegisterServer(string name, Callable createCallback) - Registers a NavigationServer3D implementation by passing a `name` and a Callable that returns a NavigationServer3D object.
- SetDefaultServer(string name, int priority) - Sets the default NavigationServer3D implementation to the one identified by `name`, if `priority` is greater than the priority of the current default implementation.

