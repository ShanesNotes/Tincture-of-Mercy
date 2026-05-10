using Tincture.Substrate.Events;
using Tincture.Substrate.Presentation;

namespace Tincture.Tests.Presentation;

public sealed class PresenterPurityTests
{
    [Fact]
    public void Presenters_DoNotMutateSimEventCollections()
    {
        var stream = LoadFixture("verb_invocation_care_combat_fixture.json");
        var before = SnapshotEventCollections(stream.Events);
        var snapshot = PresentationEvent.Snapshot(stream.Events);

        _ = new DomainPresenter().Present(new DomainPresentationRequest(PresentationSurfaceKeys.Care, SimDomain.Care, snapshot));
        _ = new DebugPresenter().Present(snapshot);

        var after = SnapshotEventCollections(stream.Events);
        Assert.Equal(before, after);
    }

    [Fact]
    public void Presenters_DoNotMutateSimEventStreamCountOrOrder()
    {
        var stream = LoadFixture("loot_hooks_wolf_material_fixture.json");
        var beforeJson = stream.ToStableJson();
        var beforeIds = stream.Events.Select(simEvent => simEvent.Id).ToList();
        var beforeSequences = stream.Events.Select(simEvent => simEvent.Sequence).ToList();
        var beforeCount = stream.Events.Count;
        var snapshot = PresentationEvent.Snapshot(stream.Events);

        _ = new DomainPresenter().Present(new DomainPresentationRequest(PresentationSurfaceKeys.Economy, SimDomain.Economy, snapshot));
        _ = new DebugPresenter().Present(snapshot);

        Assert.Equal(beforeCount, stream.Events.Count);
        Assert.Equal(beforeIds, stream.Events.Select(simEvent => simEvent.Id));
        Assert.Equal(beforeSequences, stream.Events.Select(simEvent => simEvent.Sequence));
        Assert.Equal(beforeJson, stream.ToStableJson());
    }

    private static IReadOnlyList<string> SnapshotEventCollections(IEnumerable<SimEvent> events)
    {
        return events
            .Select(simEvent => string.Join("|", [
                simEvent.Id,
                string.Join(",", simEvent.Fields.Select(pair => $"{pair.Key}={pair.Value}")),
                string.Join(",", simEvent.Costs.Select(pair => $"{pair.Key}={pair.Value}")),
                string.Join(",", simEvent.Results.Select(pair => $"{pair.Key}={pair.Value}")),
                string.Join(",", simEvent.Tags)
            ]))
            .ToList();
    }

    private static SimEventStream LoadFixture(string name)
    {
        return SimEventStream.FromStableJson(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures", name)));
    }
}
