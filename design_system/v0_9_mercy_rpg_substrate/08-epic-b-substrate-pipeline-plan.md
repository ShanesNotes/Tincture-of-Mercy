# Epic B — Pipeline-Shaped Substrate Core Plan

Status: active Ralph execution handoff; approved by Architect/Critic review on 2026-05-10
Scope: Epic B only; no Epic C opening act scene/content implementation
Authority: implementation sequencing handoff for Epic B; active canon remains `design_system/v0_9_mercy_rpg_substrate/`
Primary anchors: `02-substrate-primitives.md`, `ACCEPTANCE.md`, `04-latent-paths-receptivity.md`, ADRs 0001/0009/0010/0011
Stop boundary: Epic C stays `blocked_by: [B0]` until all required Epic B tests and acceptance pass

## Ralph execution summary

### Principles

1. **Pipeline over slices.** Every consequential action enters the same substrate pipeline: verb invocation, cost, timing, modifier assembly, resolver, event append, consequence projection.
2. **One event truth.** `SimEventStream` is the authoritative record; projectors and presenters read it without owning outcome state.
3. **One resolver family.** Combat tables are resolver data; care/combat/craft/witness/path checks do not create separate resolver engines.
4. **Deterministic headless proof.** Seeds, JSON fixtures, append order, and structural guards make replay divergence visible in tests.
5. **First-class RPG combat under shared substrate.** Threat, damage, death/downing, loot/material consequence, respawn/friction hooks, and progression are supported where scoped.

### Top decision drivers

1. Prevent quiet care/combat forks at the exact seams where systems meet: RNG, verb dispatch, modifier assembly, cost spend, event append, presenters.
2. Make the headless-test promise real by separating the plain C# substrate from the Godot assembly before implementation.
3. Keep Epic B complete enough for the full-substrate-before-opening gate without turning every later tuning detail into immediate content work.

### Viable options

#### Option A — Keep the original B1-B6 graph and add notes

Pros:
- Minimal planning churn.
- Easier to compare with `ISSUE_SLICES.md` labels.
- Faster to begin coding.

Cons:
- Leaves cross-cutting seams implicit.
- B5 remains an artificial bottleneck.
- Makes fork-prevention aspirational rather than enforced.

#### Option B — Split every primitive into a standalone issue

Pros:
- Directly mirrors all 17 primitives in `02-substrate-primitives.md`.
- Simple checklist coverage.

Cons:
- Too many micro-issues before any executable pipeline exists.
- Increases coordination overhead.
- Can obscure the action flow that must stay unified.

#### Chosen option — Pipeline graph with named anti-fracture seams

Keep Epic B labels, but revise the graph around the shared pipeline and split only the overloaded sections. This preserves B0/B1/B2/B3/B4/B5/B6 continuity while adding explicit sub-slices for deterministic RNG, verb invocation, modifier assembly, cost ledger, death/friction, presenters, and loot hooks.

## Substrate action pipeline

Canonical flow:

```text
Godot input / AI / fixture
  -> VerbInvocation
  -> CostLedger
  -> Timer/Cooldown
  -> ModifierAssembler
  -> OutcomeResolver
  -> SimEventStream.AppendBatch
  -> ConsequenceApplier
  -> Projectors / Presenters
```

Pipeline invariants:
- Care, combat, craft, Witness, economy, and path/receptivity checks use this same flow when they are consequential actions.
- `OutcomeResolver` may return proposed events, but one substrate-owned invocation point appends them atomically.
- Consequences are applied in a documented order from source events; callers do not mutate authoritative state around the pipeline.
- Presenters/projectors run after event truth exists and must be read-only against authoritative state.

## Proposed build layout

B-prep creates a plain C# substrate library and a test project before B1 begins:

```text
Tincture.Substrate/
  Tincture.Substrate.csproj        # Microsoft.NET.Sdk, no Godot dependency
  Sim/
  Events/
  Rules/
  Actors/
  Combat/
  Data/
  Progression/
  Presentation/

Tincture.Tests/
  Tincture.Tests.csproj            # references Tincture.Substrate
  Fixtures/
  Sim/
  Events/
  Rules/
  Actors/
  Combat/
  Data/
  Progression/
  Presentation/

Tincture-of-Mercy.csproj           # Godot.NET.Sdk; references Tincture.Substrate after B-prep
```

Headless rule: `Tincture.Substrate` must not reference Godot. Godot nodes bridge into the substrate later; they do not define substrate truth.

## Revised slice graph

```text
B-prep
  -> B1 Deterministic foundation
  -> B2 Resolver spine
  -> { B3 Actor/cost/aura/cooldown, B5a Timers }
  -> { B3.5 Death/friction, B5b Verb/data invocation, B5d Presenter base }
  -> { B4 Encounter AI/spatial/respawn, B5c Loot hooks }
  -> B6 Progression + notebook
  -> B0 Hard acceptance gate
```

## Implementation slices

### B-prep — Headless substrate/test scaffold

Dependencies: docs canon commit and current Godot scaffold.

Write scope:
- `Tincture.Substrate/Tincture.Substrate.csproj`
- `Tincture.Tests/Tincture.Tests.csproj`
- `Tincture-of-Mercy.csproj` project reference to substrate
- optional solution file if useful

Acceptance:
- `Tincture.Substrate` uses plain `Microsoft.NET.Sdk` and has no Godot dependency.
- `Tincture.Tests` references only the substrate library for core tests.
- Godot project can reference the substrate without moving substrate truth into scene scripts.
- Runtime scaffold commit remains separate from substrate behavior if not already versioned.

Verification:
- `dotnet build Tincture.Substrate/Tincture.Substrate.csproj`
- `dotnet test Tincture.Tests/Tincture.Tests.csproj` with an initial smoke test
- `dotnet build Tincture-of-Mercy.csproj` when Godot SDK is available

### B1 — Deterministic foundation: `SimClock`, `SeededRng`, `SimEventStream`

Dependencies: B-prep.

Write scope:
- `Tincture.Substrate/Sim/*`
- `Tincture.Substrate/Events/*`
- `Tincture.Tests/Sim/*`
- `Tincture.Tests/Events/*`
- `Tincture.Tests/Fixtures/*.json`

Required primitives/seams:
- `SimClock`
- `SeededRng` with root seed and named/per-stream sub-seeds
- `SimEvent`
- `SimEventStream.AppendBatch(IEnumerable<SimEvent>)`
- stable JSON replay fixture format

Acceptance:
- Tick progression, pause/resume, time scale, and replay seed capture are deterministic.
- All systems consume `SeededRng` or deterministic sub-seeds; no slice may instantiate private randomness.
- `SimEvent` includes stable identity, tick, actor, optional target/location, verb, domain, source system, fields/cost/result metadata, and tags.
- `AppendBatch` appends ordered event groups atomically; callers do not interleave consequence writes between events in the same resolved action.
- JSON replay uses snake_case field names and stable serialization order for fixtures.

Tests:
- `SimClock_ReplaysFixedTicks`
- `SeededRng_SubSeedsReplayAcrossSystems`
- `SimEventStream_AppendsBatchAtomically`
- `SimEventStream_ReplaysStableJsonFixture`
- `SimEventStream_RingBufferCapacityRolloverIsDeterministic`

### B2 — Resolver spine: `OutcomeResolver`, typed receptivity, modifier assembly

Dependencies: B1.

Write scope:
- `Tincture.Substrate/Rules/*`
- `Tincture.Substrate/Data/ReceptivityProfile.cs`
- `Tincture.Substrate/Data/RegisterMatchModifier.cs`
- `Tincture.Tests/Rules/*`
- `Tincture.Tests/Data/*`

Required primitives/seams:
- `IOutcomeResolver` and one implementation
- `OutcomeRequest` / `ResolvedOutcome`
- `OutcomeTable` data rows for care, combat, craft, and witness outcomes; combat does not get a separate table type or resolver engine
- `ReceptivityProfile`
- typed `LatentPath`, `voice_register`, `ReceptivityProfile`, and `register_match_modifier` derived from path state plus scene/prior tags
- `ModifierAssembler`
- additive `ModifierComposer` v1 seam (`modifier_composer.additive.v1`)

Acceptance:
- Care, craft, combat, witness, and path/receptivity checks use one resolver family.
- Exactly one production `IOutcomeResolver` implementation exists unless a later ADR changes the architecture.
- Receptivity/profile data is required in B2; resolver calls that use receptivity record `receptivity_profile_id` and typed `register_match_modifier`.
- `ModifierAssembler` deterministically orders auras, receptivity/path/register, disparity, and other modifiers by source event id, modifier id, then source id.
- `ModifierComposer` applies additive composition for B2 and records its rule id in resolver metadata.
- Scripted fixtures and seeded rolls both record resolver metadata.

Tests:
- `OutcomeResolver_CareAndCombatSharePath`
- `OutcomeResolver_ScriptedTinctureFixtureStable`
- `OutcomeResolver_SeededWolfAttackFixtureStable`
- `OutcomeResolver_RecordsTypedReceptivityModifier`
- `ModifierAssembler_ComposesInStableOrder`
- `ResolverStructure_ExactlyOneProductionOutcomeResolver`

### B3 — Actor state, `CostLedger`, auras, generic cooldowns

Dependencies: B1, B2.

Write scope:
- `Tincture.Substrate/Actors/*`
- `Tincture.Substrate/Rules/CostLedger.cs`
- `Tincture.Tests/Actors/*`
- `Tincture.Tests/Rules/CostLedgerTests.cs`

Required primitives/seams:
- `ActorState`, `StatBlock`, `DerivedStats`
- `ResourceProfile`: Health, Spirit, Steady, Burden, Pressure, Numbness
- `CostLedger`
- `AuraSystem`
- generic `CooldownState`; FSR/Vigil as data row, not special-case code

Acceptance:
- Resource spends and deltas happen through `CostLedger`; care/combat/craft verbs do not spend resources directly.
- Actor state/resource changes are event-derived and replayable.
- Aura add/refresh/stack/expire emits events and contributes deterministic modifiers through `ModifierAssembler`.
- Generic cooldowns emit start/ready/unavailable events and support FSR/Vigil self-use cost/consequence as data.

Tests:
- `CostLedger_AppliesCareAndCombatCostsThroughOneApi`
- `ActorState_ResourcesChangeFromEvents`
- `ActorState_DerivedStatsRecomputeFromAuras`
- `AuraSystem_ExpiresByTick`
- `AuraSystem_ComposesModifiersDeterministically`
- `CooldownState_FsrVigilDataRowStartReadyUnavailableReplay`

### B5a — Timer suite

Dependencies: B1. Can run parallel to B2 after B1 is stable, but must integrate with B5b before B0.

Write scope:
- `Tincture.Substrate/Sim/Timers/*` or `Tincture.Substrate/Rules/Timers/*`
- `Tincture.Tests/Sim/Timers/*`

Acceptance:
- GCD, work/cast/channel, swing, and rite pulse timers emit start/tick/complete/interrupted events.
- Timer results are deterministic under `SimClock` and do not require Godot timers.
- Timer completion can be consumed by `VerbInvocation` in B5b.

Tests:
- `Timers_EmitStartTickCompleteInterrupted`
- `Timers_ReplayWithoutGodotTimerDependency`
- `Timers_CompletionFeedsVerbInvocationFixture`

### B3.5 — Death/friction/moral death substrate

Dependencies: B1, B2, B3.

Write scope:
- `Tincture.Substrate/Consequences/DeathFriction/*` or `Tincture.Substrate/Actors/DeathFriction.cs`
- `Tincture.Tests/Consequences/DeathFriction/*`

Acceptance:
- Death, downing, recovery, Witness hooks, moral death, and consequence tags are event-backed.
- Mother fixed-death fixture can be represented as substrate consequence data without implementing Epic C scene content.
- Kalev down/death and wolf death fixtures emit recoverable/body eligibility fields where applicable.
- Moral death is named and event-shaped even if later content tunes exact cases.

Tests:
- `DeathFriction_MotherFixedDeathWitnessFixtureReplay`
- `DeathFriction_KalevDownAndRecoveryFixtureReplay`
- `DeathFriction_WolfDeathRecoverableBodyEligibilityReplay`
- `DeathFriction_MoralDeathEventShapeExists`

### B5b — Verb/data invocation pipeline

Dependencies: B1, B2, B3, B5a.

Write scope:
- `Tincture.Substrate/Data/VerbDef.cs`
- `Tincture.Substrate/Data/AbilityDef.cs`
- `Tincture.Substrate/Data/ItemDef.cs`
- `Tincture.Substrate/Rules/VerbInvocation.cs`
- `Tincture.Substrate/Rules/ConsequenceApplier.cs`
- `Tincture.Tests/Data/*`
- `Tincture.Tests/Rules/VerbInvocationTests.cs`

Required anti-fracture seam:
- `VerbInvocation` owns order: validate data and eligibility -> cost check/spend through `CostLedger` -> timer/cooldown -> assemble modifiers -> call `OutcomeResolver` -> append batch -> apply consequences from events -> return projection hooks.

Acceptance:
- `VerbDef`/`AbilityDef` declare costs, domains, resolver table, tags, timer/cooldown ids, presenter keys, and optional item requirements.
- Invalid verb rows fail data validation.
- Care and combat fixture verbs use the same invocation path.
- Event append order relative to consequence application is documented and tested.

Tests:
- `VerbDef_RequiresCostDomainTableTimerAndPresenterKey`
- `VerbInvocation_CareAndCombatUseSamePipeline`
- `VerbInvocation_AppendsEventsBeforeApplyingConsequences` or equivalent chosen order test
- `VerbInvocation_InvalidDataFailsFast`
- `VerbInvocation_UsesCostLedgerAndModifierAssembler`

### B5d — Presenter base and debug/domain projections

Dependencies: B1, B2. Can run parallel after resolver/event shape stabilizes.

Write scope:
- `Tincture.Substrate/Presentation/*`
- `Tincture.Tests/Presentation/*`

Acceptance:
- Presenter base contracts cover debug, bedside/care, combat, economy, and later notebook surfaces.
- Presenters read events and projection inputs; they do not mutate `ActorState`, resource ledgers, resolver state, or event stream.
- Debug presenter shows seed, fixture id, resolver metadata, cost/result/tags, and data row ids.

Tests:
- `Presenter_ReadsEventTruthOnly`
- `Presenter_DoesNotMutateActorStateOrEventStream`
- `DebugPresenter_ProjectsResolverAndSeedMetadata`

### B4 — Encounter AI: spatial context, disparity, threat, aggro/call/flee, leash/respawn

Dependencies: B1, B2, B3, B3.5. May consume B5b invocation fixtures when available.

Write scope:
- `Tincture.Substrate/Combat/*`
- `Tincture.Substrate/World/SpatialContext.cs`
- `Tincture.Substrate/World/SpatialTypes.cs`
- `Tincture.Tests/Combat/*`
- `Tincture.Tests/World/*`
- `Tincture.Tests/Fixtures/encounter_ai_keep_the_line_fixture.json`

Required primitives/seams:
- Minimal `SpatialContext` with zones/grid coordinates/noise/line-of-attention sufficient for headless tests; no Godot `Vector2` dependency.
- `DisparityService`
- `AttentionThreatTable`
- `AggroCallFleeRadius`
- Leash/route/respawn state

Acceptance:
- Disparity computes risk/mismatch modifiers but does not own final outcomes.
- Threat can target Kalev or the boy using proximity, boy position, noise, wounds, movement, and prior events.
- Aggro/call/flee/leash/respawn events are replayable and do not require scene-local state.
- Respawn/friction hooks are named and event-shaped even where later content tunes final route behavior.
- `EncounterAiSystem` is the only B4 append coordinator for non-consequential encounter events.
- Consequential attacks remain routed through B5b `VerbInvocation`; B4 only returns intent/modifier inputs.
- Death/down-driven encounter friction and respawn read through `DeathFrictionSystem.Project(stream.Events)` and record `source_death_event_id` from `DeathFrictionState.LastEventId`.
- B4 event types are snake_case: `spatial_band_changed`, `threat_target_changed`, `aggro_entered`, `aggro_exited`, `pack_call_emitted`, `flee_initiated`, `leash_triggered`, `route_node_reached`, `encounter_friction_requested`, `encounter_respawn_reset`.

Tests:
- `SpatialContext_HeadlessZonesAndNoiseFeedThreat`
- `DisparityService_ModifiesResolverWithoutOwningOutcome`
- `ThreatTable_TargetsBoyOrKalev`
- `AggroCallFleeRadius_EmitsReplayableEvents`
- `LeashRouteRespawn_ResetAndFrictionHooksReplay`
- `EncounterAiSystem_AppendsB4EventsThroughOneCoordinator`
- `EncounterAiSystem_KeepTheLineFixtureReplayStable`
- `DisparityService_FeedsVerbInvocationModifiers`
- `EncounterAiSystemStructure_*`

### B5c — Loot hooks and material consequence

Dependencies: B1, B2, B3, B3.5, B5b; B4 for encounter-source examples.

Write scope:
- `Tincture.Substrate/Data/LootTableDef.cs`
- `Tincture.Substrate/Economy/*`
- `Tincture.Tests/Economy/*`

Acceptance:
- Loot eligibility derives from source events: death/down/flee/leash/recoverable body/context.
- Item/material events include item id, quality, rarity, quantity, loot table, source actor, and eligibility reason.
- Wolf death/recoverable body can produce material consequence through events; wolf flee/leash may resolve encounter without material recovery.
- Loot uses `SeededRng` or scripted fixture metadata for replay.

Tests:
- `LootHooks_WolfRecoverableBodyEmitsMaterialOutcome`
- `LootHooks_FleeOrLeashCanWithholdMaterialOutcome`
- `LootHooks_QualityRarityReplayFromSeed`
- `LootHooks_EligibilityTracesToSourceEvent`

### B6 — Progression and notebook truth surface

Dependencies: B1, B2, B3, B3.5, B5d; B5c for economy projections where used.

Write scope:
- `Tincture.Substrate/Progression/*`
- `Tincture.Substrate/Presentation/NotebookProjector.cs`
- `Tincture.Tests/Progression/*`
- `Tincture.Tests/Presentation/NotebookProjectorTests.cs`

Acceptance:
- Witness, Recollection, Vocation/path points, and optional XP-style/debug projections derive from events.
- Duplicate source-event guards prevent double counting.
- Notebook is a specialized presenter/projector over named events and actor/person records.
- Recognition seeds are event-derived: bread, name, presence, witness, protection, notebook/person records.

Tests:
- `Progression_ProjectsWitnessRecollectionPathPoints`
- `Progression_DuplicateSourceEventGuard`
- `Notebook_ProjectsNamedEvents`
- `RecognitionSeeds_DeriveFromEvents`
- `NotebookProjector_DoesNotMutateAuthoritativeState`

### B0 — Hard substrate acceptance gate

Dependencies: all required B-prep, B1, B2, B3, B3.5, B4, B5a, B5b, B5c, B5d, B6 tests and acceptance.

Write scope:
- Test manifest / acceptance report only.
- If implementation reveals active-canon contract changes, create an ADR; do not silently edit `02-substrate-primitives.md` from the gate ticket.

Acceptance:
- All required Epic B acceptance criteria and tests pass.
- Accepted gaps keep B0 blocked unless a later explicit scope-changing ADR revises Epic B.
- Event replay proves care and combat through one stream.
- Resolver tests prove tincture/care and wolf/combat through one resolver family.
- VerbInvocation tests prove care/combat use the same action pipeline.
- Structural tests prove one production `IOutcomeResolver` implementation and presenter read-only behavior.
- Epic C issues remain `blocked_by: [B0]` until this gate is green.

Verification:
- `dotnet test Tincture.Tests/Tincture.Tests.csproj`
- `dotnet build Tincture.Substrate/Tincture.Substrate.csproj`
- `dotnet build Tincture-of-Mercy.csproj` when Godot SDK is available
- `python3 design_system/tools/anti_drift.py --mode all --root design_system` if docs are touched
- Manual review of Epic C issue metadata if issue docs change

## Required structural guards

- `ResolverStructure_ExactlyOneProductionOutcomeResolver`: fails if more than one production resolver implementation appears without ADR.
- `Randomness_NoPrivateRandomInSubstrate`: fails if substrate systems instantiate private randomness outside `SeededRng` seams.
- `Presenter_DoesNotMutateActorStateOrEventStream`: fixture state byte-equal or equivalent after presenter projection.
- `NoGodotReference_InSubstrateProject`: substrate project remains headless.
- `VerbInvocation_CareAndCombatUseSamePipeline`: care and combat fixtures enter through the same dispatcher.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Cross-cutting seams become implicit again. | Name `SeededRng`, `VerbInvocation`, `ModifierAssembler`, and `CostLedger` as required slices/tests. |
| B5 split creates coordination overhead. | Keep B5a/B5d parallel after B1/B2; B5b is the integration point; B5c waits for death/loot eligibility. |
| Event append/consequence order diverges by caller. | `AppendBatch` atomicity and `VerbInvocation` order tests own this. |
| FSR/Vigil becomes hand-coded. | Generic cooldown state; FSR/Vigil as data row fixture. |
| Death/friction waits on wolf AI. | B3.5 owns care/combat death fixtures before B4 encounter AI. |
| Spatial tests pull Godot types into substrate. | Minimal headless `SpatialContext`; structural no-Godot reference guard. |
| Presenters mutate state. | Static/runtime read-only invariant test. |
| Implementation changes active canon silently. | B0 emits ADR for contract changes; docs edits are not hidden inside gate. |

## ADR

Decision: revise Epic B from a slice checklist into a deterministic substrate action pipeline with explicit anti-fracture seams.

Drivers:
- The one-event-truth and one-resolver commitments fail at seams, not at isolated classes.
- Headless determinism requires owned seed propagation, event append atomicity, and a plain C# substrate boundary.
- Full substrate before opening content requires death/friction, respawn, presenters, progression, and loot hooks to be named before B0.

Alternatives considered:
- Keep B1-B6 unchanged and add implementation notes: rejected because it leaves fork-prone seams implicit.
- Split all 17 primitives into separate issues: rejected because it increases overhead and weakens the shared pipeline picture.
- Scene-first graybox: rejected because it invites scene-local state and care/combat forks before the substrate exists.

Why chosen:
- The revised graph preserves the successful B1 -> B2 -> B3 spine, adds missing seam ownership, and splits only overloaded areas.

Consequences:
- B-prep becomes mandatory before substrate behavior work.
- B5 becomes four named sub-slices.
- B3.5 separates death/friction from encounter AI.
- Future agents get stronger tests before they can accidentally fork care/combat paths.

Follow-ups:
- Convert this plan into tracked docs or issues before execution if durable handoff is needed.
- Execute B-prep and B1/B2 sequentially before parallel team work.
- Review after B2 implementation because event/resolver/invocation contracts will become concrete.

## Available agent roster and staffing

Available role types: `planner`, `architect`, `critic`, `explore`, `executor`, `test-engineer`, `verifier`, `code-reviewer`, `writer`.

### Ralph path

Recommended when API coherence matters more than throughput.

Order:
1. B-prep
2. B1
3. B2
4. B3 + B5a
5. B3.5 + B5b + B5d
6. B4 + B5c
7. B6
8. B0

Reasoning levels:
- B-prep/B1/B2/B5b: high
- B3/B3.5/B4/B5c/B6: medium-high
- B5a/B5d: medium

### Team path

Use only after B1/B2 are stable.

Suggested staffing:
- Executor lane A: B3 Actor/Cost/Aura/Cooldown.
- Executor lane B: B5a Timers then B5d Presenters.
- Executor lane C: B3.5 Death/friction then B5c Loot.
- Executor lane D: B4 Encounter AI/Spatial/Respawn.
- Test-engineer/verifier: owns structural guards and B0 manifest.

Launch hint:
- `$team "Implement Epic B after B1/B2 are complete using .omx/plans/epic-b-substrate-pipeline-consensus-plan.md; keep write scopes disjoint and preserve one-event-truth/one-resolver invariants."`

Team verification path:
- Shared CI command is `dotnet test Tincture.Tests/Tincture.Tests.csproj`.
- Each lane must provide fixture evidence and structural guard status.
- Verifier owns B0 report and rejects accepted gaps.

## Goal-mode follow-up suggestions

- `$ultragoal` is the best durable follow-up: create goals for B-prep, B1, B2, B3, B5a, B3.5, B5b, B5d, B4, B5c, B6, B0.
- `$ralph` is best for B-prep through B2 if we want one owner on the foundational contracts.
- `$team` becomes attractive after B2 because write scopes can be split without redefining the core contracts.

## Stop condition

This planning cycle is complete when Architect and Critic approve this revised plan or when required changes are incorporated and re-reviewed.
