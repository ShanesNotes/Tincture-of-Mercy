using Tincture.Substrate.Combat;
using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Events;
using Tincture.Substrate.World;

namespace Tincture.Tests.Combat;

public sealed class LeashRouteRespawnTests
{
    [Fact]
    public void LeashRouteRespawn_ResetAndFrictionHooksReplay()
    {
        var stream = new SimEventStream();
        var deathSystem = new DeathFrictionSystem();
        var death = stream.AppendBatch([deathSystem.DeclareDeath(new DeathFrictionRequest
        {
            RequestId = "death-001",
            ActorId = "wolf_01",
            TargetId = "kalev",
            VerbId = "combat.protect.strike",
            Domain = SimDomain.Combat,
            Tick = 12,
            Kind = DeathFrictionKind.BiologicalDeath,
            Cause = "combat.protect.strike",
            CauseEventId = "evt-cause-001",
            Recoverable = false,
            BodyEligibility = BodyEligibility.RecoverableBody,
            FrictionRuleId = "friction.body.fixture.v1",
            ConsequenceTags = ["combat", "body_recoverable"]
        })]).Single();
        var context = new SpatialContext(
        [
            Snapshot("wolf_01", 8, 0),
            Snapshot("boy", 4, 0)
        ],
        [
            new SpatialRouteNode { NodeId = "safe_gate", Position = new GridCoord(4, 0), ZoneId = "road" }
        ]);
        var system = new EncounterAiSystem(deathFrictionSystem: deathSystem);

        var result = system.EvaluateAndAppend(new EncounterAiRequest
        {
            EncounterId = "encounter.keep_line.fixture",
            VerbId = "combat.intent.route",
            Domain = SimDomain.Combat,
            Tick = 20,
            EventStream = stream,
            SpatialContext = context,
            RouteRequest = new EncounterRouteRequest
            {
                EncounterId = "encounter.keep_line.fixture",
                RouteId = "route.safety.fixture",
                ActorId = "boy",
                TargetId = "safe_gate",
                NextNodeId = "safe_gate",
                VerbId = "combat.intent.route",
                Domain = SimDomain.Combat,
                Tick = 20,
                SpatialContext = context
            },
            LeashRespawnRequest = new LeashRespawnRequest
            {
                EncounterId = "encounter.keep_line.fixture",
                ActorId = "wolf_01",
                TargetId = "kalev",
                VerbId = "combat.intent.route",
                Domain = SimDomain.Combat,
                Tick = 20,
                SpatialContext = context,
                Anchor = new GridCoord(0, 0),
                LeashRadius = 5
            }
        });

        var eventTypes = result.AppendedEvents.Select(simEvent => simEvent.EventType).ToList();
        var friction = result.AppendedEvents.Single(simEvent => simEvent.EventType == EncounterAiSystem.EncounterFrictionRequestedEventType);
        var respawn = result.AppendedEvents.Single(simEvent => simEvent.EventType == EncounterAiSystem.EncounterRespawnResetEventType);
        var json = stream.ToStableJson();

        Assert.Contains(EncounterAiSystem.LeashTriggeredEventType, eventTypes);
        Assert.Contains(EncounterAiSystem.RouteNodeReachedEventType, eventTypes);
        Assert.Equal(death.Id, friction.Fields["source_death_event_id"]);
        Assert.Equal(death.Id, respawn.Fields["source_death_event_id"]);
        Assert.Equal(json, SimEventStream.FromStableJson(json).ToStableJson());
    }

    private static SpatialActorSnapshot Snapshot(string actorId, int x, int y) => new()
    {
        ActorId = actorId,
        Position = new GridCoord(x, y),
        ZoneId = "road"
    };
}
