## XRNode3D <- Node3D

This node can be bound to a specific pose of an XRPositionalTracker and will automatically have its `Node3D.transform` updated by the XRServer. Nodes of this type must be added as children of the XROrigin3D node.

**Props:**
- PhysicsInterpolationMode: int (Node.PhysicsInterpolationMode) = 2
- Pose: StringName = &"default"
- ShowWhenTracked: bool = false
- Tracker: StringName = &""

- **pose**: The name of the pose we're bound to. Which poses a tracker supports is not known during design time. Godot defines number of standard pose names such as `aim` and `grip` but other may be configured within a given XRInterface.
- **show_when_tracked**: Enables showing the node when tracking starts, and hiding the node when tracking is lost.
- **tracker**: The name of the tracker we're bound to. Which trackers are available is not known during design time. Godot defines a number of standard trackers such as `left_hand` and `right_hand` but others may be configured within a given XRInterface.

**Methods:**
- GetHasTrackingData() -> bool - Returns `true` if the `tracker` has current tracking data for the `pose` being tracked.
- GetIsActive() -> bool - Returns `true` if the `tracker` has been registered and the `pose` is being tracked.
- GetPose() -> XRPose - Returns the XRPose containing the current state of the pose being tracked. This gives access to additional properties of this pose.
- TriggerHapticPulse(string actionName, float frequency, float amplitude, float durationSec, float delaySec) - Triggers a haptic pulse on a device associated with this interface. `action_name` is the name of the action for this pulse. `frequency` is the frequency of the pulse, set to `0.0` to have the system use a default frequency. `amplitude` is the amplitude of the pulse between `0.0` and `1.0`. `duration_sec` is the duration of the pulse in seconds. `delay_sec` is a delay in seconds before the pulse is given.

**Signals:**
- TrackingChanged(bool tracking) - Emitted when the `tracker` starts or stops receiving updated tracking data for the `pose` being tracked. The `tracking` argument indicates whether the tracker is getting updated tracking data.

