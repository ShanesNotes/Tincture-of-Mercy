## ResourcePreloader <- Node

This node is used to preload sub-resources inside a scene, so when the scene is loaded, all the resources are ready to use and can be retrieved from the preloader. You can add the resources using the ResourcePreloader tab when the node is selected. GDScript has a simplified `@GDScript.preload` built-in method which can be used in most situations, leaving the use of ResourcePreloader for more advanced scenarios.

**Methods:**
- AddResource(StringName name, Resource resource) - Adds a resource to the preloader with the given `name`. If a resource with the given `name` already exists, the new resource will be renamed to "`name` N" where N is an incrementing number starting from 2.
- GetResource(StringName name) -> Resource - Returns the resource associated to `name`.
- GetResourceList() -> string[] - Returns the list of resources inside the preloader.
- HasResource(StringName name) -> bool - Returns `true` if the preloader contains a resource associated to `name`.
- RemoveResource(StringName name) - Removes the resource associated to `name` from the preloader.
- RenameResource(StringName name, StringName newname) - Renames a resource inside the preloader from `name` to `newname`.

