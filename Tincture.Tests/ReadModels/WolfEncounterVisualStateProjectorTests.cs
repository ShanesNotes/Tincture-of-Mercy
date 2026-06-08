using Tincture.Substrate.Events;
using Tincture.Substrate.ReadModels;

namespace Tincture.Tests.ReadModels;

public sealed class WolfEncounterVisualStateProjectorTests
{
    [Fact]
    public void WolfEncounterVisualState_ProjectsSafePathThreatDamageLootAndIiroVictory()
    {
        var stream = Load("opening_act_wolves_hold_line_fixture.json");

        var visual = new WolfEncounterVisualStateProjector().Project(stream.Events);

        Assert.Equal("opening.wolves_yard", visual.EncounterId);
        Assert.Equal("iiro_safe", visual.ObjectiveState);
        Assert.Equal("yard_holds_resolve_safe", visual.ActiveAudioCue);
        Assert.Equal("iiro.escape", visual.IiroRouteState);
        Assert.Equal("woodline", visual.IiroRouteNode);
        Assert.Equal("safe", visual.IiroAnimationRow);
        Assert.True(visual.IiroSafe);
        Assert.False(visual.KalevDowned);
        Assert.True(visual.HasWolfLoot);
        Assert.True(visual.HasWithheldLoot);

        var wolf01 = visual.Wolves["wolf_01"];
        Assert.Equal("dead", wolf01.AnimationRow);
        Assert.Equal("dead", wolf01.ThreatState);
        Assert.Equal("kalev", wolf01.CurrentTargetId);
        Assert.Equal("iiro", wolf01.PreviousTargetId);
        Assert.Equal("taunt_and_damage", wolf01.ThreatReason);
        Assert.Equal(4, wolf01.DamageTaken);
        Assert.Equal(8, wolf01.ThreatDelta);
        Assert.True(wolf01.IsDead);
        Assert.True(wolf01.BodyRecoverable);
        Assert.True(wolf01.LootReady);
        Assert.Equal("wolf_hide", wolf01.LootItemId);
        Assert.Equal(1, wolf01.LootQuantity);

        var wolf02 = visual.Wolves["wolf_02"];
        Assert.Equal("flee", wolf02.AnimationRow);
        Assert.Equal("leashed", wolf02.ThreatState);
        Assert.True(wolf02.IsLeashed);
        Assert.True(wolf02.LootWithheld);
        Assert.Equal("source_actor_leashed", wolf02.LootWithheldReason);
        Assert.False(wolf02.LootReady);

        var loot = Assert.Single(visual.Loot);
        Assert.Equal("wolf_01", loot.SourceActorId);
        Assert.Equal("wolf_hide", loot.ItemId);
        Assert.Equal(1, loot.Quantity);
        Assert.Equal("evt-00000006", loot.SourceEventId);
        Assert.Equal(10, visual.SourceEventIds.Count);
    }

    [Fact]
    public void WolfEncounterVisualState_ProjectsFallenPathAsRecoverableFailure()
    {
        var stream = Load("opening_act_wolves_kalev_falls_fixture.json");

        var visual = new WolfEncounterVisualStateProjector().Project(stream.Events);

        Assert.Equal("opening.wolves_yard", visual.EncounterId);
        Assert.Equal("kalev_fallen", visual.ObjectiveState);
        Assert.Equal("yard_holds_resolve_fallen", visual.ActiveAudioCue);
        Assert.False(visual.IiroSafe);
        Assert.True(visual.KalevDowned);
        Assert.True(visual.KalevRecoverable);
        Assert.False(visual.KalevRecovered);
        Assert.False(visual.HasWolfLoot);

        var wolf01 = visual.Wolves["wolf_01"];
        Assert.Equal("alert", wolf01.AnimationRow);
        Assert.Equal("aggro", wolf01.ThreatState);
        Assert.Equal("iiro", wolf01.CurrentTargetId);
    }

    [Fact]
    public void WolfEncounterVisualState_ProjectsRecoveryWhenTheSubstrateRecordsIt()
    {
        var stream = Load("death_friction_kalev_down_recovery_fixture.json");

        var visual = new WolfEncounterVisualStateProjector().Project(stream.Events);

        Assert.Equal("kalev_recovered", visual.ObjectiveState);
        Assert.False(visual.KalevDowned);
        Assert.False(visual.KalevRecoverable);
        Assert.True(visual.KalevRecovered);
        Assert.Equal(0, visual.KalevRecoveryTicksRemaining);
        Assert.Empty(visual.Wolves);
        Assert.Empty(visual.Loot);
    }

    [Fact]
    public void WolfEncounterVisualState_DoesNotInventUnsetEncounterSignals()
    {
        var visual = new WolfEncounterVisualStateProjector().Project(new SimEventStream().Events);

        Assert.Equal(string.Empty, visual.EncounterId);
        Assert.Equal(string.Empty, visual.ObjectiveState);
        Assert.Equal(string.Empty, visual.ActiveAudioCue);
        Assert.Equal("idle", visual.IiroAnimationRow);
        Assert.False(visual.IiroSafe);
        Assert.False(visual.KalevDowned);
        Assert.False(visual.KalevRecoverable);
        Assert.False(visual.KalevRecovered);
        Assert.Empty(visual.Wolves);
        Assert.Empty(visual.Loot);
        Assert.Empty(visual.SourceEventIds);
    }

    private static SimEventStream Load(string fixtureName)
    {
        return SimEventStream.FromStableJson(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures", fixtureName)));
    }
}
