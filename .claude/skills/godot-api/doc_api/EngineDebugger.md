## EngineDebugger <- Object

EngineDebugger handles the communication between the editor and the running game. It is active in the running game. Messages can be sent/received through it. It also manages the profilers.

**Methods:**
- ClearBreakpoints() - Clears all breakpoints.
- Debug(bool canContinue = true, bool isErrorBreakpoint = false) - Starts a debug break in script execution, optionally specifying whether the program can continue based on `can_continue` and whether the break was due to a breakpoint.
- GetDepth() -> int - Returns the current debug depth.
- GetLinesLeft() -> int - Returns the number of lines that remain.
- HasCapture(StringName name) -> bool - Returns `true` if a capture with the given name is present otherwise `false`.
- HasProfiler(StringName name) -> bool - Returns `true` if a profiler with the given name is present otherwise `false`.
- InsertBreakpoint(int line, StringName source) - Inserts a new breakpoint with the given `source` and `line`.
- IsActive() -> bool - Returns `true` if the debugger is active otherwise `false`.
- IsBreakpoint(int line, StringName source) -> bool - Returns `true` if the given `source` and `line` represent an existing breakpoint.
- IsProfiling(StringName name) -> bool - Returns `true` if a profiler with the given name is present and active otherwise `false`.
- IsSkippingBreakpoints() -> bool - Returns `true` if the debugger is skipping breakpoints otherwise `false`.
- LinePoll() - Forces a processing loop of debugger events. The purpose of this method is just processing events every now and then when the script might get too busy, so that bugs like infinite loops can be caught.
- ProfilerAddFrameData(StringName name, Godot.Collections.Array data) - Calls the `add` callable of the profiler with given `name` and `data`.
- ProfilerEnable(StringName name, bool enable, Godot.Collections.Array arguments = []) - Calls the `toggle` callable of the profiler with given `name` and `arguments`. Enables/Disables the same profiler depending on `enable` argument.
- RegisterMessageCapture(StringName name, Callable callable) - Registers a message capture with given `name`. If `name` is "my_message" then messages starting with "my_message:" will be called with the given callable. The callable must accept a message string and a data array as argument. The callable should return `true` if the message is recognized. **Note:** The callable will receive the message with the prefix stripped, unlike `EditorDebuggerPlugin._capture`. See the EditorDebuggerPlugin description for an example.
- RegisterProfiler(StringName name, EngineProfiler profiler) - Registers a profiler with the given `name`. See EngineProfiler for more information.
- RemoveBreakpoint(int line, StringName source) - Removes a breakpoint with the given `source` and `line`.
- ScriptDebug(ScriptLanguage language, bool canContinue = true, bool isErrorBreakpoint = false) - Starts a debug break in script execution, optionally specifying whether the program can continue based on `can_continue` and whether the break was due to a breakpoint.
- SendMessage(string message, Godot.Collections.Array data) - Sends a message with given `message` and `data` array.
- SetDepth(int depth) - Sets the current debugging depth.
- SetLinesLeft(int lines) - Sets the current debugging lines that remain.
- UnregisterMessageCapture(StringName name) - Unregisters the message capture with given `name`.
- UnregisterProfiler(StringName name) - Unregisters a profiler with given `name`.

