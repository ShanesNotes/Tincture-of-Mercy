using Tincture.Substrate.Data;
using Tincture.Substrate.Events;
using Tincture.Tests.Support;

namespace Tincture.Tests.Data;

public sealed class OpeningActCatalogTests
{
    [Fact]
    public void OpeningActCatalog_DeclaresNamedCastAndChronologicalBeats()
    {
        var act = ActCatalog.OpeningCabinPrologueCatalog().GetAct("opening.cabin_prologue");
        var beatIds = act.Beats.Select(beat => beat.BeatId).ToList();

        Assert.Equal([
            "act.cinematic_two_breaths",
            "act.water",
            "act.bread",
            "act.tincture",
            "act.wolves_hold_line",
            "act.mother_witness",
            "act.borrowed_mercy_depart"
        ], beatIds);
        Assert.Equal("kalev,anna,iiro,wolf_01,wolf_02,wolf_03", act.Metadata["actor_ids"]);
        Assert.Contains("long_pour_resolve", act.Metadata["audio_cues"], StringComparison.Ordinal);
        Assert.Equal("world.cross_threshold", act.Metadata["threshold_verb_id"]);
        Assert.Equal(SimDomain.Combat, act.Beats.Single(beat => beat.BeatId == "act.wolves_hold_line").Domain);
        Assert.Equal(SimDomain.Witness, act.Beats.Single(beat => beat.BeatId == "act.mother_witness").Domain);
    }

    [Fact]
    public void OpeningActCatalog_UsesBreadAndDoesNotResurrectOldLabels()
    {
        var act = ActCatalog.OpeningCabinPrologueCatalog().GetAct("opening.cabin_prologue");
        var serialized = string.Join('\n', act.Beats.SelectMany(beat => new[] { beat.BeatId, beat.RuntimeKey }.Concat(beat.RequiredItemIds).Concat(beat.Tags)))
            + string.Join('\n', act.Metadata.Values)
            + string.Join('\n', act.Tags);

        Assert.Contains("bread", serialized, StringComparison.Ordinal);
        Assert.DoesNotContain("porridge", serialized, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("mother", act.Metadata["actor_ids"], StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("child", act.Metadata["actor_ids"], StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void OpeningActCatalogStructure_DoesNotDependOnGodot()
    {
        var offenders = StructureGuard.FilesContainingAny(Path.Combine(StructureGuard.SubstrateRoot, "Data"), ["Godot."]);

        Assert.Empty(offenders);
    }
}
