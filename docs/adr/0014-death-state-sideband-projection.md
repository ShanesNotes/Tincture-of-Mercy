# Death state is a sideband consequence projection

Epic B B3.5 keeps death/friction state out of `ActorState`. Actor resources,
auras, and cooldowns remain projected by `ActorState.Apply(SimEvent)`;
death, downing, recovery, body eligibility, and moral death are projected by
`DeathFrictionSystem.Project(stream.Events)`.

This keeps consequence-layer data such as `BodyEligibility`, `FrictionRuleId`,
`WitnessHook`, and death-specific consequence tags from becoming a permanent
dimension of the general actor-state projection.

`witness_hook_recorded` is scoped to death/friction in B3.5. It records a
death/friction-sourced handoff for later progression, notebook, or presenter
consumers. General non-death Witness progression should get its own B6-era
owner or a later ADR before using `DeathFrictionSystem.RecordWitness` as a
catch-all witness API.

For B3.5, `consequence_tags` in event fields are the stable
death/friction-specific payload for projection and fixture assertions. The event
`Tags` list remains the routing/filtering surface and includes those consequence
tags plus system/domain/kind tags emitted by `DeathFrictionSystem`.

Constraint: B3.5 must preserve one-event truth while avoiding ActorState growth and avoiding B4/B5c/B6 ownership decisions.
Rejected: Add `DeathState` directly to `ActorState` | it mixes consequence projection fields into the general actor/resource/aura/cooldown projection.
Rejected: Treat `DeathFrictionSystem.RecordWitness` as the general Witness progression API | B6 has not defined general Witness/Recollection projection ownership yet.
Confidence: high
Scope-risk: narrow
Directive: B4, B5c, and B6 should consume death/friction events through `DeathFrictionSystem.Project` or direct event queries; do not add parallel death fields to `ActorState` without a new ADR.
Tested: Death/friction tests cover sideband projection, byte-stable fixtures, domain tags, sole-emitter guards, and no loot-event emission.
Not-tested: B4 respawn/friction tuning, B5c loot materialization, and B6 Witness/Recollection projection are future slices.
