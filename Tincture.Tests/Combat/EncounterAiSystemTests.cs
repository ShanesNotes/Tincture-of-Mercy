using Tincture.Substrate.Combat;
using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Events;
using Tincture.Substrate.World;

namespace Tincture.Tests.Combat;

public sealed class EncounterAiSystemTests
{
    private const string EncounterId = "encounter.keep_line.fixture";
    private const string IntentVerbId = "combat.intent.keep_line";
    private const string RouteId = "route.safety.fixture";
    private const string SafeGateNodeId = "safe_gate";

    private static string FixturePath(string fixtureName) => Path.Combine(AppContext.BaseDirectory, "Fixtures", fixtureName);

    [Fact]
    public void EncounterAiSystem_AppendsB4EventsThroughOneCoordinator()
    {
        var stream = new SimEventStream();
        var context = KeepLineContext(protectorOnLine: true);
        var participants = KeepLineParticipants(protectorOnLine: true);
        var system = new EncounterAiSystem();

        var result = system.EvaluateAndAppend(new EncounterAiRequest
        {
            EncounterId = EncounterId,
            VerbId = IntentVerbId,
            Domain = SimDomain.Combat,
            Tick = 10,
            EventStream = stream,
            SpatialContext = context,
            SpatialBandPair = new SpatialBandPair("wolf_01", "boy"),
            PreviousSpatialBand = SpatialBand.Distant,
            ThreatTargetRequest = new ThreatTargetRequest
            {
                EncounterId = EncounterId,
                AggressorId = "wolf_01",
                PreviousTargetId = "boy",
                VerbId = IntentVerbId,
                Domain = SimDomain.Combat,
                Tick = 10,
                Participants = participants
            }
        });

        Assert.All(result.AppendedEvents, simEvent => Assert.Equal(EncounterAiSystem.SourceSystemId, simEvent.SourceSystem));
        Assert.Equal([
            EncounterAiSystem.SpatialBandChangedEventType,
            EncounterAiSystem.ThreatTargetChangedEventType
        ], result.AppendedEvents.Select(simEvent => simEvent.EventType).ToList());
        Assert.Equal("kalev", result.AppendedEvents.Single(simEvent => simEvent.EventType == EncounterAiSystem.ThreatTargetChangedEventType).TargetId);
    }

    [Fact]
    public void EncounterAiSystem_KeepTheLineFixtureReplayStable()
    {
        var stream = new SimEventStream();
        var deathSystem = new DeathFrictionSystem();
        var system = new EncounterAiSystem(deathFrictionSystem: deathSystem);
        var exposedContext = KeepLineContext(protectorOnLine: false);
        var lineContext = KeepLineContext(protectorOnLine: true);
        var leashContext = new SpatialContext(
        [
            Snapshot("wolf_01", 8, 0, noise: 0),
            Snapshot("boy", 4, 0, noise: 4),
            Snapshot("kalev", 2, 0, noise: 1)
        ]);

        system.EvaluateAndAppend(new EncounterAiRequest
        {
            EncounterId = EncounterId,
            VerbId = IntentVerbId,
            Domain = SimDomain.Combat,
            Tick = 10,
            EventStream = stream,
            SpatialContext = exposedContext,
            SpatialBandPair = new SpatialBandPair("wolf_01", "boy"),
            PreviousSpatialBand = SpatialBand.Distant,
            ThreatTargetRequest = new ThreatTargetRequest
            {
                EncounterId = EncounterId,
                AggressorId = "wolf_01",
                PreviousTargetId = null,
                VerbId = IntentVerbId,
                Domain = SimDomain.Combat,
                Tick = 10,
                Participants = KeepLineParticipants(protectorOnLine: false)
            },
            AggroCallFleeRequest = new AggroCallFleeRequest
            {
                EncounterId = EncounterId,
                ActorId = "wolf_01",
                TargetId = "boy",
                VerbId = IntentVerbId,
                Domain = SimDomain.Combat,
                Tick = 10,
                Distance = 2,
                AggroRadius = 3,
                DisengageRadius = 6,
                PackCallRadius = 4,
                AlliesInCallRadius = 1,
                CurrentHealth = 6,
                FleeHealthThreshold = 2
            },
            RouteRequest = new EncounterRouteRequest
            {
                EncounterId = EncounterId,
                RouteId = RouteId,
                ActorId = "boy",
                TargetId = SafeGateNodeId,
                NextNodeId = SafeGateNodeId,
                VerbId = IntentVerbId,
                Domain = SimDomain.Combat,
                Tick = 10,
                SpatialContext = exposedContext
            }
        });

        system.EvaluateAndAppend(new EncounterAiRequest
        {
            EncounterId = EncounterId,
            VerbId = IntentVerbId,
            Domain = SimDomain.Combat,
            Tick = 20,
            EventStream = stream,
            SpatialContext = lineContext,
            SpatialBandPair = new SpatialBandPair("wolf_01", "kalev"),
            PreviousSpatialBand = SpatialBand.Far,
            ThreatTargetRequest = new ThreatTargetRequest
            {
                EncounterId = EncounterId,
                AggressorId = "wolf_01",
                PreviousTargetId = "boy",
                VerbId = IntentVerbId,
                Domain = SimDomain.Combat,
                Tick = 20,
                Participants = KeepLineParticipants(protectorOnLine: true)
            },
            AggroCallFleeRequest = new AggroCallFleeRequest
            {
                EncounterId = EncounterId,
                ActorId = "wolf_01",
                TargetId = "kalev",
                VerbId = IntentVerbId,
                Domain = SimDomain.Combat,
                Tick = 20,
                Distance = 2,
                AggroRadius = 3,
                DisengageRadius = 6,
                PackCallRadius = 4,
                AlliesInCallRadius = 0,
                CurrentHealth = 1,
                FleeHealthThreshold = 2,
                WasAggroed = true,
                PackCallAlreadyEmitted = true
            }
        });

        stream.AppendBatch([deathSystem.DeclareDeath(new DeathFrictionRequest
        {
            RequestId = "death-keep-line-001",
            ActorId = "wolf_01",
            TargetId = "kalev",
            VerbId = IntentVerbId,
            Domain = SimDomain.Combat,
            Tick = 30,
            Kind = DeathFrictionKind.BiologicalDeath,
            Cause = IntentVerbId,
            CauseEventId = "evt-00000007",
            Recoverable = false,
            BodyEligibility = BodyEligibility.RecoverableBody,
            FrictionRuleId = "friction.keep_line.fixture.v1",
            ConsequenceTags = ["combat", "body_recoverable"]
        })]);

        system.EvaluateAndAppend(new EncounterAiRequest
        {
            EncounterId = EncounterId,
            VerbId = IntentVerbId,
            Domain = SimDomain.Combat,
            Tick = 40,
            EventStream = stream,
            SpatialContext = leashContext,
            LeashRespawnRequest = new LeashRespawnRequest
            {
                EncounterId = EncounterId,
                ActorId = "wolf_01",
                TargetId = "kalev",
                VerbId = IntentVerbId,
                Domain = SimDomain.Combat,
                Tick = 40,
                SpatialContext = leashContext,
                Anchor = new GridCoord(0, 0),
                LeashRadius = 5
            }
        });

        var json = stream.ToStableJson();
        Assert.Equal(File.ReadAllText(FixturePath("encounter_ai_keep_the_line_fixture.json")), json);
        Assert.Equal(json, SimEventStream.FromStableJson(json).ToStableJson());
    }

    private static SpatialContext KeepLineContext(bool protectorOnLine)
    {
        return new SpatialContext(
        [
            Snapshot("wolf_01", 0, 0, noise: 0),
            Snapshot("boy", 4, 0, noise: 4),
            Snapshot("kalev", 2, protectorOnLine ? 0 : 2, noise: 1)
        ],
        [
            new SpatialRouteNode { NodeId = SafeGateNodeId, Position = new GridCoord(4, 0), ZoneId = "road" }
        ]);
    }

    private static IReadOnlyList<EncounterParticipant> KeepLineParticipants(bool protectorOnLine) =>
    [
        Participant("wolf_01", EncounterRole.Aggressor, 0, 0, threat: 0, vulnerability: 0, protection: 0),
        Participant("boy", EncounterRole.Protected, 4, 0, threat: 50, vulnerability: 20, protection: 0, noise: 4),
        Participant("kalev", EncounterRole.Protector, 2, protectorOnLine ? 0 : 2, threat: 30, vulnerability: 0, protection: 45, noise: 1)
    ];

    private static EncounterParticipant Participant(string actorId, EncounterRole role, int x, int y, int threat, int vulnerability, int protection, int noise = 0) => new()
    {
        ActorId = actorId,
        Role = role,
        ThreatPriority = threat,
        Vulnerability = vulnerability,
        ProtectionStrength = protection,
        Snapshot = Snapshot(actorId, x, y, noise)
    };

    private static SpatialActorSnapshot Snapshot(string actorId, int x, int y, int noise) => new()
    {
        ActorId = actorId,
        Position = new GridCoord(x, y),
        ZoneId = "road",
        Noise = noise
    };
}
