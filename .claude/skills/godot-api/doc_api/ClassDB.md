## ClassDB <- Object

Provides access to metadata stored for every available engine class. **Note:** Script-defined classes with `class_name` are not part of ClassDB, so they will not return reflection data such as a method or property list. However, GDExtension-defined classes *are* part of ClassDB, so they will return reflection data.

**Methods:**
- CanInstantiate(StringName class) -> bool - Returns `true` if objects can be instantiated from the specified `class`, otherwise returns `false`.
- ClassCallStatic(StringName class, StringName method) -> Variant - Calls a static method on a class.
- ClassExists(StringName class) -> bool - Returns whether the specified `class` is available or not.
- ClassGetApiType(StringName class) -> int - Returns the API type of the specified `class`.
- ClassGetEnumConstants(StringName class, StringName enum, bool noInheritance = false) -> string[] - Returns an array with all the keys in `enum` of `class` or its ancestry.
- ClassGetEnumList(StringName class, bool noInheritance = false) -> string[] - Returns an array with all the enums of `class` or its ancestry.
- ClassGetIntegerConstant(StringName class, StringName name) -> int - Returns the value of the integer constant `name` of `class` or its ancestry. Always returns 0 when the constant could not be found.
- ClassGetIntegerConstantEnum(StringName class, StringName name, bool noInheritance = false) -> StringName - Returns which enum the integer constant `name` of `class` or its ancestry belongs to.
- ClassGetIntegerConstantList(StringName class, bool noInheritance = false) -> string[] - Returns an array with the names all the integer constants of `class` or its ancestry.
- ClassGetMethodArgumentCount(StringName class, StringName method, bool noInheritance = false) -> int - Returns the number of arguments of the method `method` of `class` or its ancestry if `no_inheritance` is `false`.
- ClassGetMethodList(StringName class, bool noInheritance = false) -> Dictionary[] - Returns an array with all the methods of `class` or its ancestry if `no_inheritance` is `false`. Every element of the array is a Dictionary with the following keys: `args`, `default_args`, `flags`, `id`, `name`, `return: (class_name, hint, hint_string, name, type, usage)`. **Note:** In exported release builds the debug info is not available, so the returned dictionaries will contain only method names.
- ClassGetProperty(Object object, StringName property) -> Variant - Returns the value of `property` of `object` or its ancestry.
- ClassGetPropertyDefaultValue(StringName class, StringName property) -> Variant - Returns the default value of `property` of `class` or its ancestor classes.
- ClassGetPropertyGetter(StringName class, StringName property) -> StringName - Returns the getter method name of `property` of `class`.
- ClassGetPropertyList(StringName class, bool noInheritance = false) -> Dictionary[] - Returns an array with all the properties of `class` or its ancestry if `no_inheritance` is `false`.
- ClassGetPropertySetter(StringName class, StringName property) -> StringName - Returns the setter method name of `property` of `class`.
- ClassGetSignal(StringName class, StringName signal) -> Godot.Collections.Dictionary - Returns the `signal` data of `class` or its ancestry. The returned value is a Dictionary with the following keys: `args`, `default_args`, `flags`, `id`, `name`, `return: (class_name, hint, hint_string, name, type, usage)`.
- ClassGetSignalList(StringName class, bool noInheritance = false) -> Dictionary[] - Returns an array with all the signals of `class` or its ancestry if `no_inheritance` is `false`. Every element of the array is a Dictionary as described in `class_get_signal`.
- ClassHasEnum(StringName class, StringName name, bool noInheritance = false) -> bool - Returns whether `class` or its ancestry has an enum called `name` or not.
- ClassHasIntegerConstant(StringName class, StringName name) -> bool - Returns whether `class` or its ancestry has an integer constant called `name` or not.
- ClassHasMethod(StringName class, StringName method, bool noInheritance = false) -> bool - Returns whether `class` (or its ancestry if `no_inheritance` is `false`) has a method called `method` or not.
- ClassHasSignal(StringName class, StringName signal) -> bool - Returns whether `class` or its ancestry has a signal called `signal` or not.
- ClassSetProperty(Object object, StringName property, Variant value) -> int - Sets `property` value of `object` to `value`.
- GetClassList() -> string[] - Returns the names of all engine classes available. **Note:** Script-defined classes with `class_name` are not included in this list. Use `ProjectSettings.get_global_class_list` to get a list of script-defined classes instead.
- GetInheritersFromClass(StringName class) -> string[] - Returns the names of all engine classes that directly or indirectly inherit from `class`.
- GetParentClass(StringName class) -> StringName - Returns the parent class of `class`.
- Instantiate(StringName class) -> Variant - Creates an instance of `class`.
- IsClassEnabled(StringName class) -> bool - Returns whether this `class` is enabled or not.
- IsClassEnumBitfield(StringName class, StringName enum, bool noInheritance = false) -> bool - Returns whether `class` (or its ancestor classes if `no_inheritance` is `false`) has an enum called `enum` that is a bitfield.
- IsParentClass(StringName class, StringName inherits) -> bool - Returns whether `inherits` is an ancestor of `class` or not.

**Enums:**
**APIType:** API_CORE=0, API_EDITOR=1, API_EXTENSION=2, API_EDITOR_EXTENSION=3, API_NONE=4
  - API_CORE: Native Core class type.
  - API_EDITOR: Native Editor class type.
  - API_EXTENSION: GDExtension class type.
  - API_EDITOR_EXTENSION: GDExtension Editor class type.
  - API_NONE: Unknown class type.

