## InputMap <- Object

Manages all InputEventAction which can be created/modified from the project settings menu **Project > Project Settings > Input Map** or in code with `add_action` and `action_add_event`. See `Node._input`.

**Methods:**
- ActionAddEvent(StringName action, InputEvent event) - Adds an InputEvent to an action. This InputEvent will trigger the action.
- ActionEraseEvent(StringName action, InputEvent event) - Removes an InputEvent from an action.
- ActionEraseEvents(StringName action) - Removes all events from an action.
- ActionGetDeadzone(StringName action) -> float - Returns a deadzone value for the action.
- ActionGetEvents(StringName action) -> InputEvent[] - Returns an array of InputEvents associated with a given action. **Note:** When used in the editor (e.g. a tool script or EditorPlugin), this method will return events for the editor action. If you want to access your project's input binds from the editor, read the `input/*` settings from ProjectSettings.
- ActionHasEvent(StringName action, InputEvent event) -> bool - Returns `true` if the action has the given InputEvent associated with it.
- ActionSetDeadzone(StringName action, float deadzone) - Sets a deadzone value for the action.
- AddAction(StringName action, float deadzone = 0.2) - Adds an empty action to the InputMap with a configurable `deadzone`. An InputEvent can then be added to this action with `action_add_event`.
- EraseAction(StringName action) - Removes an action from the InputMap.
- EventIsAction(InputEvent event, StringName action, bool exactMatch = false) -> bool - Returns `true` if the given event is part of an existing action. This method ignores keyboard modifiers if the given InputEvent is not pressed (for proper release detection). See `action_has_event` if you don't want this behavior. If `exact_match` is `false`, it ignores additional input modifiers for InputEventKey and InputEventMouseButton events, and the direction for InputEventJoypadMotion events.
- GetActionDescription(StringName action) -> string - Returns the human-readable description of the given action.
- GetActions() -> StringName[] - Returns an array of all actions in the InputMap.
- HasAction(StringName action) -> bool - Returns `true` if the InputMap has a registered action with the given name.
- LoadFromProjectSettings() - Clears all InputEventAction in the InputMap and load it anew from ProjectSettings.

**Signals:**
- ProjectSettingsLoaded - Emitted when the ProjectSettings InputMap has been loaded.

