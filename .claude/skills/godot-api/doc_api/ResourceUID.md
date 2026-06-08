## ResourceUID <- Object

Resource UIDs (Unique IDentifiers) allow the engine to keep references between resources intact, even if files are renamed or moved. They can be accessed with `uid://`. ResourceUID keeps track of all registered resource UIDs in a project, generates new UIDs, and converts between their string and integer representations.

**Methods:**
- AddId(int id, string path) - Adds a new UID value which is mapped to the given resource path. Fails with an error if the UID already exists, so be sure to check `has_id` beforehand, or use `set_id` instead.
- CreateId() -> int - Generates a random resource UID which is guaranteed to be unique within the list of currently loaded UIDs. In order for this UID to be registered, you must call `add_id` or `set_id`.
- CreateIdForPath(string path) -> int - Like `create_id`, but the UID is seeded with the provided `path` and project name. UIDs generated for that path will be always the same within the current project.
- EnsurePath(string pathOrUid) -> string - Returns a path, converting `path_or_uid` if necessary. Fails and returns an empty string if an invalid UID is provided.
- GetIdPath(int id) -> string - Returns the path that the given UID value refers to. Fails with an error if the UID does not exist, so be sure to check `has_id` beforehand.
- HasId(int id) -> bool - Returns whether the given UID value is known to the cache.
- IdToText(int id) -> string - Converts the given UID to a `uid://` string value.
- PathToUid(string path) -> string - Converts the provided resource `path` to a UID. Returns the unchanged path if it has no associated UID.
- RemoveId(int id) - Removes a loaded UID value from the cache. Fails with an error if the UID does not exist, so be sure to check `has_id` beforehand.
- SetId(int id, string path) - Updates the resource path of an existing UID. Fails with an error if the UID does not exist, so be sure to check `has_id` beforehand, or use `add_id` instead.
- TextToId(string textId) -> int - Extracts the UID value from the given `uid://` string.
- UidToPath(string uid) -> string - Converts the provided `uid` to a path. Prints an error if the UID is invalid.

**Enums:**
**Constants:** INVALID_ID=-1
  - INVALID_ID: The value to use for an invalid UID, for example if the resource could not be loaded. Its text representation is `uid://<invalid>`.

