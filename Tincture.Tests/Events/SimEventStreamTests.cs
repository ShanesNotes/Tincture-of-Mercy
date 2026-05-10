using Tincture.Substrate.Events;

namespace Tincture.Tests.Events;

public sealed class SimEventStreamTests
{
    private static string FixturePath(string fixtureName) => Path.Combine(AppContext.BaseDirectory, "Fixtures", fixtureName);

    [Fact]
    public void SimEventStream_AppendsBatchAtomically()
    {
        var stream = new SimEventStream();
        var invalidBatch = new[]
        {
            TestEvents.CareEvent(tick: 1, verbId: "wash_hands"),
            TestEvents.CareEvent(tick: 2, verbId: string.Empty)
        };

        var exception = Assert.Throws<InvalidOperationException>(() => stream.AppendBatch(invalidBatch));
        Assert.Contains("VerbId", exception.Message);
        Assert.Empty(stream.Events);

        var appended = stream.AppendBatch(new[]
        {
            TestEvents.CareEvent(tick: 1, verbId: "wash_hands"),
            TestEvents.CareEvent(tick: 2, verbId: "speak_softly")
        });

        Assert.Equal(new[] { 1L, 2L }, appended.Select(simEvent => simEvent.Sequence));
        Assert.Equal(new[] { "evt-00000001", "evt-00000002" }, appended.Select(simEvent => simEvent.Id));
        Assert.Equal(2, stream.Events.Count);
    }

    [Fact]
    public void SimEventStream_ReplaysStableJsonFixture()
    {
        var stream = new SimEventStream();
        stream.AppendBatch(TestEvents.ReplayFixtureEvents());

        var json = stream.ToStableJson();
        var fixture = File.ReadAllText(FixturePath("sim_event_stream_fixture.json"));
        Assert.Equal(fixture, json);

        var replay = SimEventStream.FromStableJson(json);
        Assert.Equal(json, replay.ToStableJson());
    }

    [Fact]
    public void SimEventStream_RingBufferCapacityRolloverIsDeterministic()
    {
        var first = BuildCapacityStream();
        var second = BuildCapacityStream();

        Assert.Equal(new[] { 2L, 3L }, first.Events.Select(simEvent => simEvent.Sequence));
        Assert.Equal(first.ToStableJson(), second.ToStableJson());
    }

    [Fact]
    public void SimEventStream_FromStableJsonHonorsCapacityDeterministically()
    {
        var fixture = File.ReadAllText(FixturePath("sim_event_stream_fixture.json"));

        var replay = SimEventStream.FromStableJson(fixture, capacity: 1);

        Assert.Single(replay.Events);
        Assert.Equal(2L, replay.Events.Single().Sequence);
        Assert.Equal(replay.ToStableJson(), SimEventStream.FromStableJson(fixture, capacity: 1).ToStableJson());
    }

    private static SimEventStream BuildCapacityStream()
    {
        var stream = new SimEventStream(capacity: 2);
        stream.AppendBatch(new[]
        {
            TestEvents.CareEvent(tick: 1, verbId: "observe"),
            TestEvents.CareEvent(tick: 2, verbId: "warm_water"),
            TestEvents.CareEvent(tick: 3, verbId: "wash_hands")
        });
        return stream;
    }
}
