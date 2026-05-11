using Tincture.Tests.Support;

namespace Tincture.Tests.Acceptance;

public sealed class EpicCOpeningActManifestTests
{
    private static readonly string[] RequiredFiles =
    [
        ".omx/plans/epic-c-opening-act-vertical-slice-consensus-plan.md",
        ".omx/plans/prd-epic-c-opening-act-vertical-slice.md",
        ".omx/plans/test-spec-epic-c-opening-act-vertical-slice.md",
        "design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md",
        "design_system/v0_9_mercy_rpg_substrate/EPIC_C_OPENING_ACT_REPORT.md",
        "Tincture.Tests/Fixtures/opening_act_water_bread_fixture.json",
        "Tincture.Tests/Fixtures/opening_act_tincture_fixture.json",
        "Tincture.Tests/Fixtures/opening_act_mother_witness_fixture.json",
        "Tincture.Tests/Fixtures/opening_act_wolves_hold_line_fixture.json",
        "Tincture.Tests/Fixtures/opening_act_wolves_kalev_falls_fixture.json",
        "Tincture.Tests/Fixtures/opening_act_cabin_prologue_fixture.json"
    ];

    [Fact]
    public void EpicCOpeningActManifest_RequiredArtifactsExist()
    {
        var missing = RequiredFiles
            .Where(relativePath => !File.Exists(Path.Combine(StructureGuard.RepoRoot, relativePath)))
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(missing);
    }

    [Fact]
    public void EpicCOpeningActManifest_PlanCarriesLoreBindingDecisions()
    {
        var plan = File.ReadAllText(Path.Combine(StructureGuard.RepoRoot, ".omx", "plans", "epic-c-opening-act-vertical-slice-consensus-plan.md"));
        var bible = File.ReadAllText(Path.Combine(StructureGuard.RepoRoot, "design_system", "v0_9_mercy_rpg_substrate", "03-opening-act-bible.md"));

        Assert.Contains("`kalev`", plan, StringComparison.Ordinal);
        Assert.Contains("`anna`", plan, StringComparison.Ordinal);
        Assert.Contains("`iiro`", plan, StringComparison.Ordinal);
        Assert.Contains("`wolf_01`, `wolf_02`, `wolf_03`", plan, StringComparison.Ordinal);
        Assert.Contains("act.wolves_hold_line", plan, StringComparison.Ordinal);
        Assert.Contains("act.mother_witness", plan, StringComparison.Ordinal);
        Assert.True(plan.IndexOf("act.wolves_hold_line", StringComparison.Ordinal) < plan.IndexOf("act.mother_witness", StringComparison.Ordinal));
        Assert.Contains("audio_cue=long_pour_resolve", plan, StringComparison.Ordinal);
        Assert.Contains("world.cross_threshold", plan, StringComparison.Ordinal);
        Assert.Contains("Hesychasm presence", plan, StringComparison.Ordinal);
        Assert.Contains("Iconographic threshold", plan, StringComparison.Ordinal);
        Assert.Contains("Anna (`anna`)", bible, StringComparison.Ordinal);
        Assert.Contains("Iiro (`iiro`)", bible, StringComparison.Ordinal);
        Assert.Contains("Bread", bible, StringComparison.Ordinal);
    }

    [Fact]
    public void EpicCOpeningActManifest_SubstrateGatesStillExist()
    {
        var anchors = new[]
        {
            "design_system/v0_9_mercy_rpg_substrate/B0_SUBSTRATE_ACCEPTANCE_REPORT.md",
            "design_system/v0_9_mercy_rpg_substrate/ARCHITECTURE_DEEPENING_PRELUDE_REPORT.md",
            "Tincture.Substrate/Runtime/OpeningActRuntime.cs",
            "Tincture.Substrate/ReadModels/OpeningActSnapshotProjector.cs"
        };

        var missing = anchors
            .Where(relativePath => !File.Exists(Path.Combine(StructureGuard.RepoRoot, relativePath)))
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(missing);
    }
}
