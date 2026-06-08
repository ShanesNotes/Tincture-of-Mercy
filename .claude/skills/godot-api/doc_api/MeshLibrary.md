## MeshLibrary <- Resource

A library of meshes. Contains a list of Mesh resources, each with a name and ID. Each item can also include collision and navigation shapes. This resource is used in GridMap.

**Methods:**
- Clear() - Clears the library.
- CreateItem(int id) - Creates a new item in the library with the given ID. You can get an unused ID from `get_last_unused_item_id`.
- FindItemByName(string name) -> int - Returns the first item with the given name, or `-1` if no item is found.
- GetItemCount() -> int - Returns the number of items present in the library.
- GetItemList() -> int[] - Returns the list of item IDs in use.
- GetItemMesh(int id) -> Mesh - Returns the item's mesh.
- GetItemMeshCastShadow(int id) -> int - Returns the item's shadow casting mode.
- GetItemMeshTransform(int id) -> Transform3D - Returns the transform applied to the item's mesh.
- GetItemName(int id) -> string - Returns the item's name.
- GetItemNavigationLayers(int id) -> int - Returns the item's navigation layers bitmask.
- GetItemNavigationMesh(int id) -> NavigationMesh - Returns the item's navigation mesh.
- GetItemNavigationMeshTransform(int id) -> Transform3D - Returns the transform applied to the item's navigation mesh.
- GetItemPreview(int id) -> Texture2D - When running in the editor, returns a generated item preview (a 3D rendering in isometric perspective). When used in a running project, returns the manually-defined item preview which can be set using `set_item_preview`. Returns an empty Texture2D if no preview was manually set in a running project.
- GetItemShapes(int id) -> Godot.Collections.Array - Returns an item's collision shapes. The array consists of each Shape3D followed by its Transform3D.
- GetLastUnusedItemId() -> int - Gets an unused ID for a new item.
- RemoveItem(int id) - Removes the item.
- SetItemMesh(int id, Mesh mesh) - Sets the item's mesh.
- SetItemMeshCastShadow(int id, int shadowCastingSetting) - Sets the item's shadow casting mode to `shadow_casting_setting`.
- SetItemMeshTransform(int id, Transform3D meshTransform) - Sets the transform to apply to the item's mesh.
- SetItemName(int id, string name) - Sets the item's name. This name is shown in the editor. It can also be used to look up the item later using `find_item_by_name`.
- SetItemNavigationLayers(int id, int navigationLayers) - Sets the item's navigation layers bitmask.
- SetItemNavigationMesh(int id, NavigationMesh navigationMesh) - Sets the item's navigation mesh.
- SetItemNavigationMeshTransform(int id, Transform3D navigationMesh) - Sets the transform to apply to the item's navigation mesh.
- SetItemPreview(int id, Texture2D texture) - Sets a texture to use as the item's preview icon in the editor.
- SetItemShapes(int id, Godot.Collections.Array shapes) - Sets an item's collision shapes. The array should consist of Shape3D objects, each followed by a Transform3D that will be applied to it. For shapes that should not have a transform, use `Transform3D.IDENTITY`.

