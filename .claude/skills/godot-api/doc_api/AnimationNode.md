## AnimationNode <- Resource

Base resource for AnimationTree nodes. In general, it's not used directly, but you can create custom ones with custom blending formulas. Inherit this when creating animation nodes mainly for use in AnimationNodeBlendTree, otherwise AnimationRootNode should be used instead. You can access the time information as read-only parameter which is processed and stored in the previous frame for all nodes except AnimationNodeOutput. **Note:** If multiple inputs exist in the AnimationNode, which time information takes precedence depends on the type of AnimationNode.

**Props:**
- FilterEnabled: bool

- **filter_enabled**: If `true`, filtering is enabled.

**Methods:**
- GetCaption() -> string - When inheriting from AnimationRootNode, implement this virtual method to override the text caption for this animation node.
- GetChildByName(StringName name) -> AnimationNode - When inheriting from AnimationRootNode, implement this virtual method to return a child animation node by its `name`.
- GetChildNodes() -> Godot.Collections.Dictionary - When inheriting from AnimationRootNode, implement this virtual method to return all child animation nodes in order as a `name: node` dictionary.
- GetParameterDefaultValue(StringName parameter) -> Variant - When inheriting from AnimationRootNode, implement this virtual method to return the default value of a `parameter`. Parameters are custom local memory used for your animation nodes, given a resource can be reused in multiple trees.
- GetParameterList() -> Godot.Collections.Array - When inheriting from AnimationRootNode, implement this virtual method to return a list of the properties on this animation node. Parameters are custom local memory used for your animation nodes, given a resource can be reused in multiple trees. Format is similar to `Object.get_property_list`.
- HasFilter() -> bool - When inheriting from AnimationRootNode, implement this virtual method to return whether the blend tree editor should display filter editing on this animation node.
- IsParameterReadOnly(StringName parameter) -> bool - When inheriting from AnimationRootNode, implement this virtual method to return whether the `parameter` is read-only. Parameters are custom local memory used for your animation nodes, given a resource can be reused in multiple trees.
- Process(float time, bool seek, bool isExternalSeeking, bool testOnly) -> float - When inheriting from AnimationRootNode, implement this virtual method to run some code when this animation node is processed. The `time` parameter is a relative delta, unless `seek` is `true`, in which case it is absolute. Here, call the `blend_input`, `blend_node` or `blend_animation` functions. You can also use `get_parameter` and `set_parameter` to modify local memory. This function should return the delta.
- AddInput(string name) -> bool - Adds an input to the animation node. This is only useful for animation nodes created for use in an AnimationNodeBlendTree. If the addition fails, returns `false`.
- BlendAnimation(StringName animation, float time, float delta, bool seeked, bool isExternalSeeking, float blend, int loopedFlag = 0) - Blends an animation by `blend` amount (name must be valid in the linked AnimationPlayer). A `time` and `delta` may be passed, as well as whether `seeked` happened. A `looped_flag` is used by internal processing immediately after the loop.
- BlendInput(int inputIndex, float time, bool seek, bool isExternalSeeking, float blend, int filter = 0, bool sync = true, bool testOnly = false) -> float - Blends an input. This is only useful for animation nodes created for an AnimationNodeBlendTree. The `time` parameter is a relative delta, unless `seek` is `true`, in which case it is absolute. A filter mode may be optionally passed.
- BlendNode(StringName name, AnimationNode node, float time, bool seek, bool isExternalSeeking, float blend, int filter = 0, bool sync = true, bool testOnly = false) -> float - Blend another animation node (in case this animation node contains child animation nodes). This function is only useful if you inherit from AnimationRootNode instead, otherwise editors will not display your animation node for addition.
- FindInput(string name) -> int - Returns the input index which corresponds to `name`. If not found, returns `-1`.
- GetInputCount() -> int - Amount of inputs in this animation node, only useful for animation nodes that go into AnimationNodeBlendTree.
- GetInputName(int input) -> string - Gets the name of an input by index.
- GetParameter(StringName name) -> Variant - Gets the value of a parameter. Parameters are custom local memory used for your animation nodes, given a resource can be reused in multiple trees.
- GetProcessingAnimationTreeInstanceId() -> int - Returns the object id of the AnimationTree that owns this node. **Note:** This method should only be called from within the `AnimationNodeExtension._process_animation_node` method, and will return an invalid id otherwise.
- IsPathFiltered(NodePath path) -> bool - Returns `true` if the given path is filtered.
- IsProcessTesting() -> bool - Returns `true` if this animation node is being processed in test-only mode.
- RemoveInput(int index) - Removes an input, call this only when inactive.
- SetFilterPath(NodePath path, bool enable) - Adds or removes a path for the filter.
- SetInputName(int input, string name) -> bool - Sets the name of the input at the given `input` index. If the setting fails, returns `false`.
- SetParameter(StringName name, Variant value) - Sets a custom parameter. These are used as local memory, because resources can be reused across the tree or scenes.

**Signals:**
- AnimationNodeRemoved(int objectId, string name) - Emitted by nodes that inherit from this class and that have an internal tree when one of their animation nodes removes. The animation nodes that emit this signal are AnimationNodeBlendSpace1D, AnimationNodeBlendSpace2D, AnimationNodeStateMachine, and AnimationNodeBlendTree.
- AnimationNodeRenamed(int objectId, string oldName, string newName) - Emitted by nodes that inherit from this class and that have an internal tree when one of their animation node names changes. The animation nodes that emit this signal are AnimationNodeBlendSpace1D, AnimationNodeBlendSpace2D, AnimationNodeStateMachine, and AnimationNodeBlendTree.
- NodeUpdated(int objectId) - Emitted by AnimationNodeAnimation when its `AnimationNodeAnimation.animation` resource is changed, or by AnimationNodeBlendTree when its connections change.
- TreeChanged - Emitted by nodes that inherit from this class and that have an internal tree when one of their animation nodes changes. The animation nodes that emit this signal are AnimationNodeBlendSpace1D, AnimationNodeBlendSpace2D, AnimationNodeStateMachine, AnimationNodeBlendTree and AnimationNodeTransition.

**Enums:**
**FilterAction:** FILTER_IGNORE=0, FILTER_PASS=1, FILTER_STOP=2, FILTER_BLEND=3
  - FILTER_IGNORE: Do not use filtering.
  - FILTER_PASS: Paths matching the filter will be allowed to pass.
  - FILTER_STOP: Paths matching the filter will be discarded.
  - FILTER_BLEND: Paths matching the filter will be blended (by the blend value).

