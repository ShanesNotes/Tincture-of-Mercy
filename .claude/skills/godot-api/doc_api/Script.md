## Script <- Resource

A class stored as a resource. A script extends the functionality of all objects that instantiate it. This is the base class for all scripts and should not be used directly. Trying to create a new script with this class will result in an error. The `new` method of a script subclass creates a new instance. `Object.set_script` extends an existing object, if that object's class matches one of the script's base classes.

**Props:**
- SourceCode: string

- **source_code**: The script source code or an empty string if source code is not available. When set, does not reload the class implementation automatically.

**Methods:**
- CanInstantiate() -> bool - Returns `true` if the script can be instantiated.
- GetBaseScript() -> Script - Returns the script directly inherited by this script.
- GetGlobalName() -> StringName - Returns the class name associated with the script, if there is one. Returns an empty string otherwise. To give the script a global name, you can use the `class_name` keyword in GDScript and the `GlobalClass` attribute in C#.
- GetInstanceBaseType() -> StringName - Returns the script's base type.
- GetPropertyDefaultValue(StringName property) -> Variant - Returns the default value of the specified property.
- GetRpcConfig() -> Variant - Returns a Dictionary mapping method names to their RPC configuration defined by this script.
- GetScriptConstantMap() -> Godot.Collections.Dictionary - Returns a dictionary containing constant names and their values.
- GetScriptMethodList() -> Dictionary[] - Returns the list of methods in this Script. **Note:** The dictionaries returned by this method are formatted identically to those returned by `Object.get_method_list`.
- GetScriptPropertyList() -> Dictionary[] - Returns the list of properties in this Script. **Note:** The dictionaries returned by this method are formatted identically to those returned by `Object.get_property_list`.
- GetScriptSignalList() -> Dictionary[] - Returns the list of signals defined in this Script. **Note:** The dictionaries returned by this method are formatted identically to those returned by `Object.get_signal_list`.
- HasScriptMethod(StringName methodName) -> bool - Returns `true` if the script, or a base class, defines a method with the given name.
- HasScriptSignal(StringName signalName) -> bool - Returns `true` if the script, or a base class, defines a signal with the given name.
- HasSourceCode() -> bool - Returns `true` if the script contains non-empty source code. **Note:** If a script does not have source code, this does not mean that it is invalid or unusable. For example, a GDScript that was exported with binary tokenization has no source code, but still behaves as expected and could be instantiated. This can be checked with `can_instantiate`.
- InstanceHas(Object baseObject) -> bool - Returns `true` if `base_object` is an instance of this script.
- IsAbstract() -> bool - Returns `true` if the script is an abstract script. An abstract script does not have a constructor and cannot be instantiated.
- IsTool() -> bool - Returns `true` if the script is a tool script. A tool script can run in the editor.
- Reload(bool keepState = false) -> int - Reloads the script's class implementation. Returns an error code.

