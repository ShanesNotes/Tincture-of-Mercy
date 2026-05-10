using System.Collections.ObjectModel;
using Tincture.Substrate.Events;
using Tincture.Substrate.Presentation;

namespace Tincture.Tests.Presentation;

public sealed class PresentationEventTests
{
    [Fact]
    public void PresentationEvent_DefensivelyCopiesFieldsCostsResultsAndTags()
    {
        var simEvent = MutableEvent();
        var snapshot = PresentationEvent.From(simEvent);

        Assert.Equal(simEvent.Id, snapshot.Id);
        Assert.Equal(simEvent.Sequence, snapshot.Sequence);
        Assert.Equal(simEvent.Tick, snapshot.Tick);
        Assert.Equal(simEvent.ActorId, snapshot.ActorId);
        Assert.Equal(simEvent.TargetId, snapshot.TargetId);
        Assert.Equal(simEvent.VerbId, snapshot.VerbId);
        Assert.Equal(simEvent.Domain, snapshot.Domain);
        Assert.Equal(simEvent.SourceSystem, snapshot.SourceSystem);
        Assert.Equal(simEvent.EventType, snapshot.EventType);
        Assert.Equal("field-value", snapshot.Fields["field_key"]);
        Assert.Equal("1", snapshot.Costs["spirit"]);
        Assert.Equal("wolf_pelt", snapshot.Results["item_id"]);
        Assert.Equal(["combat", "debug"], snapshot.Tags);

        Assert.False(ReferenceEquals(simEvent.Fields, snapshot.Fields));
        Assert.False(ReferenceEquals(simEvent.Costs, snapshot.Costs));
        Assert.False(ReferenceEquals(simEvent.Results, snapshot.Results));
        Assert.False(ReferenceEquals(simEvent.Tags, snapshot.Tags));
        if (snapshot.Fields is IDictionary<string, string> mutableFields)
        {
            Assert.True(mutableFields.IsReadOnly);
            Assert.Throws<NotSupportedException>(() => mutableFields["mutated"] = "blocked");
        }

        if (snapshot.Tags is IList<string> mutableTags)
        {
            Assert.True(mutableTags.IsReadOnly);
            Assert.Throws<NotSupportedException>(() => mutableTags.Add("blocked"));
        }
    }

    [Fact]
    public void PresentationEvent_DoesNotReflectPostSnapshotMutation()
    {
        var simEvent = MutableEvent();
        var snapshot = PresentationEvent.From(simEvent);

        simEvent.Fields["field_key"] = "changed";
        simEvent.Fields["new_field"] = "new";
        simEvent.Costs["spirit"] = "9";
        simEvent.Results["item_id"] = "changed_item";
        simEvent.Tags.Add("mutated");

        Assert.Equal("field-value", snapshot.Fields["field_key"]);
        Assert.False(snapshot.Fields.ContainsKey("new_field"));
        Assert.Equal("1", snapshot.Costs["spirit"]);
        Assert.Equal("wolf_pelt", snapshot.Results["item_id"]);
        Assert.Equal(["combat", "debug"], snapshot.Tags);
    }

    [Fact]
    public void PresentationEventSnapshot_PreservesEventOrder()
    {
        var stream = new SimEventStream();
        stream.AppendBatch([
            MutableEvent() with { Id = string.Empty, Tick = 1, ActorId = "first", VerbId = "debug.first" },
            MutableEvent() with { Id = string.Empty, Tick = 2, ActorId = "second", VerbId = "debug.second" },
            MutableEvent() with { Id = string.Empty, Tick = 3, ActorId = "third", VerbId = "debug.third" }
        ]);

        var snapshot = PresentationEvent.Snapshot(stream.Events);

        Assert.Equal(stream.Events.Select(simEvent => simEvent.Id), snapshot.Select(simEvent => simEvent.Id));
        Assert.Equal([1, 2, 3], snapshot.Select(simEvent => simEvent.Sequence));
    }

    private static SimEvent MutableEvent()
    {
        return new SimEvent
        {
            Id = "evt-authored",
            Sequence = 7,
            Tick = 11,
            ActorId = "kalev",
            TargetId = "wolf_01",
            Location = new SimEventLocation("forest_path", 2, 3),
            VerbId = "combat.attack.resolve",
            Domain = SimDomain.Combat,
            SourceSystem = "fixture.v1",
            EventType = "fixture_event",
            Fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["field_key"] = "field-value"
            },
            Costs = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["spirit"] = "1"
            },
            Results = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["item_id"] = "wolf_pelt"
            },
            Tags = ["combat", "debug"]
        };
    }
}
