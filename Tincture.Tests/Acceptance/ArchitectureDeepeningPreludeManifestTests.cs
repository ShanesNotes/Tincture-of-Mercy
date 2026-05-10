using Tincture.Tests.Support;

namespace Tincture.Tests.Acceptance;

public sealed class ArchitectureDeepeningPreludeManifestTests
{
    private static readonly string[] GateFiles =
    [
        "Tincture.Tests/Support/StructureGuard.cs",
        "Tincture.Substrate/Runtime/OpeningActRuntime.cs",
        "Tincture.Substrate/Data/ActCatalog.cs",
        "Tincture.Substrate/Economy/ItemLedger.cs",
        "Tincture.Substrate/Events/SimEventVocabulary.cs",
        "Tincture.Substrate/ReadModels/OpeningActSnapshot.cs",
        "design_system/v0_9_mercy_rpg_substrate/ARCHITECTURE_DEEPENING_PRELUDE_REPORT.md",
        "docs/adr/0016-post-b0-architecture-prelude-gate.md"
    ];

    private static readonly string[] RequiredPreludeTests =
    [
        "StructureGuard_FindsRepoRootsAndCSharpSources",
        "OpeningActRuntime_TickCoordinatesEncounterLootAndSnapshotWithoutOwningAppendAuthority",
        "OpeningActRuntimeStructure_DoesNotCallAppendBatch",
        "OpeningActRuntimeStructure_OnlyUsesAuthorizedAppendCoordinators",
        "ActCatalog_GetActBeatAndAllActsExposeReadOnlyDefinitions",
        "ItemLedger_ProjectsBreadUseAndWolfMaterialFromEventTruth",
        "ItemLedgerStructure_NoPresentationInventoryTruth",
        "SimEventVocabulary_RegistersProducerOwnedEventConstants",
        "EventVocabularyStructure_NoAdHocEventStringsOutsideVocabulary",
        "OpeningActSnapshot_ProjectsCrossModuleAggregateOnly",
        "ReadModelsStructure_AdaptersDoNotOwnSnapshots"
    ];

    [Fact]
    public void ArchitectureDeepeningPreludeManifest_GateFilesExist()
    {
        var missing = GateFiles
            .Where(relativePath => !File.Exists(Path.Combine(StructureGuard.RepoRoot, relativePath)))
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(missing);
    }

    [Fact]
    public void ArchitectureDeepeningPreludeManifest_B0SemanticsRemainUnchanged()
    {
        var issueSlices = File.ReadAllText(Path.Combine(StructureGuard.RepoRoot, "design_system", "v0_9_mercy_rpg_substrate", "ISSUE_SLICES.md"));

        Assert.Contains("blocked_by: [B1, B2, B3, B4, B5, B6]", issueSlices, StringComparison.Ordinal);
        Assert.Contains("blocked_by: [B0]", issueSlices, StringComparison.Ordinal);
        Assert.DoesNotContain("blocked_by: [architecture_deepening_prelude]", issueSlices, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ArchitectureDeepeningPreludeManifest_ADRAndReportRecordTieredGate()
    {
        var adr = File.ReadAllText(Path.Combine(StructureGuard.RepoRoot, "docs", "adr", "0016-post-b0-architecture-prelude-gate.md"));
        var report = File.ReadAllText(Path.Combine(StructureGuard.RepoRoot, "design_system", "v0_9_mercy_rpg_substrate", "ARCHITECTURE_DEEPENING_PRELUDE_REPORT.md"));

        Assert.Contains("structural guard harness", adr, StringComparison.Ordinal);
        Assert.Contains("runtime / tick coordination", adr, StringComparison.Ordinal);
        Assert.Contains("Act Data Catalog", adr, StringComparison.Ordinal);
        Assert.Contains("Item Ledger / inventory projection", adr, StringComparison.Ordinal);
        Assert.Contains("hard Epic-C blockers", adr, StringComparison.Ordinal);
        Assert.Contains("No Epic C authored content", report, StringComparison.Ordinal);
        Assert.Contains("No change to B0 blocker semantics", report, StringComparison.Ordinal);
    }

    [Fact]
    public void ArchitectureDeepeningPreludeManifest_RequiredTestsArePresent()
    {
        var testSource = string.Join('\n', StructureGuard.CSharpFiles(StructureGuard.TestsRoot).Select(File.ReadAllText));
        var missing = RequiredPreludeTests
            .Where(testName => !testSource.Contains($"void {testName}", StringComparison.Ordinal))
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(missing);
    }
}
