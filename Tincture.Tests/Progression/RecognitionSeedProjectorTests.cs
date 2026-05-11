using Tincture.Substrate.Events;
using Tincture.Substrate.Progression;

namespace Tincture.Tests.Progression;

public sealed class RecognitionSeedProjectorTests
{
    private static string FixturePath(string fixtureName) => Path.Combine(AppContext.BaseDirectory, "Fixtures", fixtureName);

    [Fact]
    public void RecognitionSeeds_DeriveFromEvents()
    {
        var stream = SimEventStream.FromStableJson(File.ReadAllText(FixturePath("progression_notebook_truth_fixture.json")));
        var snapshot = new RecognitionSeedProjector().Project(stream.Events);
        var kinds = snapshot.Seeds.Select(seed => seed.Kind).ToHashSet();

        Assert.Contains(RecognitionSeedKind.Bread, kinds);
        Assert.Contains(RecognitionSeedKind.Name, kinds);
        Assert.Contains(RecognitionSeedKind.Presence, kinds);
        Assert.Contains(RecognitionSeedKind.Witness, kinds);
        Assert.Contains(RecognitionSeedKind.Protection, kinds);
        Assert.Contains(RecognitionSeedKind.NotebookPersonRecord, kinds);

        Assert.Contains(snapshot.Seeds, seed =>
            seed.Kind == RecognitionSeedKind.Bread
            && seed.SourceEventId == "evt-00000001"
            && seed.PersonId == "iiro");
        Assert.Contains(snapshot.Seeds, seed =>
            seed.Kind == RecognitionSeedKind.Name
            && seed.Label == "Anna"
            && seed.PersonId == "anna");
        Assert.Contains(snapshot.Seeds, seed =>
            seed.Kind == RecognitionSeedKind.Protection
            && seed.Label == "protected on road"
            && seed.SourceEventId == "evt-00000005");
        Assert.Contains(snapshot.Seeds, seed =>
            seed.Kind == RecognitionSeedKind.NotebookPersonRecord
            && seed.Metadata["notebook_entry_id"] == "entry.iiro.protected");
        Assert.NotEmpty(snapshot.Duplicates);
        Assert.Contains(snapshot.Duplicates, duplicate =>
            duplicate.Kind == RecognitionSeedKind.Bread
            && duplicate.SourceEventId == "evt-00000001"
            && duplicate.PersonId == "iiro");
    }
    [Fact]
    public void RecognitionSeedMetadata_PreservesEconomySourceProvenance()
    {
        var stream = new SimEventStream();
        stream.AppendBatch([new SimEvent
        {
            Tick = 91,
            ActorId = "kalev",
            TargetId = "iiro",
            VerbId = "economy.item.give",
            Domain = SimDomain.Economy,
            SourceSystem = "economy.v1",
            EventType = "material_outcome_emitted",
            Fields = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["item_id"] = "bread_loaf",
                ["person_id"] = "iiro",
                ["source_domain"] = "care",
                ["source_event_id"] = "evt-bread-source",
                ["source_event_type"] = "outcome_resolved",
                ["source_system"] = "verb_invocation.v1"
            }),
            Tags = ["bread", "economy"]
        }]);

        var seed = new RecognitionSeedProjector().Project(stream.Events).Seeds.Single();

        Assert.Equal(RecognitionSeedKind.Bread, seed.Kind);
        Assert.Equal("evt-bread-source", seed.SourceEventId);
        Assert.Equal("economy.v1", seed.Metadata["event_source_system"]);
        Assert.Equal("verb_invocation.v1", seed.Metadata["source_system"]);
        Assert.Equal("care", seed.Metadata["source_domain"]);
        Assert.Equal("outcome_resolved", seed.Metadata["source_event_type"]);
    }

}
