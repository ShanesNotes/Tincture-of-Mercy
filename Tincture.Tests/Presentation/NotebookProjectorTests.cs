using Tincture.Substrate.Events;
using Tincture.Substrate.Presentation;

namespace Tincture.Tests.Presentation;

public sealed class NotebookProjectorTests
{
    private static string FixturePath(string fixtureName) => Path.Combine(AppContext.BaseDirectory, "Fixtures", fixtureName);

    [Fact]
    public void Notebook_ProjectsNamedEvents()
    {
        var snapshot = PresentationEvent.Snapshot(LoadFixture().Events);
        var surface = new NotebookProjector().Present(new NotebookProjectionRequest(snapshot));

        Assert.Equal(PresentationSurfaceKeys.Notebook, surface.Surface);
        Assert.Equal(SimDomain.Notebook, surface.Domain);
        Assert.Equal("notebook_projector.v1", surface.Metadata["projector_id"]);
        Assert.Equal("3", surface.Metadata["row_count"]);
        Assert.Equal(surface.SourceEventIds, surface.Rows.Select(row => row.SourceEventId));

        Assert.Contains(surface.Rows, row =>
            row.Label == "notebook.write_name.mother"
            && row.Metadata["entry_kind"] == "person_record"
            && row.Metadata["person_id"] == "mother"
            && row.Metadata["name"] == "Mara"
            && row.Metadata["source_event_id"] == "evt-00000002");
        Assert.Contains(surface.Rows, row =>
            row.Label == "notebook.ordinary_mercy.bread"
            && row.Metadata["person_id"] == "child"
            && row.Metadata["source_event_id"] == "evt-00000001");
        Assert.Contains(surface.Rows, row =>
            row.Label == "notebook.aftermath.protection"
            && row.Metadata["source_event_id"] == "evt-00000005");
    }


    [Fact]
    public void NotebookProjector_PreservesEconomySourceProvenanceFields()
    {
        var stream = new SimEventStream();
        stream.AppendBatch([new SimEvent
        {
            Tick = 92,
            ActorId = "kalev",
            TargetId = "wolf_alpha",
            VerbId = "economy.loot.resolve",
            Domain = SimDomain.Economy,
            SourceSystem = "economy.v1",
            EventType = "material_outcome_emitted",
            Fields = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["copy_key"] = "notebook.aftermath.material",
                ["item_id"] = "wolf_pelt",
                ["source_domain"] = "combat",
                ["source_event_id"] = "evt-wolf-death",
                ["source_event_type"] = "actor_died",
                ["source_system"] = "death_friction.v1"
            }),
            Tags = ["economy", "material"]
        }]);

        var snapshot = PresentationEvent.Snapshot(stream.Events);
        var row = new NotebookProjector().Present(new NotebookProjectionRequest(snapshot)).Rows.Single();

        Assert.Equal("notebook.aftermath.material", row.Label);
        Assert.Equal("economy.v1", row.Metadata["event_source_system"]);
        Assert.Equal("economy", row.Metadata["event_domain"]);
        Assert.Equal("death_friction.v1", row.Metadata["source_system"]);
        Assert.Equal("combat", row.Metadata["source_domain"]);
        Assert.Equal("actor_died", row.Metadata["source_event_type"]);
    }

    [Fact]
    public void NotebookProjector_DoesNotMutateAuthoritativeState()
    {
        var stream = LoadFixture();
        var before = stream.ToStableJson();
        var snapshot = PresentationEvent.Snapshot(stream.Events);

        var surface = new NotebookProjector().Present(new NotebookProjectionRequest(snapshot));

        Assert.Equal(3, surface.Rows.Count);
        Assert.Equal(before, stream.ToStableJson());

        stream.Events[0].Fields["copy_key"] = "mutated.after.snapshot";
        var projectedFromOriginalSnapshot = new NotebookProjector().Present(new NotebookProjectionRequest(snapshot));

        Assert.DoesNotContain(projectedFromOriginalSnapshot.Rows, row => row.Label == "mutated.after.snapshot");
        Assert.Equal(before, SimEventJson.SerializeEvents(snapshot.Select(ToEventForComparison)));
    }

    private static SimEventStream LoadFixture()
    {
        return SimEventStream.FromStableJson(File.ReadAllText(FixturePath("progression_notebook_truth_fixture.json")));
    }

    private static SimEvent ToEventForComparison(PresentationEvent presentationEvent)
    {
        return new SimEvent
        {
            Id = presentationEvent.Id,
            Sequence = presentationEvent.Sequence,
            Tick = presentationEvent.Tick,
            ActorId = presentationEvent.ActorId,
            TargetId = presentationEvent.TargetId,
            Location = presentationEvent.Location,
            VerbId = presentationEvent.VerbId,
            Domain = presentationEvent.Domain,
            SourceSystem = presentationEvent.SourceSystem,
            EventType = presentationEvent.EventType,
            Fields = SimEvent.StableDictionary(presentationEvent.Fields),
            Costs = SimEvent.StableDictionary(presentationEvent.Costs),
            Results = SimEvent.StableDictionary(presentationEvent.Results),
            Tags = presentationEvent.Tags.ToList()
        };
    }
}
