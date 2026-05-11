using Tincture.Substrate.Combat;
using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Economy;
using Tincture.Substrate.Events;
using Tincture.Substrate.Progression;
using Tincture.Substrate.ReadModels;

namespace Tincture.Tests.Opening;

public sealed class OpeningActFixtureReplayTests
{
    private static readonly string[] FixtureNames =
    [
        "opening_act_water_bread_fixture.json",
        "opening_act_tincture_fixture.json",
        "opening_act_mother_witness_fixture.json",
        "opening_act_wolves_hold_line_fixture.json",
        "opening_act_wolves_kalev_falls_fixture.json",
        "opening_act_cabin_prologue_fixture.json"
    ];

    private static string FixturePath(string fixtureName) => Path.Combine(AppContext.BaseDirectory, "Fixtures", fixtureName);

    [Theory]
    [MemberData(nameof(OpeningFixtures))]
    public void OpeningActFixtures_RoundTripStableJson(string fixtureName)
    {
        var json = File.ReadAllText(FixturePath(fixtureName));
        var stream = SimEventStream.FromStableJson(json);

        Assert.Equal(json, stream.ToStableJson());
    }

    public static IEnumerable<object[]> OpeningFixtures() => FixtureNames.Select(name => new object[] { name });

    [Fact]
    public void OpeningActWaterBread_ProjectsInventoryRecognitionNotebookAndSensoryState()
    {
        var stream = Load("opening_act_water_bread_fixture.json");
        var snapshot = new OpeningActSnapshotProjector().Project(stream.Events, tick: 30);

        Assert.Equal(1, snapshot.Inventory.QuantityOf("water_supply"));
        Assert.Equal(0, snapshot.Inventory.QuantityOf("bread"));
        Assert.Equal(10, snapshot.FirstVerbInvokedTick);
        Assert.Equal("thin", snapshot.AnnaBreathState);
        Assert.Equal("open", snapshot.NotebookState);
        Assert.Equal("66", snapshot.NotebookFocusPage);
        Assert.Contains(snapshot.RecognitionSeeds.Seeds, seed => seed.Kind == RecognitionSeedKind.Bread && seed.PersonId == "iiro");
        Assert.Contains(stream.Events, simEvent => simEvent.Fields.TryGetValue("audio_cue", out var cue) && cue == "long_morning_start");
    }

    [Fact]
    public void OpeningActTinctureAndMotherWitness_AreSplitAndCarryHesychasmPresence()
    {
        var tincture = Load("opening_act_tincture_fixture.json");
        var witness = Load("opening_act_mother_witness_fixture.json");
        var recognition = new RecognitionSeedProjector().Project(witness.Events);

        Assert.DoesNotContain(tincture.Events, simEvent => simEvent.EventType == DeathFrictionSystem.DiedEventType);
        Assert.Contains(tincture.Events, simEvent => simEvent.Fields.TryGetValue("scripted_entry_id", out var entry) && entry == "glance");
        Assert.Contains(witness.Events, simEvent => simEvent.VerbId == "presence.sit_near" && simEvent.Fields["path_id"] == "hesychasm");
        Assert.Contains(witness.Events, simEvent => simEvent.ActorId == "anna" && simEvent.EventType == DeathFrictionSystem.DiedEventType && simEvent.Fields["death_kind"] == "fixed_death");
        Assert.Contains(witness.Events, simEvent => simEvent.ActorId == "anna" && simEvent.EventType == DeathFrictionSystem.DiedEventType && simEvent.Fields["copy_text"] == "Anna's breath stops with Kalev still beside her.");
        Assert.Contains(witness.Events, simEvent => simEvent.Fields.TryGetValue("audio_cue", out var cue) && cue == "long_pour_start");
        Assert.Contains(recognition.Seeds, seed => seed.PersonId == "anna" && seed.Kind == RecognitionSeedKind.Presence);
        Assert.Contains(recognition.Seeds, seed => seed.PersonId == "anna" && seed.Kind == RecognitionSeedKind.Witness);
        Assert.Contains(recognition.Seeds, seed => seed.PersonId == "anna" && seed.Kind == RecognitionSeedKind.Name && seed.Label == "Anna written after breath");
        Assert.Contains(witness.Events, simEvent => simEvent.VerbId == "notebook.write_name" && simEvent.Fields["name"] == "Anna" && simEvent.Fields["source_event_id"] == "evt-00000003");
    }

    [Fact]
    public void OpeningActWolves_ProvesSafeAndFallenMusicResolvePathsPlusLootOutcomes()
    {
        var safe = Load("opening_act_wolves_hold_line_fixture.json");
        var fallen = Load("opening_act_wolves_kalev_falls_fixture.json");
        var inventory = new ItemLedger().Project(safe.Events);

        Assert.Contains(safe.Events, simEvent => simEvent.EventType == EncounterAiSystem.AggroEnteredEventType && simEvent.Fields["audio_cue"] == "yard_holds_start");
        Assert.Contains(safe.Events, simEvent => simEvent.EventType == EncounterAiSystem.RouteNodeReachedEventType && simEvent.Fields["route_id"] == "iiro.escape" && simEvent.Fields["audio_cue"] == "yard_holds_resolve_safe");
        Assert.Equal(1, inventory.QuantityOf("wolf_hide"));
        Assert.Contains(safe.Events, simEvent => simEvent.EventType == LootSystem.EligibilityRecordedEventType && simEvent.Fields["eligible"] == "false" && simEvent.Fields["eligibility_reason"] == "source_actor_leashed");
        Assert.Contains(fallen.Events, simEvent => simEvent.ActorId == "kalev" && simEvent.EventType == DeathFrictionSystem.DownedEventType && simEvent.Fields["audio_cue"] == "yard_holds_resolve_fallen");
    }

    [Fact]
    public void OpeningActFullReplay_ComposesChronologyThresholdAndSnapshotTruth()
    {
        var stream = Load("opening_act_cabin_prologue_fixture.json");
        var route = stream.Events.Single(simEvent => simEvent.EventType == EncounterAiSystem.RouteNodeReachedEventType);
        var annaDeath = stream.Events.Single(simEvent => simEvent.ActorId == "anna" && simEvent.EventType == DeathFrictionSystem.DiedEventType);
        var threshold = stream.Events.Single(simEvent => simEvent.VerbId == "world.cross_threshold");
        var snapshot = new OpeningActSnapshotProjector().Project(stream.Events, tick: threshold.Tick);
        var wolfDeath = stream.Events.Single(simEvent => simEvent.ActorId == "wolf_01" && simEvent.EventType == DeathFrictionSystem.DiedEventType);
        var wolfLeash = stream.Events.Single(simEvent => simEvent.ActorId == "wolf_02" && simEvent.EventType == EncounterAiSystem.LeashTriggeredEventType);
        var material = stream.Events.Single(simEvent => simEvent.TargetId == "wolf_01" && simEvent.EventType == LootSystem.MaterialOutcomeEventType);
        var withheldLoot = stream.Events.Single(simEvent => simEvent.TargetId == "wolf_02" && simEvent.EventType == LootSystem.EligibilityRecordedEventType);
        var annaWitness = stream.Events.Single(simEvent => simEvent.TargetId == "anna" && simEvent.EventType == DeathFrictionSystem.WitnessHookRecordedEventType);
        var annaName = stream.Events.Single(simEvent => simEvent.TargetId == "anna" && simEvent.VerbId == "notebook.write_name");

        Assert.True(route.Sequence < annaDeath.Sequence);
        Assert.True(annaDeath.Sequence < threshold.Sequence);
        Assert.Equal(wolfDeath.Id, material.Fields["source_event_id"]);
        Assert.Equal(wolfLeash.Id, withheldLoot.Fields["source_event_id"]);
        Assert.Equal(annaDeath.Id, annaWitness.Fields["source_event_id"]);
        Assert.Equal(annaDeath.Id, annaName.Fields["source_event_id"]);
        Assert.Equal("Anna's breath stops with Kalev still beside her.", annaDeath.Fields["copy_text"]);
        Assert.Equal("Anna — written after breath stopped.", annaName.Fields["copy_text"]);
        Assert.Equal("Anna written after breath", annaName.Fields["recognition_label"]);
        Assert.Equal("The threshold reads as a leaving, not a rescue.", stream.Events.Single(simEvent => simEvent.VerbId == "iconographic.read_threshold").Fields["copy_text"]);
        Assert.Equal("Page 66 stays open as Kalev crosses the threshold.", threshold.Fields["copy_text"]);
        Assert.Equal("long_pour_resolve", snapshot.Metadata["active_audio_cue"]);
        Assert.Equal("threshold", snapshot.CameraFocusTarget);
        Assert.Equal("low", snapshot.HearthState);
        Assert.Equal("stopped", snapshot.AnnaBreathState);
        Assert.Equal(1, snapshot.Inventory.QuantityOf("wolf_hide"));
        Assert.Equal(0, snapshot.Inventory.QuantityOf("bread"));
        Assert.Equal(0, snapshot.Inventory.QuantityOf("tincture_dose"));
        Assert.Contains(snapshot.RecognitionSeeds.Seeds, seed => seed.Kind == RecognitionSeedKind.Protection && seed.PersonId == "iiro");
        Assert.Contains(snapshot.RecognitionSeeds.Seeds, seed => seed.Kind == RecognitionSeedKind.Iconographic && seed.Label == "threshold as icon");
        Assert.Contains(stream.Events, simEvent => simEvent.VerbId == "care.tincture.self_administer" && simEvent.Fields["burden_delta"] == "3");
    }

    private static SimEventStream Load(string fixtureName) => SimEventStream.FromStableJson(File.ReadAllText(FixturePath(fixtureName)));
}
