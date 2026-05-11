using Tincture.Substrate.Data;
using Tincture.Substrate.Events;
using Tincture.Tests.Support;

namespace Tincture.Tests.Data;

public sealed class ActCatalogTests
{
    [Fact]
    public void ActCatalog_GetActBeatAndAllActsExposeReadOnlyDefinitions()
    {
        var catalog = ActCatalog.PreludeArchitectureCatalog();

        var act = catalog.GetAct("architecture_prelude");
        var beat = catalog.GetBeat("architecture_prelude", "ledger_material_smoke");

        Assert.Single(catalog.AllActs);
        Assert.Equal("act.architecture_prelude.title", act.TitleKey);
        Assert.Equal(SimDomain.Economy, beat.Domain);
        Assert.Equal(["bread"], beat.RequiredItemIds);
        Assert.Equal("architecture_test_rows_only", act.Metadata["content_status"]);
    }

    [Fact]
    public void ActCatalog_InvalidRowsFailFast()
    {
        Assert.Throws<InvalidOperationException>(() => new ActCatalog([]));
        Assert.Throws<InvalidOperationException>(() => new ActCatalog([
            new ActDef
            {
                ActId = "duplicate",
                TitleKey = "title.one",
                Beats = [new ActBeatDef { BeatId = "a", RuntimeKey = "runtime.a", Domain = SimDomain.Care }]
            },
            new ActDef
            {
                ActId = "duplicate",
                TitleKey = "title.two",
                Beats = [new ActBeatDef { BeatId = "b", RuntimeKey = "runtime.b", Domain = SimDomain.Care }]
            }
        ]));
        Assert.Throws<InvalidOperationException>(() => new ActDef
        {
            ActId = "act",
            TitleKey = "title",
            Beats =
            [
                new ActBeatDef { BeatId = "same", RuntimeKey = "runtime.a", Domain = SimDomain.Care },
                new ActBeatDef { BeatId = "same", RuntimeKey = "runtime.b", Domain = SimDomain.Care }
            ]
        }.Validate());
    }

    [Fact]
    public void ActCatalogStructure_OpeningContentLivesInNamedFactory()
    {
        var source = File.ReadAllText(Path.Combine(StructureGuard.SubstrateRoot, "Data", "ActCatalog.cs"));

        Assert.Contains("OpeningCabinPrologueCatalog", source, StringComparison.Ordinal);
        Assert.Contains("wolf_01", source, StringComparison.Ordinal);
        Assert.Contains("anna", source, StringComparison.Ordinal);
        Assert.Contains("iiro", source, StringComparison.Ordinal);
        Assert.DoesNotContain("mother_01", source, StringComparison.Ordinal);
        Assert.DoesNotContain("child_01", source, StringComparison.Ordinal);
    }
}
