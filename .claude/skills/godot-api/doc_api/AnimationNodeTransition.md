## AnimationNodeTransition <- AnimationNodeSync

Simple state machine for cases which don't require a more advanced AnimationNodeStateMachine. Animations can be connected to the inputs and transition times can be specified. After setting the request and changing the animation playback, the transition node automatically clears the request on the next process frame by setting its `transition_request` value to empty. **Note:** When using a cross-fade, `current_state` and `current_index` change to the next state immediately after the cross-fade begins.

**Props:**
- AllowTransitionToSelf: bool = false
- InputCount: int = 0
- XfadeCurve: Curve
- XfadeTime: float = 0.0

- **allow_transition_to_self**: If `true`, allows transition to the self state. When the reset option is enabled in input, the animation is restarted. If `false`, nothing happens on the transition to the self state.
- **input_count**: The number of enabled input ports for this animation node.
- **xfade_curve**: Determines how cross-fading between animations is eased. If empty, the transition will be linear. Should be a unit Curve.
- **xfade_time**: Cross-fading time (in seconds) between each animation connected to the inputs. **Note:** AnimationNodeTransition transitions the current state immediately after the start of the fading. The precise remaining time can only be inferred from the main animation. When AnimationNodeOutput is considered as the most upstream, so the `xfade_time` is not scaled depending on the downstream delta. See also `AnimationNodeOneShot.fadeout_time`.

**Methods:**
- IsInputLoopBrokenAtEnd(int input) -> bool - Returns whether the animation breaks the loop at the end of the loop cycle for transition.
- IsInputReset(int input) -> bool - Returns whether the animation restarts when the animation transitions from the other animation.
- IsInputSetAsAutoAdvance(int input) -> bool - Returns `true` if auto-advance is enabled for the given `input` index.
- SetInputAsAutoAdvance(int input, bool enable) - Enables or disables auto-advance for the given `input` index. If enabled, state changes to the next input after playing the animation once. If enabled for the last input state, it loops to the first.
- SetInputBreakLoopAtEnd(int input, bool enable) - If `true`, breaks the loop at the end of the loop cycle for transition, even if the animation is looping.
- SetInputReset(int input, bool enable) - If `true`, the destination animation is restarted when the animation transitions.

