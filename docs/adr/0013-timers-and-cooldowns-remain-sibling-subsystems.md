# Timers and cooldowns remain sibling event systems

Epic B B5a keeps `TimerSystem` focused on deterministic timer lifecycle events:
`timer_started`, `timer_tick`, `timer_completed`, and `timer_interrupted`.
Generic cooldown state remains owned by `CooldownSystem`, including
`cooldown_started`, `cooldown_ready`, and `cooldown_unavailable`.

B5b `VerbInvocation` will coordinate the two sibling subsystems by appending timer
events, re-projecting timer state, and invoking cooldown behavior at the chosen
pipeline seam. Timers may carry a `completion_consumer` and `completion_key` for
that future handoff, but they do not emit cooldown readiness events.

Constraint: B5a must preserve headless determinism, one-event truth, and no Godot timer dependency while preparing the B5b timer handoff.
Rejected: Emit `cooldown_ready` from timer completion | it duplicates cooldown ownership and makes timer completion indistinguishable from cooldown state readiness.
Rejected: Route all cooldown timing through `TimerSystem` | it collapses sibling event families before B5b defines the invocation order.
Confidence: high
Scope-risk: narrow
Directive: Future timer work should emit only timer lifecycle events unless a later ADR intentionally changes the Timer/Cooldown boundary.
Tested: Timer tests cover start/tick/complete/interrupted events, stable replay fixture output, no timer runtime dependency, and a structural guard that only `TimerSystem` emits timer events.
Not-tested: B5b `VerbInvocation` integration and cooldown-ready scheduling remain future slices.
