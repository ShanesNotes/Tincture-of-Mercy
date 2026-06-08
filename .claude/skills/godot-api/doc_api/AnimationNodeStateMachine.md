## AnimationNodeStateMachine <- AnimationRootNode

Contains multiple AnimationRootNodes representing animation states, connected in a graph. State transitions can be configured to happen automatically or via code, using a shortest-path algorithm. Retrieve the AnimationNodeStateMachinePlayback object from the AnimationTree node to control it programmatically.

**Props:**
- AllowTransitionToSelf: bool = false
- ResetEnds: bool = false
- StateMachineType: int (AnimationNodeStateMachine.StateMachineType) = 0

- **allow_transition_to_self**: If `true`, allows teleport to the self state with `AnimationNodeStateMachinePlayback.travel`. When the reset option is enabled in `AnimationNodeStateMachinePlayback.travel`, the animation is restarted. If `false`, nothing happens on the teleportation to the self state.
- **reset_ends**: If `true`, treat the cross-fade to the start and end nodes as a blend with the RESET animation. In most cases, when additional cross-fades are performed in the parent AnimationNode of the state machine, setting this property to `false` and matching the cross-fade time of the parent AnimationNode and the state machine's start node and end node gives good results.
- **state_machine_type**: This property can define the process of transitions for different use cases. See also `AnimationNodeStateMachine.StateMachineType`.

**Methods:**
- AddNode(StringName name, AnimationNode node, Vector2 position = Vector2(0, 0)) - Adds a new animation node to the graph. The `position` is used for display in the editor.
- AddTransition(StringName from, StringName to, AnimationNodeStateMachineTransition transition) - Adds a transition between the given animation nodes.
- GetGraphOffset() -> Vector2 - Returns the draw offset of the graph. Used for display in the editor.
- GetNode(StringName name) -> AnimationNode - Returns the animation node with the given name.
- GetNodeList() -> StringName[] - Returns a list containing the names of all animation nodes in this state machine.
- GetNodeName(AnimationNode node) -> StringName - Returns the given animation node's name.
- GetNodePosition(StringName name) -> Vector2 - Returns the given animation node's coordinates. Used for display in the editor.
- GetTransition(int idx) -> AnimationNodeStateMachineTransition - Returns the given transition.
- GetTransitionCount() -> int - Returns the number of connections in the graph.
- GetTransitionFrom(int idx) -> StringName - Returns the given transition's start node.
- GetTransitionTo(int idx) -> StringName - Returns the given transition's end node.
- HasNode(StringName name) -> bool - Returns `true` if the graph contains the given animation node.
- HasTransition(StringName from, StringName to) -> bool - Returns `true` if there is a transition between the given animation nodes.
- RemoveNode(StringName name) - Deletes the given animation node from the graph.
- RemoveTransition(StringName from, StringName to) - Deletes the transition between the two specified animation nodes.
- RemoveTransitionByIndex(int idx) - Deletes the given transition by index.
- RenameNode(StringName name, StringName newName) - Renames the given animation node.
- ReplaceNode(StringName name, AnimationNode node) - Replaces the given animation node with a new animation node.
- SetGraphOffset(Vector2 offset) - Sets the draw offset of the graph. Used for display in the editor.
- SetNodePosition(StringName name, Vector2 position) - Sets the animation node's coordinates. Used for display in the editor.

**Enums:**
**StateMachineType:** STATE_MACHINE_TYPE_ROOT=0, STATE_MACHINE_TYPE_NESTED=1, STATE_MACHINE_TYPE_GROUPED=2
  - STATE_MACHINE_TYPE_ROOT: Seeking to the beginning is treated as playing from the start state. Transition to the end state is treated as exiting the state machine.
  - STATE_MACHINE_TYPE_NESTED: Seeking to the beginning is treated as seeking to the beginning of the animation in the current state. Transition to the end state, or the absence of transitions in each state, is treated as exiting the state machine.
  - STATE_MACHINE_TYPE_GROUPED: This is a grouped state machine that can be controlled from a parent state machine. It does not work independently. There must be a state machine with `state_machine_type` of `STATE_MACHINE_TYPE_ROOT` or `STATE_MACHINE_TYPE_NESTED` in the parent or ancestor.

