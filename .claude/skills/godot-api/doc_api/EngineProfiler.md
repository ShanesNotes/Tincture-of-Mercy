## EngineProfiler <- RefCounted

This class can be used to implement custom profilers that are able to interact with the engine and editor debugger. See EngineDebugger and EditorDebuggerPlugin for more information.

**Methods:**
- AddFrame(Godot.Collections.Array data) - Called when data is added to profiler using `EngineDebugger.profiler_add_frame_data`.
- Tick(float frameTime, float processTime, float physicsTime, float physicsFrameTime) - Called once every engine iteration when the profiler is active with information about the current frame. All time values are in seconds. Lower values represent faster processing times and are therefore considered better.
- Toggle(bool enable, Godot.Collections.Array options) - Called when the profiler is enabled/disabled, along with a set of `options`.

