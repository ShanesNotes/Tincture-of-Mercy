using Tincture.Substrate.Events;

namespace Tincture.Tests.Events;

internal static class TestEvents
{
    public static SimEvent CareEvent(long tick, string verbId) => new()
    {
        Tick = tick,
        ActorId = "kalev",
        TargetId = "mother",
        VerbId = verbId,
        Domain = SimDomain.Care,
        SourceSystem = "fixture",
        EventType = "verb_completed",
        Fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["fixture_id"] = "b1_stream",
            ["temperature"] = "warm"
        },
        Costs = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["steady"] = "1"
        },
        Results = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["comfort"] = "small"
        },
        Tags = ["water", "care"]
    };

    public static IReadOnlyList<SimEvent> ReplayFixtureEvents() =>
    [
        CareEvent(tick: 12, verbId: "wash_hands"),
        new SimEvent
        {
            Tick = 13,
            ActorId = "kalev",
            TargetId = "mother",
            VerbId = "speak_softly",
            Domain = SimDomain.Care,
            SourceSystem = "fixture",
            EventType = "presence_offered",
            Fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["voice_register"] = "folk"
            },
            Results = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["receptivity"] = "1"
            },
            Tags = ["witness_seed", "presence"]
        }
    ];
}
