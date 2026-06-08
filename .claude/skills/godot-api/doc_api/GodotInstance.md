## GodotInstance <- Object

GodotInstance represents a running Godot instance that is controlled from an outside codebase, without a perpetual main loop. It is created by the C API `libgodot_create_godot_instance`. Only one may be created per process.

**Methods:**
- FocusIn() - Notifies the instance that it is now in focus.
- FocusOut() - Notifies the instance that it is now not in focus.
- IsStarted() -> bool - Returns `true` if this instance has been fully started.
- Iteration() -> bool - Runs a single iteration of the main loop. Returns `true` if the engine is attempting to quit.
- Pause() - Notifies the instance that it is going to be paused.
- Resume() - Notifies the instance that it is being resumed.
- Start() -> bool - Finishes this instance's startup sequence. Returns `true` on success.

