using Tincture.Substrate.Events;
using Tincture.Substrate.Presentation;

namespace Tincture.Tests.Presentation;

public sealed class DebugPresenterTests
{
    [Fact]
    public void DebugPresenter_ProjectsMetadataFromEventTruthOnly()
    {
        var snapshot = PresentationEvent.Snapshot(LoadFixture("outcome_wolf_seeded_fixture.json").Events);
        var debug = new DebugPresenter().Present(snapshot);
        var row = Assert.Single(debug.Rows);

        Assert.Contains(row.Entries, entry => entry.Section == "identity" && entry.Key == "id" && entry.Value == snapshot[0].Id);
        Assert.Contains(row.Entries, entry => entry.Section == "identity" && entry.Key == "event_type" && entry.Value == snapshot[0].EventType);
        Assert.Contains(row.Entries, entry => entry.Section == "fields" && entry.Key == "resolver_id" && entry.Value == "outcome_resolver.v1");
        Assert.Contains(row.Entries, entry => entry.Section == "fields" && entry.Key == "root_seed" && entry.Value == "1234567");
        Assert.Contains(row.Entries, entry => entry.Section == "fields" && entry.Key == "table_id" && entry.Value == "combat.wolf_attack.v1");
    }

    [Fact]
    public void DebugPresenter_SeedFixtureResolverMetadataOnlyWhenPresentInFields()
    {
        var withoutMetadata = PresentationEvent.From(new SimEvent
        {
            Id = "evt-no-debug-metadata",
            Sequence = 1,
            Tick = 1,
            ActorId = "kalev",
            VerbId = "debug.no_metadata",
            Domain = SimDomain.Debug,
            SourceSystem = "fixture.v1",
            EventType = "debug_fixture",
            Fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        });
        var withMetadata = PresentationEvent.From(new SimEvent
        {
            Id = "evt-with-debug-metadata",
            Sequence = 2,
            Tick = 1,
            ActorId = "kalev",
            VerbId = "debug.with_metadata",
            Domain = SimDomain.Debug,
            SourceSystem = "fixture.v1",
            EventType = "debug_fixture",
            Fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["resolver_id"] = "outcome_resolver.v1",
                ["root_seed"] = "99",
                ["scripted_fixture_id"] = "fixture_a",
                ["table_id"] = "care.tincture.v1"
            }
        });

        var debug = new DebugPresenter().Present([withoutMetadata, withMetadata]);
        var first = debug.Rows[0];
        var second = debug.Rows[1];

        Assert.DoesNotContain(first.Entries, entry => entry.Key is "resolver_id" or "root_seed" or "scripted_fixture_id" or "table_id");
        Assert.Contains(second.Entries, entry => entry.Section == "fields" && entry.Key == "resolver_id");
        Assert.Contains(second.Entries, entry => entry.Section == "fields" && entry.Key == "root_seed");
        Assert.Contains(second.Entries, entry => entry.Section == "fields" && entry.Key == "scripted_fixture_id");
        Assert.Contains(second.Entries, entry => entry.Section == "fields" && entry.Key == "table_id");
    }

    [Fact]
    public void DebugPresenter_IncludesCostsResultsFieldsTagsFromSnapshots()
    {
        var snapshot = PresentationEvent.From(new SimEvent
        {
            Id = "evt-debug-full",
            Sequence = 1,
            Tick = 2,
            ActorId = "kalev",
            VerbId = "debug.full",
            Domain = SimDomain.Debug,
            SourceSystem = "fixture.v1",
            EventType = "debug_fixture",
            Fields = new SortedDictionary<string, string>(StringComparer.Ordinal) { ["field_a"] = "a" },
            Costs = new SortedDictionary<string, string>(StringComparer.Ordinal) { ["spirit"] = "1" },
            Results = new SortedDictionary<string, string>(StringComparer.Ordinal) { ["item_id"] = "wolf_pelt" },
            Tags = ["debug", "fixture"]
        });

        var row = Assert.Single(new DebugPresenter().Present([snapshot]).Rows);

        Assert.Contains(row.Entries, entry => entry.Section == "fields" && entry.Key == "field_a" && entry.Value == "a");
        Assert.Contains(row.Entries, entry => entry.Section == "costs" && entry.Key == "spirit" && entry.Value == "1");
        Assert.Contains(row.Entries, entry => entry.Section == "results" && entry.Key == "item_id" && entry.Value == "wolf_pelt");
        Assert.Contains(row.Entries, entry => entry.Section == "tags" && entry.Value == "debug");
        Assert.True(SectionIndex(row, "identity") < SectionIndex(row, "fields"));
        Assert.True(SectionIndex(row, "fields") < SectionIndex(row, "costs"));
        Assert.True(SectionIndex(row, "costs") < SectionIndex(row, "results"));
        Assert.True(SectionIndex(row, "results") < SectionIndex(row, "tags"));
    }

    private static int SectionIndex(DebugPresentationRow row, string section)
    {
        return row.Entries.ToList().FindIndex(entry => entry.Section == section);
    }

    private static SimEventStream LoadFixture(string name)
    {
        return SimEventStream.FromStableJson(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures", name)));
    }
}
