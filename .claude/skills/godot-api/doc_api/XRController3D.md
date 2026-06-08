## XRController3D <- XRNode3D

This is a helper 3D node that is linked to the tracking of controllers. It also offers several handy passthroughs to the state of buttons and such on the controllers. Controllers are linked by their ID. You can create controller nodes before the controllers are available. If your game always uses two controllers (one for each hand), you can predefine the controllers with ID 1 and 2; they will become active as soon as the controllers are identified. If you expect additional controllers to be used, you should react to the signals and add XRController3D nodes to your scene. The position of the controller node is automatically updated by the XRServer. This makes this node ideal to add child nodes to visualize the controller. The current XRInterface defines the names of inputs. In the case of OpenXR, these are the names of actions in the current action set from the OpenXR action map.

**Methods:**
- GetFloat(StringName name) -> float - Returns a numeric value for the input with the given `name`. This is used for triggers and grip sensors. **Note:** The current XRInterface defines the `name` for each input. In the case of OpenXR, these are the names of actions in the current action set.
- GetInput(StringName name) -> Variant - Returns a Variant for the input with the given `name`. This works for any input type, the variant will be typed according to the actions configuration. **Note:** The current XRInterface defines the `name` for each input. In the case of OpenXR, these are the names of actions in the current action set.
- GetTrackerHand() -> int - Returns the hand holding this controller, if known.
- GetVector2(StringName name) -> Vector2 - Returns a Vector2 for the input with the given `name`. This is used for thumbsticks and thumbpads found on many controllers. **Note:** The current XRInterface defines the `name` for each input. In the case of OpenXR, these are the names of actions in the current action set.
- IsButtonPressed(StringName name) -> bool - Returns `true` if the button with the given `name` is pressed. **Note:** The current XRInterface defines the `name` for each input. In the case of OpenXR, these are the names of actions in the current action set.

**Signals:**
- ButtonPressed(string actionName) - Emitted when a button on this controller is pressed.
- ButtonReleased(string actionName) - Emitted when a button on this controller is released.
- InputFloatChanged(string actionName, float value) - Emitted when a trigger or similar input on this controller changes value.
- InputVector2Changed(string actionName, Vector2 value) - Emitted when a thumbstick or thumbpad on this controller is moved.
- ProfileChanged(string role) - Emitted when the interaction profile on this controller is changed.

