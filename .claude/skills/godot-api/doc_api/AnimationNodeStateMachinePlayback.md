## AnimationNodeStateMachinePlayback <- Resource

Allows control of AnimationTree state machines created with AnimationNodeStateMachine. Retrieve with `$AnimationTree.get("parameters/playback")`.

**Props:**
- ResourceLocalToScene: bool = true


**Methods:**
- GetCurrentLength() -> float - Returns the current state length. **Note:** It is possible that any AnimationRootNode can be nodes as well as animations. This means that there can be multiple animations within a single state. Which animation length has priority depends on the nodes connected inside it. Also, if a transition does not reset, the remaining length at that point will be returned.
- GetCurrentNode() -> StringName - Returns the currently playing animation state. **Note:** When using a cross-fade, the current state changes to the next state immediately after the cross-fade begins.
- GetCurrentPlayPosition() -> float - Returns the playback position within the current animation state.
- GetFadingFromLength() -> float - Returns the playback state length of the node from `get_fading_from_node`. Returns `0` if no animation fade is occurring.
- GetFadingFromNode() -> StringName - Returns the starting state of currently fading animation.
- GetFadingFromPlayPosition() -> float - Returns the playback position of the node from `get_fading_from_node`. Returns `0` if no animation fade is occurring.
- GetFadingLength() -> float - Returns the length of the current fade animation. Returns `0` if no animation fade is occurring.
- GetFadingPosition() -> float - Returns the playback position of the current fade animation. Returns `0` if no animation fade is occurring.
- GetTravelPath() -> StringName[] - Returns the current travel path as computed internally by the A* algorithm.
- IsPlaying() -> bool - Returns `true` if an animation is playing.
- Next() - If there is a next path by travel or auto advance, immediately transitions from the current state to the next state.
- Start(StringName node, bool reset = true) - Starts playing the given animation. If `reset` is `true`, the animation is played from the beginning.
- Stop() - Stops the currently playing animation.
- Travel(StringName toNode, bool resetOnTeleport = true) - Transitions from the current state to another one, following the shortest path. If the path does not connect from the current state, the animation will play after the state teleports. If `reset_on_teleport` is `true`, the animation is played from the beginning when the travel cause a teleportation.

**Signals:**
- StateFinished(StringName state) - Emitted when the `state` finishes playback. If `state` is a state machine set to grouped mode, its signals are passed through with its name prefixed. If there is a crossfade, this will be fired when the influence of the `get_fading_from_node` animation is no longer present.
- StateStarted(StringName state) - Emitted when the `state` starts playback. If `state` is a state machine set to grouped mode, its signals are passed through with its name prefixed.

