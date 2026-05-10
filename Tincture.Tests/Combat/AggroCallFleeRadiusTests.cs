using Tincture.Substrate.Combat;
using Tincture.Substrate.Events;
using Tincture.Substrate.World;

namespace Tincture.Tests.Combat;

public sealed class AggroCallFleeRadiusTests
{
    [Fact]
    public void AggroCallFleeRadius_EmitsReplayableEvents()
    {
        var stream = new SimEventStream();
        var context = new SpatialContext(
        [
            Snapshot("wolf_01", 0, 0),
            Snapshot("boy", 2, 0)
        ]);
        var system = new EncounterAiSystem();

        var result = system.EvaluateAndAppend(new EncounterAiRequest
        {
            EncounterId = "encounter.keep_line.fixture",
            VerbId = "combat.intent.radius",
            Domain = SimDomain.Combat,
            Tick = 10,
            EventStream = stream,
            SpatialContext = context,
            AggroCallFleeRequest = new AggroCallFleeRequest
            {
                EncounterId = "encounter.keep_line.fixture",
                ActorId = "wolf_01",
                TargetId = "boy",
                VerbId = "combat.intent.radius",
                Domain = SimDomain.Combat,
                Tick = 10,
                Distance = 2,
                AggroRadius = 3,
                DisengageRadius = 6,
                PackCallRadius = 4,
                AlliesInCallRadius = 2,
                CurrentHealth = 1,
                FleeHealthThreshold = 2,
                WasAggroed = false,
                PackCallAlreadyEmitted = false,
                FleeAlreadyInitiated = false
            }
        });

        var eventTypes = result.AppendedEvents.Select(simEvent => simEvent.EventType).ToList();
        var json = stream.ToStableJson();
        var replay = SimEventStream.FromStableJson(json);

        Assert.Equal([
            EncounterAiSystem.AggroEnteredEventType,
            EncounterAiSystem.PackCallEmittedEventType,
            EncounterAiSystem.FleeInitiatedEventType
        ], eventTypes);
        Assert.Equal(json, replay.ToStableJson());
    }

    private static SpatialActorSnapshot Snapshot(string actorId, int x, int y) => new()
    {
        ActorId = actorId,
        Position = new GridCoord(x, y),
        ZoneId = "road"
    };
}
