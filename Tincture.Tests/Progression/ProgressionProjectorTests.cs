using System.Collections.Immutable;
using Tincture.Substrate.Data;
using Tincture.Substrate.Events;
using Tincture.Substrate.Progression;

namespace Tincture.Tests.Progression;

public sealed class ProgressionProjectorTests
{
    private static string FixturePath(string fixtureName) => Path.Combine(AppContext.BaseDirectory, "Fixtures", fixtureName);

    [Fact]
    public void Progression_ProjectsWitnessRecollectionPathPoints()
    {
        var stream = LoadFixture();
        var snapshot = new ProgressionProjector().Project(stream.Events);

        Assert.Equal(2, snapshot.Witness);
        Assert.Equal(2, snapshot.Recollection);
        Assert.Equal(7, snapshot.Vocation);
        Assert.Equal(2, snapshot.PathPoints[LatentPath.Apothecary]);
        Assert.Equal(3, snapshot.PathPoints[LatentPath.Hesychasm]);
        Assert.DoesNotContain(LatentPath.Iconographic, snapshot.PathPoints.Keys);

        Assert.Contains(snapshot.Entries, entry =>
            entry.Track == ProgressionTrack.Witness
            && entry.SourceEventId == "evt-00000002"
            && entry.RuleId == "progression.witness.event.v1");
        Assert.Contains(snapshot.Entries, entry =>
            entry.Track == ProgressionTrack.Vocation
            && entry.Path == LatentPath.Hesychasm
            && entry.SourceEventId == "evt-00000005"
            && entry.RuleId == "progression.protection_cost.v1");
    }

    [Fact]
    public void Progression_DuplicateSourceEventGuard()
    {
        var stream = new SimEventStream();
        var death = stream.AppendBatch([WitnessDeath()]).Single();
        stream.AppendBatch([
            WitnessHook("witness-a", death.Id),
            WitnessHook("witness-b", death.Id)
        ]);

        var snapshot = new ProgressionProjector().Project(stream.Events);

        Assert.Equal(1, snapshot.Witness);
        Assert.Equal(1, snapshot.Recollection);
        Assert.Equal(3, snapshot.Duplicates.Count);
        Assert.All(snapshot.Duplicates, duplicate => Assert.Equal(death.Id, duplicate.SourceEventId));
        Assert.Contains(snapshot.Duplicates, duplicate => duplicate.ProgressionKey == ProgressionTrack.Witness.ToId());
        Assert.Contains(snapshot.Duplicates, duplicate => duplicate.ProgressionKey == ProgressionTrack.Recollection.ToId());
    }


    [Fact]
    public void Progression_MetadataPreservesEconomySourceProvenance()
    {
        var stream = new SimEventStream();
        stream.AppendBatch([EconomyProgressionEvent()]);

        var entry = new ProgressionProjector().Project(stream.Events).Entries.Single();

        Assert.Equal("economy.v1", entry.SourceSystem);
        Assert.Equal("economy.v1", entry.Metadata["event_source_system"]);
        Assert.Equal("economy", entry.Metadata["event_domain"]);
        Assert.Equal("death_friction.v1", entry.Metadata["source_system"]);
        Assert.Equal("combat", entry.Metadata["source_domain"]);
        Assert.Equal("actor_died", entry.Metadata["source_event_type"]);
        Assert.Equal("evt-wolf-death", entry.SourceEventId);
    }

    [Fact]
    public void Progression_ProjectionCollectionsAreImmutable()
    {
        var progression = new ProgressionProjector().Project(LoadFixture().Events);
        var recognition = new RecognitionSeedProjector().Project(LoadFixture().Events);

        Assert.IsAssignableFrom<IImmutableDictionary<LatentPath, int>>(progression.PathPoints);
        Assert.IsAssignableFrom<IImmutableDictionary<string, string>>(progression.Entries.First(entry => entry.Metadata.Count > 0).Metadata);
        Assert.IsAssignableFrom<IImmutableDictionary<string, string>>(recognition.Seeds.First(seed => seed.Metadata.Count > 0).Metadata);
    }

    [Fact]
    public void ProgressionFixture_ReplaysStableJson()
    {
        var fixture = File.ReadAllText(FixturePath("progression_notebook_truth_fixture.json"));
        var stream = SimEventStream.FromStableJson(fixture);

        Assert.Equal(fixture, stream.ToStableJson());
    }

    [Fact]
    public void ProgressionEnums_FailFastOnUnknownValues()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => ((ProgressionTrack)999).ToId());
        Assert.Throws<ArgumentOutOfRangeException>(() => ProgressionTrackExtensions.FromId("renown"));
        Assert.Throws<ArgumentOutOfRangeException>(() => ((RecognitionSeedKind)999).ToId());
        Assert.Throws<ArgumentOutOfRangeException>(() => RecognitionSeedKindExtensions.FromId("rumor"));
    }

    private static SimEventStream LoadFixture()
    {
        return SimEventStream.FromStableJson(File.ReadAllText(FixturePath("progression_notebook_truth_fixture.json")));
    }


    private static SimEvent EconomyProgressionEvent() => new()
    {
        Tick = 90,
        ActorId = "kalev",
        TargetId = "wolf_alpha",
        VerbId = "economy.loot.resolve",
        Domain = SimDomain.Economy,
        SourceSystem = "economy.v1",
        EventType = "material_outcome_emitted",
        Fields = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["item_id"] = "wolf_pelt",
            ["source_domain"] = "combat",
            ["source_event_id"] = "evt-wolf-death",
            ["source_event_type"] = "actor_died",
            ["source_system"] = "death_friction.v1",
            ["witness_delta"] = "1"
        }),
        Tags = ["economy", "loot", "material"]
    };

    private static SimEvent WitnessDeath() => new()
    {
        Tick = 10,
        ActorId = "mother",
        TargetId = "kalev",
        VerbId = "death.mother",
        Domain = SimDomain.Witness,
        SourceSystem = "death_friction.v1",
        EventType = "actor_died",
        Fields = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["death_kind"] = "fixed_death",
            ["witness_hook"] = "witness.kalev"
        }),
        Tags = ["witness", "witnessed"]
    };

    private static SimEvent WitnessHook(string requestId, string sourceEventId) => new()
    {
        Tick = 11,
        ActorId = "kalev",
        TargetId = "mother",
        VerbId = "witness.kalev",
        Domain = SimDomain.Witness,
        SourceSystem = "death_friction.v1",
        EventType = "witness_hook_recorded",
        Fields = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["recollection_seed"] = "mother_name_witnessed",
            ["source_event_id"] = sourceEventId,
            ["witness_request_id"] = requestId
        }),
        Tags = ["recollection_seed", "witness"]
    };
}
