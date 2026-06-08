## ScriptLanguageExtension <- ScriptLanguage

**Methods:**
- AddGlobalConstant(StringName name, Variant value)
- AddNamedGlobalConstant(StringName name, Variant value)
- AutoIndentCode(string code, int fromLine, int toLine) -> string
- CanInheritFromFile() -> bool
- CanMakeFunction() -> bool
- CompleteCode(string code, string path, Object owner) -> Godot.Collections.Dictionary
- CreateScript() -> Object
- DebugGetCurrentStackInfo() -> Dictionary[]
- DebugGetError() -> string
- DebugGetGlobals(int maxSubitems, int maxDepth) -> Godot.Collections.Dictionary
- DebugGetStackLevelCount() -> int
- DebugGetStackLevelFunction(int level) -> string
- DebugGetStackLevelInstance(int level) -> void*
- DebugGetStackLevelLine(int level) -> int
- DebugGetStackLevelLocals(int level, int maxSubitems, int maxDepth) -> Godot.Collections.Dictionary
- DebugGetStackLevelMembers(int level, int maxSubitems, int maxDepth) -> Godot.Collections.Dictionary
- DebugGetStackLevelSource(int level) -> string - Returns the source associated with a given debug stack position.
- DebugParseStackLevelExpression(int level, string expression, int maxSubitems, int maxDepth) -> string
- FindFunction(string function, string code) -> int - Returns the line where the function is defined in the code, or `-1` if the function is not present.
- Finish()
- Frame()
- GetBuiltInTemplates(StringName object) -> Dictionary[]
- GetCommentDelimiters() -> string[]
- GetDocCommentDelimiters() -> string[]
- GetExtension() -> string
- GetGlobalClassName(string path) -> Godot.Collections.Dictionary
- GetName() -> string
- GetPublicAnnotations() -> Dictionary[]
- GetPublicConstants() -> Godot.Collections.Dictionary
- GetPublicFunctions() -> Dictionary[]
- GetRecognizedExtensions() -> string[]
- GetReservedWords() -> string[]
- GetStringDelimiters() -> string[]
- GetType() -> string
- HandlesGlobalClassType(string type) -> bool
- HasNamedClasses() -> bool
- Init()
- IsControlFlowKeyword(string keyword) -> bool
- IsUsingTemplates() -> bool
- LookupCode(string code, string symbol, string path, Object owner) -> Godot.Collections.Dictionary
- MakeFunction(string className, string functionName, string[] functionArgs) -> string
- MakeTemplate(string template, string className, string baseClassName) -> Script
- OpenInExternalEditor(Script script, int line, int column) -> int
- OverridesExternalEditor() -> bool
- PreferredFileNameCasing() -> int
- ProfilingGetAccumulatedData(ScriptLanguageExtensionProfilingInfo* infoArray, int infoMax) -> int
- ProfilingGetFrameData(ScriptLanguageExtensionProfilingInfo* infoArray, int infoMax) -> int
- ProfilingSetSaveNativeCalls(bool enable)
- ProfilingStart()
- ProfilingStop()
- ReloadAllScripts()
- ReloadScripts(Godot.Collections.Array scripts, bool softReload) - Reloads all `scripts` from disk and the specifics of how that happens is ScriptLanguageExtension specific.
- ReloadToolScript(Script script, bool softReload) - Reloads the given `script` from disk and the specifics of how that happens is ScriptLanguageExtension specific.
- RemoveNamedGlobalConstant(StringName name)
- SupportsBuiltinMode() -> bool
- SupportsDocumentation() -> bool
- ThreadEnter()
- ThreadExit()
- Validate(string script, string path, bool validateFunctions, bool validateErrors, bool validateWarnings, bool validateSafeLines) -> Godot.Collections.Dictionary
- ValidatePath(string path) -> string

**Enums:**
**LookupResultType:** LOOKUP_RESULT_SCRIPT_LOCATION=0, LOOKUP_RESULT_CLASS=1, LOOKUP_RESULT_CLASS_CONSTANT=2, LOOKUP_RESULT_CLASS_PROPERTY=3, LOOKUP_RESULT_CLASS_METHOD=4, LOOKUP_RESULT_CLASS_SIGNAL=5, LOOKUP_RESULT_CLASS_ENUM=6, LOOKUP_RESULT_CLASS_TBD_GLOBALSCOPE=7, LOOKUP_RESULT_CLASS_ANNOTATION=8, LOOKUP_RESULT_LOCAL_CONSTANT=9, ...
**CodeCompletionLocation:** LOCATION_LOCAL=0, LOCATION_PARENT_MASK=256, LOCATION_OTHER_USER_CODE=512, LOCATION_OTHER=1024
  - LOCATION_LOCAL: The option is local to the location of the code completion query - e.g. a local variable. Subsequent value of location represent options from the outer class, the exact value represent how far they are (in terms of inner classes).
  - LOCATION_PARENT_MASK: The option is from the containing class or a parent class, relative to the location of the code completion query. Perform a bitwise OR with the class depth (e.g. `0` for the local class, `1` for the parent, `2` for the grandparent, etc.) to store the depth of an option in the class or a parent class.
  - LOCATION_OTHER_USER_CODE: The option is from user code which is not local and not in a derived class (e.g. Autoload Singletons).
  - LOCATION_OTHER: The option is from other engine code, not covered by the other enum constants - e.g. built-in classes.
**CodeCompletionKind:** CODE_COMPLETION_KIND_CLASS=0, CODE_COMPLETION_KIND_FUNCTION=1, CODE_COMPLETION_KIND_SIGNAL=2, CODE_COMPLETION_KIND_VARIABLE=3, CODE_COMPLETION_KIND_MEMBER=4, CODE_COMPLETION_KIND_ENUM=5, CODE_COMPLETION_KIND_CONSTANT=6, CODE_COMPLETION_KIND_NODE_PATH=7, CODE_COMPLETION_KIND_FILE_PATH=8, CODE_COMPLETION_KIND_PLAIN_TEXT=9, ...

