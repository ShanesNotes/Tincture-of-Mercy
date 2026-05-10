# B0 Substrate Acceptance Report — Epic B

Status: **PASS**
Date: 2026-05-10
Gate scope: Epic B B0 hard substrate acceptance gate only; no opening-scene content, Godot UI, production substrate behavior, or mechanic broadening.

## 1. Scope and source anchors

B0 validates the already-built B-prep through B6 substrate slices. The B0 write scope is limited to this report plus the executable acceptance manifest:

- `design_system/v0_9_mercy_rpg_substrate/08-epic-b-substrate-pipeline-plan.md:417-439` — B0 dependencies, write scope, acceptance, and verification.
- `design_system/v0_9_mercy_rpg_substrate/08-epic-b-substrate-pipeline-plan.md:441-445` — required structural guard aliases.
- `design_system/v0_9_mercy_rpg_substrate/ACCEPTANCE.md:20-58` — substrate-before-opening gate and primitive evidence matrix.
- `design_system/v0_9_mercy_rpg_substrate/ISSUE_SLICES.md:103-118` — B0 issue metadata.
- `design_system/v0_9_mercy_rpg_substrate/ISSUE_SLICES.md:253-329` — C1-C5 remain blocked by B0.
- `design_system/v0_9_mercy_rpg_substrate/PRD.md:49-59` — M1 substrate core mechanics before opening implementation.

Latest committed Epic B spine at verification time:

```text
dea8107 Project memory without mutating event truth
235fbff Project event truth without mutating simulation state
214a504 Make material rewards replay from source events
9c6fc9f Make protection geometry replayable before encounter content
32b6470 Unify verb execution before encounter AI
2226ad9 Name death state as a sideband projection
47c7457 Make death friction replayable before encounter AI
2a3378a Seal timer boundaries before death and verb slices
80cb413 Make timers event-sourced before verb invocation
d5aa93e Close the last loose B3 modifier enum boundary
4c46f3a Seal B3 event domains before presenter layering
cf2216c Make actor costs and auras replayable before encounters
```

## 2. Command evidence

| Command | Result | Evidence summary |
|---|---:|---|
| `dotnet test Tincture.Tests/Tincture.Tests.csproj --filter EpicBManifest --nologo` | PASS | 5 passed, 0 failed. |
| `dotnet test Tincture.Tests/Tincture.Tests.csproj --nologo` | PASS | 140 passed, 0 failed. |
| `dotnet build Tincture.Substrate/Tincture.Substrate.csproj --nologo` | PASS | Build succeeded, 0 warnings, 0 errors. |
| `dotnet build Tincture-of-Mercy.csproj --nologo` | PASS | Godot C# project build succeeded, 0 warnings, 0 errors. |
| `python3 design_system/tools/anti_drift.py --mode all --root design_system` | PASS | `anti_drift: clean.` |
| `git diff --check` | PASS | No whitespace/error output. |

## 3. Executable manifest

New manifest: `Tincture.Tests/Acceptance/EpicBAcceptanceManifestTests.cs`

Manifest tests:

- `EpicBManifest_RequiredFixturesExist`
- `EpicBManifest_RequiredAcceptanceTestsArePresent`
- `EpicBManifest_RequiredStructuralGuardsArePresent`
- `EpicBManifest_B0AndEpicCBlockerMetadataRemainIntact`
- `EpicBManifest_B0GateDoesNotSilentlyEditActiveCanonContract`

The manifest uses filesystem checks only. It discovers real xUnit methods by pairing `[Fact]` / `[Theory]` attributes with public test method declarations, so comments or prose-only mentions do not satisfy B0.

## 4. Slice evidence matrix

| Slice | Contract expectation | Status | Evidence |
|---|---|---:|---|
| B-prep | Plain C# substrate and test/Godot project boundaries are separated. | PASS | `NoGodotReference_InSubstrateProject`; `GodotProject_ReferencesSubstrateWithoutCompilingCoreProjects`; `TinctureTests_ReferenceSubstrateWithoutReferencingGodotProject`. |
| B1 | Fixed tick, seeded RNG/sub-seeds, atomic event append, stable JSON replay, deterministic ring rollover, and no private entropy. | PASS | `SimClock_ReplaysFixedTicks`; `SeededRng_SubSeedsReplayAcrossSystems`; `SimEventStream_AppendsBatchAtomically`; `SimEventStream_ReplaysStableJsonFixture`; `SimEventStream_RingBufferCapacityRolloverIsDeterministic`; `Determinism_NoPrivateEntropyInSubstrate`. |
| B2 | Care/combat share one resolver family; scripted/seeded fixtures preserve metadata; typed receptivity and deterministic modifier composition are required. | PASS | `OutcomeResolver_CareAndCombatSharePath`; `OutcomeResolver_ScriptedTinctureFixtureStable`; `OutcomeResolver_SeededWolfAttackFixtureStable`; `OutcomeResolver_RecordsTypedReceptivityModifier`; `ModifierAssembler_ComposesInStableOrder`; `ModifierComposer_AddsAmountsWithNamedRule`; `ResolverStructure_ExactlyOneProductionOutcomeResolver`; `ResolverStructure_NoOutcomeResolverImplementationsOutsideSubstrateRules`. |
| B3 | Actor resources, costs, auras, derived stats, and generic cooldowns replay from events through shared APIs. | PASS | `CostLedger_AppliesCareAndCombatCostsThroughOneApi`; `CostLedgerStructure_OnlyCostLedgerEmitsResourceChangedEvents`; `ActorState_ResourcesChangeFromEvents`; `ActorState_DerivedStatsRecomputeFromAuras`; `AuraSystem_ExpiresByTick`; `AuraSystem_ComposesModifiersDeterministically`; `CooldownState_FsrVigilDataRowStartReadyUnavailableReplay`. |
| B5a | Timers are event-sourced and headless; start/tick/complete/interrupted lifecycle remains independent from Godot timers and cooldown ownership. | PASS | `Timers_EmitStartTickCompleteInterrupted`; `Timers_ReplayWithoutGodotTimerDependency`; `Timers_CompletionFeedsVerbInvocationFixture`; `TimerSystemStructure_OnlyTimerSystemEmitsTimerEvents`. |
| B3.5 | Death/friction/moral-death substrate replays mother fixed-death Witness, Kalev down/recovery, wolf body eligibility, and sole-emitter/headless boundaries. | PASS | `DeathFriction_MotherFixedDeathWitnessFixtureReplay`; `DeathFriction_KalevDownAndRecoveryFixtureReplay`; `DeathFriction_WolfDeathRecoverableBodyEligibilityReplay`; `DeathFriction_MoralDeathEventShapeExists`; `DeathFrictionStructure_OnlyDeathFrictionSystemEmitsDeathFrictionEvents`; `DeathFrictionStructure_NoGodotOrRuntimeTimersInDeathFriction`. |
| B5b | Verb/ability/item data validation and care/combat invocation share one pipeline with append-before-consequence order and existing cost/modifier/resolver seams. | PASS | `VerbDef_RequiresCostDomainTableTimerAndPresenterKey`; `AbilityAndItemDef_ValidateNestedVerbAndPresenterRows`; `VerbInvocation_CareAndCombatUseSamePipeline`; `VerbInvocation_AppendsEventsBeforeApplyingConsequences`; `VerbInvocation_InvalidDataFailsFast`; `VerbInvocation_UsesCostLedgerAndModifierAssembler`; `VerbInvocation_CareCombatFixtureReplayStable`; `VerbInvocationStructure_OnlyVerbInvocationEmitsInvocationEvents`; `VerbInvocationStructure_DoesNotEmitTimerOrCooldownEvents`; `VerbInvocationStructure_UsesConcreteResolverWithoutNewResolverImplementations`. |
| B5d | Presentation surfaces read event truth without mutating event stream, ActorState, or gameplay truth; debug/domain presenter coverage is present. | PASS | `DomainPresenter_CoversBedsideCareCombatEconomyAndNotebookSurfaceContracts`; `DebugPresenter_ProjectsMetadataFromEventTruthOnly`; `DebugPresenter_SeedFixtureResolverMetadataOnlyWhenPresentInFields`; `Presenters_DoNotMutateSimEventCollections`; `Presenters_DoNotMutateSimEventStreamCountOrOrder`; `PresentationStructure_DoesNotReferenceGameplayMutatorsOrResolvers`; `PresentationStructure_DoesNotAppendEventsOrEmitSimulationTruth`; `PresentationStructure_OnlyPresentationEventUsesRawSimEventIngress`. |
| B4 | Keep-the-Line encounter AI is headless and deterministic; spatial/threat/disparity/aggro/flee/leash/respawn use one B4 coordinator and feed B5b modifiers without owning outcomes. | PASS | `SpatialContext_HeadlessZonesAndNoiseFeedThreat`; `DisparityService_ModifiesResolverWithoutOwningOutcome`; `ThreatTable_TargetsBoyOrKalev`; `AggroCallFleeRadius_EmitsReplayableEvents`; `LeashRouteRespawn_ResetAndFrictionHooksReplay`; `EncounterAiSystem_AppendsB4EventsThroughOneCoordinator`; `EncounterAiSystem_KeepTheLineFixtureReplayStable`; `DisparityService_FeedsVerbInvocationModifiers`; `EncounterAiSystemStructure_OnlyEncounterAiSystemEmitsB4Events`; `EncounterAiSystemStructure_NoGodotOrRuntimeTimersInB4Code`; `EncounterAiSystemStructure_NoPrivateEntropyInB4Code`; `EncounterAiSystemStructure_DoesNotCallOutcomeResolverOrEmitForbiddenConsequenceEvents`; `EncounterAiSystemStructure_NoDottedB4EventTypesOrFixtureIdBranchesInProduction`; `EncounterAiSystemStructure_DeathDrivenFrictionAndRespawnRequireSourceDeathEventId`. |
| B5c | Loot/material consequences derive from source events and encounter/death projection; eligibility, withholding, quality/rarity replay, and provenance are covered. | PASS | `LootHooks_WolfRecoverableBodyEmitsMaterialOutcome`; `LootHooks_FleeOrLeashCanWithholdMaterialOutcome`; `LootHooks_DownedWithoutRecoverableBodyWithholdsMaterialOutcome`; `LootHooks_QualityRarityReplayFromSeed`; `LootHooks_EligibilityTracesToSourceEvent`; `LootSystemStructure_OnlyLootSystemEmitsEconomyEvents`; `LootSystemStructure_NoGodotRuntimeTimersOrPrivateEntropyInEconomyCode`; `LootSystemStructure_DoesNotSpendResolveOrEmitDeathEncounterEvents`; `LootSystemStructure_EconomyUsesDeathProjectionRatherThanActorState`. |
| B6 | Progression/notebook/recognition truth derives from events, preserves economy provenance, guards duplicate source events, and stays read-only. | PASS | `Progression_ProjectsWitnessRecollectionPathPoints`; `Progression_DuplicateSourceEventGuard`; `Notebook_ProjectsNamedEvents`; `RecognitionSeeds_DeriveFromEvents`; `NotebookProjector_DoesNotMutateAuthoritativeState`; `Progression_MetadataPreservesEconomySourceProvenance`; `RecognitionSeedMetadata_PreservesEconomySourceProvenance`; `Progression_ProjectionCollectionsAreImmutable`; `ProgressionFixture_ReplaysStableJson`; `ProgressionStructure_IsReadOnlyProjectionAndDoesNotMutateOrEmitSimulationTruth`. |

## 5. Structural guard matrix

| Guard / invariant | Status | Current executable evidence |
|---|---:|---|
| One production outcome resolver. | PASS | `ResolverStructure_ExactlyOneProductionOutcomeResolver`; `ResolverStructure_NoOutcomeResolverImplementationsOutsideSubstrateRules`. |
| Plan alias `Randomness_NoPrivateRandomInSubstrate`. | Equivalent PASS | Current hardened guard is `Determinism_NoPrivateEntropyInSubstrate`, which also blocks common non-RNG entropy sources. |
| CostLedger is the sole resource-change emitter. | PASS | `CostLedgerStructure_OnlyCostLedgerEmitsResourceChangedEvents`. |
| TimerSystem is the sole timer-event emitter. | PASS | `TimerSystemStructure_OnlyTimerSystemEmitsTimerEvents`. |
| DeathFriction is the sole death/friction event emitter and remains headless. | PASS | `DeathFrictionStructure_OnlyDeathFrictionSystemEmitsDeathFrictionEvents`; `DeathFrictionStructure_NoGodotOrRuntimeTimersInDeathFriction`. |
| VerbInvocation is the sole invocation event emitter and does not emit timer/cooldown truth. | PASS | `VerbInvocationStructure_OnlyVerbInvocationEmitsInvocationEvents`; `VerbInvocationStructure_DoesNotEmitTimerOrCooldownEvents`; `VerbInvocationStructure_UsesConcreteResolverWithoutNewResolverImplementations`. |
| Plan alias `Presenter_DoesNotMutateActorStateOrEventStream`. | Equivalent PASS | Current guards split the invariant: `Presenters_DoNotMutateSimEventCollections`; `Presenters_DoNotMutateSimEventStreamCountOrOrder`; `PresentationStructure_DoesNotReferenceGameplayMutatorsOrResolvers`; `PresentationStructure_DoesNotAppendEventsOrEmitSimulationTruth`; `PresentationStructure_OnlyPresentationEventUsesRawSimEventIngress`. |
| Encounter AI does not fork timers, entropy, resolver, or consequence ownership. | PASS | `EncounterAiSystemStructure_OnlyEncounterAiSystemEmitsB4Events`; `EncounterAiSystemStructure_NoGodotOrRuntimeTimersInB4Code`; `EncounterAiSystemStructure_NoPrivateEntropyInB4Code`; `EncounterAiSystemStructure_DoesNotCallOutcomeResolverOrEmitForbiddenConsequenceEvents`; `EncounterAiSystemStructure_NoDottedB4EventTypesOrFixtureIdBranchesInProduction`; `EncounterAiSystemStructure_DeathDrivenFrictionAndRespawnRequireSourceDeathEventId`. |
| Economy does not spend resources, resolve outcomes, or own death/encounter truth. | PASS | `LootSystemStructure_OnlyLootSystemEmitsEconomyEvents`; `LootSystemStructure_NoGodotRuntimeTimersOrPrivateEntropyInEconomyCode`; `LootSystemStructure_DoesNotSpendResolveOrEmitDeathEncounterEvents`; `LootSystemStructure_EconomyUsesDeathProjectionRatherThanActorState`. |
| Progression/notebook projections are read-only. | PASS | `ProgressionStructure_IsReadOnlyProjectionAndDoesNotMutateOrEmitSimulationTruth`; `NotebookProjector_DoesNotMutateAuthoritativeState`. |

## 6. Stable fixture matrix

| Fixture | Status | Covered by |
|---|---:|---|
| `sim_event_stream_fixture.json` | PASS | `SimEventStream_ReplaysStableJsonFixture`; B0 manifest fixture check. |
| `outcome_tincture_scripted_fixture.json` | PASS | `OutcomeResolver_ScriptedTinctureFixtureStable`; B0 manifest fixture check. |
| `outcome_wolf_seeded_fixture.json` | PASS | `OutcomeResolver_SeededWolfAttackFixtureStable`; B0 manifest fixture check. |
| `timer_completion_invocation_fixture.json` | PASS | `Timers_CompletionFeedsVerbInvocationFixture`; B0 manifest fixture check. |
| `death_friction_mother_fixed_witness_fixture.json` | PASS | `DeathFriction_MotherFixedDeathWitnessFixtureReplay`; B0 manifest fixture check. |
| `death_friction_kalev_down_recovery_fixture.json` | PASS | `DeathFriction_KalevDownAndRecoveryFixtureReplay`; B0 manifest fixture check. |
| `death_friction_wolf_body_eligibility_fixture.json` | PASS | `DeathFriction_WolfDeathRecoverableBodyEligibilityReplay`; B0 manifest fixture check. |
| `verb_invocation_care_combat_fixture.json` | PASS | `VerbInvocation_CareCombatFixtureReplayStable`; B0 manifest fixture check. |
| `encounter_ai_keep_the_line_fixture.json` | PASS | `EncounterAiSystem_KeepTheLineFixtureReplayStable`; B0 manifest fixture check. |
| `loot_hooks_wolf_material_fixture.json` | PASS | `LootHooks_WolfRecoverableBodyEmitsMaterialOutcome`; B0 manifest fixture check. |
| `progression_notebook_truth_fixture.json` | PASS | `ProgressionFixture_ReplaysStableJson`; B0 manifest fixture check. |

## 7. Epic C blocker check

| Issue | Required blocker state | Status | Evidence |
|---|---|---:|---|
| B0 | `blocked_by: [B1, B2, B3, B4, B5, B6]` | PASS | `ISSUE_SLICES.md:103-118`; `EpicBManifest_B0AndEpicCBlockerMetadataRemainIntact`. |
| C1 | `blocked_by: [B0]` | PASS | `ISSUE_SLICES.md:253-266`; `EpicBManifest_B0AndEpicCBlockerMetadataRemainIntact`. |
| C2 | `blocked_by: [B0]` | PASS | `ISSUE_SLICES.md:268-282`; `EpicBManifest_B0AndEpicCBlockerMetadataRemainIntact`. |
| C3 | `blocked_by: [B0]` | PASS | `ISSUE_SLICES.md:284-297`; `EpicBManifest_B0AndEpicCBlockerMetadataRemainIntact`. |
| C4 | `blocked_by: [B0]` | PASS | `ISSUE_SLICES.md:299-313`; `EpicBManifest_B0AndEpicCBlockerMetadataRemainIntact`. |
| C5 | `blocked_by: [B0]` | PASS | `ISSUE_SLICES.md:315-329`; `EpicBManifest_B0AndEpicCBlockerMetadataRemainIntact`. |

## 8. Gap / ADR section

None.

No missing B-prep through B6 evidence was found. No active-canon contract change was made. No ADR was required for B0.

## 9. Dirty-tree / scope hygiene

B0-owned files:

- `Tincture.Tests/Acceptance/EpicBAcceptanceManifestTests.cs`
- `design_system/v0_9_mercy_rpg_substrate/B0_SUBSTRATE_ACCEPTANCE_REPORT.md`

Pre-existing unrelated working-tree changes were present before B0 and are not part of this gate commit:

```text
 M README.md
 M design_system/v0_9_combat_rpg_layer/INDEX.md
 M design_system/v0_9_mercy_rpg_substrate/09-naming-conventions.md
 M design_system/v0_9_mercy_rpg_substrate/INDEX.md
 M design_system/v0_9_mercy_rpg_substrate/prompts/00-master-template.md
 M design_system/v0_9_mercy_rpg_substrate/prompts/01a-kalev-pass1-locomotion.md
 M docs/lore/tincture_of_mercy_godot_design_handoff_v0_7.md
?? .claude/
?? .codex/
?? art/
?? art_direction_review.html
?? audio/
?? concept_packet.html
?? data/
?? design_system/v0_9_mercy_rpg_substrate/10-asset-pipeline.md
?? design_system/v0_9_mercy_rpg_substrate/prompts/01a-kalev-pass1a-idle-down-only.md
?? docs/source/2026-05-10-ai-options-briefing.html
?? fonts/
?? icon.svg.import
?? omx_wiki/
?? project.godot
?? scenes/
?? scripts/
?? shaders/
?? tests/
?? themes/
?? tools/
```

Staging/commit instruction: stage only the two B0-owned files above.

## 10. Next allowed stage

After this B0 PASS report is committed, the next allowed stage is Epic C / opening-slice planning or execution. B0 does not itself begin opening content.
