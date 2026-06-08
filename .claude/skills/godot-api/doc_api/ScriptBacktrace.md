## ScriptBacktrace <- RefCounted

ScriptBacktrace holds an already captured backtrace of a specific script language, such as GDScript or C#, which are captured using `Engine.capture_script_backtraces`. See `ProjectSettings.debug/settings/gdscript/always_track_call_stacks` and `ProjectSettings.debug/settings/gdscript/always_track_local_variables` for ways of controlling the contents of this class.

**Methods:**
- Format(int indentAll = 0, int indentFrames = 4) -> string - Converts the backtrace to a String, where the entire string will be indented by `indent_all` number of spaces, and the individual stack frames will be additionally indented by `indent_frames` number of spaces. **Note:** Calling `Object.to_string` on a ScriptBacktrace will produce the same output as calling `format` with all parameters left at their default values.
- GetFrameCount() -> int - Returns the number of stack frames in the backtrace.
- GetFrameFile(int index) -> string - Returns the file name of the call site represented by the stack frame at the specified index.
- GetFrameFunction(int index) -> string - Returns the name of the function called at the stack frame at the specified index.
- GetFrameLine(int index) -> int - Returns the line number of the call site represented by the stack frame at the specified index.
- GetGlobalVariableCount() -> int - Returns the number of global variables (e.g. autoload singletons) in the backtrace. **Note:** This will be non-zero only if the `include_variables` parameter was `true` when capturing the backtrace with `Engine.capture_script_backtraces`.
- GetGlobalVariableName(int variableIndex) -> string - Returns the name of the global variable at the specified index.
- GetGlobalVariableValue(int variableIndex) -> Variant - Returns the value of the global variable at the specified index. **Warning:** With GDScript backtraces, the returned Variant will be the variable's actual value, including any object references. This means that storing the returned Variant will prevent any such object from being deallocated, so it's generally recommended not to do so.
- GetLanguageName() -> string - Returns the name of the script language that this backtrace was captured from.
- GetLocalVariableCount(int frameIndex) -> int - Returns the number of local variables in the stack frame at the specified index. **Note:** This will be non-zero only if the `include_variables` parameter was `true` when capturing the backtrace with `Engine.capture_script_backtraces`.
- GetLocalVariableName(int frameIndex, int variableIndex) -> string - Returns the name of the local variable at the specified `variable_index` in the stack frame at the specified `frame_index`.
- GetLocalVariableValue(int frameIndex, int variableIndex) -> Variant - Returns the value of the local variable at the specified `variable_index` in the stack frame at the specified `frame_index`. **Warning:** With GDScript backtraces, the returned Variant will be the variable's actual value, including any object references. This means that storing the returned Variant will prevent any such object from being deallocated, so it's generally recommended not to do so.
- GetMemberVariableCount(int frameIndex) -> int - Returns the number of member variables in the stack frame at the specified index. **Note:** This will be non-zero only if the `include_variables` parameter was `true` when capturing the backtrace with `Engine.capture_script_backtraces`.
- GetMemberVariableName(int frameIndex, int variableIndex) -> string - Returns the name of the member variable at the specified `variable_index` in the stack frame at the specified `frame_index`.
- GetMemberVariableValue(int frameIndex, int variableIndex) -> Variant - Returns the value of the member variable at the specified `variable_index` in the stack frame at the specified `frame_index`. **Warning:** With GDScript backtraces, the returned Variant will be the variable's actual value, including any object references. This means that storing the returned Variant will prevent any such object from being deallocated, so it's generally recommended not to do so.
- IsEmpty() -> bool - Returns `true` if the backtrace has no stack frames.

