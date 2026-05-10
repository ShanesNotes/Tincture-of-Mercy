# Verb invocation is a thin ordered coordinator

Epic B B5b makes `VerbInvocation` the single substrate entry point for
consequential verb execution. It validates verb/ability/item data, checks
runtime eligibility, spends through `CostLedger`, coordinates `TimerSystem` and
`CooldownSystem` as sibling systems, assembles modifiers, calls the one
`OutcomeResolver`, appends primary events through `SimEventStream.AppendBatch`,
then lets `ConsequenceApplier` derive follow-on consequence events from the
appended events.

`ConsequenceApplier` is intentionally narrow in B5b. It derives death/friction
events from appended `outcome_resolved` events when the resolver result data
contains death/friction fields. It does not own encounter AI, loot
materialization, presenters, notebook/progression, or general Witness systems.
Death state remains projected by `DeathFrictionSystem.Project`.

Verb costs and cooldown costs are mutually exclusive within one invocation row.
This avoids double-spending because `CooldownSystem.Start` already applies its
own costs through `CostLedger`. Rows that put positive costs on both the
`VerbDef` and its `CooldownDefinition` fail validation before appending events.

Constraint: B5b must integrate prior substrate systems without becoming a second resolver, second cost mutator, timer/cooldown merger, or death-state owner.
Rejected: Inject `IOutcomeResolver` into `VerbInvocation` | the current structural guard intentionally restricts production resolver implementations/references; concrete `OutcomeResolver` keeps the guard simple for B5b.
Rejected: Derive death/friction consequences before appending resolver events | pre-append events do not have authoritative stream ids for `cause_event_id`.
Rejected: Put positive costs on both verb and cooldown rows in one invocation | it obscures cost ownership and can double-spend through the cooldown path.
Confidence: high
Scope-risk: moderate
Directive: Future B4/B5c/B5d/B6 code should enter consequential actions through `VerbInvocation` or add a new ADR before creating another orchestration path.
Tested: B5b tests cover data validation, shared care/combat invocation path, append-before-consequence ordering, stable replay fixture, modifier assembly, cost-ledger spend ownership, and invocation/timer/cooldown structural boundaries.
Not-tested: Encounter AI/spatial/respawn, loot materialization, presenters, and notebook/progression remain future slices.
