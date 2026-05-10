using System.Text.RegularExpressions;

namespace Tincture.Tests.Acceptance;

public sealed class EpicBAcceptanceManifestTests
{
    private static readonly string RepoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    private static readonly string[] RequiredFixtures =
    [
        "sim_event_stream_fixture.json",
        "outcome_tincture_scripted_fixture.json",
        "outcome_wolf_seeded_fixture.json",
        "timer_completion_invocation_fixture.json",
        "death_friction_mother_fixed_witness_fixture.json",
        "death_friction_kalev_down_recovery_fixture.json",
        "death_friction_wolf_body_eligibility_fixture.json",
        "verb_invocation_care_combat_fixture.json",
        "encounter_ai_keep_the_line_fixture.json",
        "loot_hooks_wolf_material_fixture.json",
        "progression_notebook_truth_fixture.json"
    ];

    private static readonly string[] RequiredAcceptanceTests =
    [
        // B-prep
        "NoGodotReference_InSubstrateProject",
        "GodotProject_ReferencesSubstrateWithoutCompilingCoreProjects",
        "TinctureTests_ReferenceSubstrateWithoutReferencingGodotProject",

        // B1
        "SimClock_ReplaysFixedTicks",
        "SeededRng_SubSeedsReplayAcrossSystems",
        "SimEventStream_AppendsBatchAtomically",
        "SimEventStream_ReplaysStableJsonFixture",
        "SimEventStream_RingBufferCapacityRolloverIsDeterministic",
        "Determinism_NoPrivateEntropyInSubstrate",

        // B2
        "OutcomeResolver_CareAndCombatSharePath",
        "OutcomeResolver_ScriptedTinctureFixtureStable",
        "OutcomeResolver_SeededWolfAttackFixtureStable",
        "OutcomeResolver_RecordsTypedReceptivityModifier",
        "ModifierAssembler_ComposesInStableOrder",
        "ModifierComposer_AddsAmountsWithNamedRule",
        "ResolverStructure_ExactlyOneProductionOutcomeResolver",
        "ResolverStructure_NoOutcomeResolverImplementationsOutsideSubstrateRules",

        // B3
        "CostLedger_AppliesCareAndCombatCostsThroughOneApi",
        "CostLedgerStructure_OnlyCostLedgerEmitsResourceChangedEvents",
        "ActorState_ResourcesChangeFromEvents",
        "ActorState_DerivedStatsRecomputeFromAuras",
        "AuraSystem_ExpiresByTick",
        "AuraSystem_ComposesModifiersDeterministically",
        "CooldownState_FsrVigilDataRowStartReadyUnavailableReplay",

        // B5a
        "Timers_EmitStartTickCompleteInterrupted",
        "Timers_ReplayWithoutGodotTimerDependency",
        "Timers_CompletionFeedsVerbInvocationFixture",
        "TimerSystemStructure_OnlyTimerSystemEmitsTimerEvents",

        // B3.5
        "DeathFriction_MotherFixedDeathWitnessFixtureReplay",
        "DeathFriction_KalevDownAndRecoveryFixtureReplay",
        "DeathFriction_WolfDeathRecoverableBodyEligibilityReplay",
        "DeathFriction_MoralDeathEventShapeExists",
        "DeathFrictionStructure_OnlyDeathFrictionSystemEmitsDeathFrictionEvents",
        "DeathFrictionStructure_NoGodotOrRuntimeTimersInDeathFriction",

        // B5b
        "VerbDef_RequiresCostDomainTableTimerAndPresenterKey",
        "AbilityAndItemDef_ValidateNestedVerbAndPresenterRows",
        "VerbInvocation_CareAndCombatUseSamePipeline",
        "VerbInvocation_AppendsEventsBeforeApplyingConsequences",
        "VerbInvocation_InvalidDataFailsFast",
        "VerbInvocation_UsesCostLedgerAndModifierAssembler",
        "VerbInvocation_CareCombatFixtureReplayStable",
        "VerbInvocationStructure_OnlyVerbInvocationEmitsInvocationEvents",
        "VerbInvocationStructure_DoesNotEmitTimerOrCooldownEvents",
        "VerbInvocationStructure_UsesConcreteResolverWithoutNewResolverImplementations",

        // B5d
        "DomainPresenter_CoversBedsideCareCombatEconomyAndNotebookSurfaceContracts",
        "DebugPresenter_ProjectsMetadataFromEventTruthOnly",
        "DebugPresenter_SeedFixtureResolverMetadataOnlyWhenPresentInFields",
        "Presenters_DoNotMutateSimEventCollections",
        "Presenters_DoNotMutateSimEventStreamCountOrOrder",
        "PresentationStructure_DoesNotReferenceGameplayMutatorsOrResolvers",
        "PresentationStructure_DoesNotAppendEventsOrEmitSimulationTruth",
        "PresentationStructure_OnlyPresentationEventUsesRawSimEventIngress",

        // B4
        "SpatialContext_HeadlessZonesAndNoiseFeedThreat",
        "DisparityService_ModifiesResolverWithoutOwningOutcome",
        "ThreatTable_TargetsBoyOrKalev",
        "AggroCallFleeRadius_EmitsReplayableEvents",
        "LeashRouteRespawn_ResetAndFrictionHooksReplay",
        "EncounterAiSystem_AppendsB4EventsThroughOneCoordinator",
        "EncounterAiSystem_KeepTheLineFixtureReplayStable",
        "DisparityService_FeedsVerbInvocationModifiers",
        "EncounterAiSystemStructure_OnlyEncounterAiSystemEmitsB4Events",
        "EncounterAiSystemStructure_NoGodotOrRuntimeTimersInB4Code",
        "EncounterAiSystemStructure_NoPrivateEntropyInB4Code",
        "EncounterAiSystemStructure_DoesNotCallOutcomeResolverOrEmitForbiddenConsequenceEvents",
        "EncounterAiSystemStructure_NoDottedB4EventTypesOrFixtureIdBranchesInProduction",
        "EncounterAiSystemStructure_DeathDrivenFrictionAndRespawnRequireSourceDeathEventId",

        // B5c
        "LootHooks_WolfRecoverableBodyEmitsMaterialOutcome",
        "LootHooks_FleeOrLeashCanWithholdMaterialOutcome",
        "LootHooks_DownedWithoutRecoverableBodyWithholdsMaterialOutcome",
        "LootHooks_QualityRarityReplayFromSeed",
        "LootHooks_EligibilityTracesToSourceEvent",
        "LootSystemStructure_OnlyLootSystemEmitsEconomyEvents",
        "LootSystemStructure_NoGodotRuntimeTimersOrPrivateEntropyInEconomyCode",
        "LootSystemStructure_DoesNotSpendResolveOrEmitDeathEncounterEvents",
        "LootSystemStructure_EconomyUsesDeathProjectionRatherThanActorState",

        // B6
        "Progression_ProjectsWitnessRecollectionPathPoints",
        "Progression_DuplicateSourceEventGuard",
        "Notebook_ProjectsNamedEvents",
        "RecognitionSeeds_DeriveFromEvents",
        "NotebookProjector_DoesNotMutateAuthoritativeState",
        "Progression_MetadataPreservesEconomySourceProvenance",
        "RecognitionSeedMetadata_PreservesEconomySourceProvenance",
        "Progression_ProjectionCollectionsAreImmutable",
        "ProgressionFixture_ReplaysStableJson",
        "ProgressionStructure_IsReadOnlyProjectionAndDoesNotMutateOrEmitSimulationTruth"
    ];

    private static readonly string[] RequiredStructuralGuardTests =
    [
        "Determinism_NoPrivateEntropyInSubstrate",
        "ResolverStructure_ExactlyOneProductionOutcomeResolver",
        "ResolverStructure_NoOutcomeResolverImplementationsOutsideSubstrateRules",
        "CostLedgerStructure_OnlyCostLedgerEmitsResourceChangedEvents",
        "TimerSystemStructure_OnlyTimerSystemEmitsTimerEvents",
        "DeathFrictionStructure_OnlyDeathFrictionSystemEmitsDeathFrictionEvents",
        "DeathFrictionStructure_NoGodotOrRuntimeTimersInDeathFriction",
        "VerbInvocationStructure_OnlyVerbInvocationEmitsInvocationEvents",
        "VerbInvocationStructure_DoesNotEmitTimerOrCooldownEvents",
        "VerbInvocationStructure_UsesConcreteResolverWithoutNewResolverImplementations",
        "PresentationStructure_DoesNotReferenceGameplayMutatorsOrResolvers",
        "PresentationStructure_DoesNotAppendEventsOrEmitSimulationTruth",
        "PresentationStructure_OnlyPresentationEventUsesRawSimEventIngress",
        "EncounterAiSystemStructure_OnlyEncounterAiSystemEmitsB4Events",
        "EncounterAiSystemStructure_NoGodotOrRuntimeTimersInB4Code",
        "EncounterAiSystemStructure_NoPrivateEntropyInB4Code",
        "EncounterAiSystemStructure_DoesNotCallOutcomeResolverOrEmitForbiddenConsequenceEvents",
        "EncounterAiSystemStructure_NoDottedB4EventTypesOrFixtureIdBranchesInProduction",
        "EncounterAiSystemStructure_DeathDrivenFrictionAndRespawnRequireSourceDeathEventId",
        "LootSystemStructure_OnlyLootSystemEmitsEconomyEvents",
        "LootSystemStructure_NoGodotRuntimeTimersOrPrivateEntropyInEconomyCode",
        "LootSystemStructure_DoesNotSpendResolveOrEmitDeathEncounterEvents",
        "LootSystemStructure_EconomyUsesDeathProjectionRatherThanActorState",
        "ProgressionStructure_IsReadOnlyProjectionAndDoesNotMutateOrEmitSimulationTruth"
    ];

    [Fact]
    public void EpicBManifest_RequiredFixturesExist()
    {
        var fixturesRoot = Path.Combine(RepoRoot, "Tincture.Tests", "Fixtures");
        var missing = RequiredFixtures
            .Where(fixture => !File.Exists(Path.Combine(fixturesRoot, fixture)))
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(missing);
    }

    [Fact]
    public void EpicBManifest_RequiredAcceptanceTestsArePresent()
    {
        var presentTests = DiscoverXunitTestMethods();
        var missing = RequiredAcceptanceTests
            .Where(testName => !presentTests.Contains(testName))
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(missing);
    }

    [Fact]
    public void EpicBManifest_RequiredStructuralGuardsArePresent()
    {
        var presentTests = DiscoverXunitTestMethods();
        var missing = RequiredStructuralGuardTests
            .Where(testName => !presentTests.Contains(testName))
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(missing);
    }

    [Fact]
    public void EpicBManifest_B0AndEpicCBlockerMetadataRemainIntact()
    {
        var issueSlices = File.ReadAllText(Path.Combine(RepoRoot, "design_system", "v0_9_mercy_rpg_substrate", "ISSUE_SLICES.md"));

        Assert.Contains("blocked_by: [B1, B2, B3, B4, B5, B6]", ExtractIssueYaml(issueSlices, "B0"), StringComparison.Ordinal);

        foreach (var issueId in new[] { "C1", "C2", "C3", "C4", "C5" })
        {
            Assert.Contains("blocked_by: [B0]", ExtractIssueYaml(issueSlices, issueId), StringComparison.Ordinal);
        }
    }

    [Fact]
    public void EpicBManifest_B0GateDoesNotSilentlyEditActiveCanonContract()
    {
        var plan = File.ReadAllText(Path.Combine(RepoRoot, "design_system", "v0_9_mercy_rpg_substrate", "08-epic-b-substrate-pipeline-plan.md"));

        Assert.Contains("Test manifest / acceptance report only.", plan, StringComparison.Ordinal);
        Assert.Contains("create an ADR; do not silently edit `02-substrate-primitives.md`", plan, StringComparison.Ordinal);
        Assert.Contains("Epic C issues remain `blocked_by: [B0]` until this gate is green.", plan, StringComparison.Ordinal);
    }

    private static HashSet<string> DiscoverXunitTestMethods()
    {
        var testRoot = Path.Combine(RepoRoot, "Tincture.Tests");
        var methodPattern = new Regex(
            @"(?ms)^\s*\[(?:Fact|Theory)(?:\([^\]]*\))?\]\s*(?:\r?\n\s*\[[^\]]+\]\s*)*\r?\n\s*public\s+(?:static\s+)?(?:async\s+)?(?:Task|void)\s+(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*\(",
            RegexOptions.CultureInvariant);

        return Directory
            .EnumerateFiles(testRoot, "*.cs", SearchOption.AllDirectories)
            .Where(path => !IsUnderIgnoredBuildDirectory(testRoot, path))
            .SelectMany(path => methodPattern.Matches(File.ReadAllText(path)).Select(match => match.Groups["name"].Value))
            .ToHashSet(StringComparer.Ordinal);
    }

    private static string ExtractIssueYaml(string issueSlices, string issueId)
    {
        var pattern = $@"(?ms)^###\s+{Regex.Escape(issueId)}\b.*?^```yaml\s*(?<yaml>.*?)^```";
        var match = Regex.Match(issueSlices, pattern, RegexOptions.CultureInvariant);

        Assert.True(match.Success, $"Could not find yaml metadata for issue {issueId}.");
        return match.Groups["yaml"].Value;
    }

    private static bool IsUnderIgnoredBuildDirectory(string root, string path)
    {
        var relativeParts = Path.GetRelativePath(root, path)
            .Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

        return relativeParts.Contains("bin", StringComparer.Ordinal)
            || relativeParts.Contains("obj", StringComparer.Ordinal);
    }
}
