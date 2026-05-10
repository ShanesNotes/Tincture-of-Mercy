using Tincture.Substrate.Combat;
using Tincture.Substrate.Events;
using Tincture.Substrate.World;

namespace Tincture.Tests.Combat;

public sealed class AttentionThreatTableTests
{
    [Fact]
    public void ThreatTable_TargetsBoyOrKalev()
    {
        var table = new AttentionThreatTable();
        var exposed = table.ChooseTarget(Request(Participants(protectorOnLine: false)));
        var protectedByLine = table.ChooseTarget(Request(Participants(protectorOnLine: true)));
        var tie = table.ChooseTarget(Request([
            Participant("wolf_01", EncounterRole.Aggressor, 0, 0, threat: 0, vulnerability: 0, protection: 0),
            Participant("boy", EncounterRole.Protected, 4, 0, threat: 10, vulnerability: 0, protection: 0),
            Participant("kalev", EncounterRole.Protector, 4, 2, threat: 10, vulnerability: 0, protection: 0)
        ]));

        Assert.Equal("boy", exposed.TargetId);
        Assert.Equal("kalev", protectedByLine.TargetId);
        Assert.Equal("boy", tie.TargetId);
        Assert.Contains(protectedByLine.Evaluations, evaluation => evaluation.ActorId == "boy" && evaluation.LineProtected);
    }

    private static ThreatTargetRequest Request(IReadOnlyList<EncounterParticipant> participants) => new()
    {
        EncounterId = "encounter.keep_line.fixture",
        AggressorId = "wolf_01",
        VerbId = "combat.intent.attention",
        Domain = SimDomain.Combat,
        Tick = 10,
        Participants = participants
    };

    private static IReadOnlyList<EncounterParticipant> Participants(bool protectorOnLine) =>
    [
        Participant("wolf_01", EncounterRole.Aggressor, 0, 0, threat: 0, vulnerability: 0, protection: 0),
        Participant("boy", EncounterRole.Protected, 4, 0, threat: 50, vulnerability: 20, protection: 0, noise: 3),
        Participant("kalev", EncounterRole.Protector, protectorOnLine ? 2 : 2, protectorOnLine ? 0 : 2, threat: 30, vulnerability: 0, protection: 45)
    ];

    private static EncounterParticipant Participant(
        string actorId,
        EncounterRole role,
        int x,
        int y,
        int threat,
        int vulnerability,
        int protection,
        int noise = 0) => new()
    {
        ActorId = actorId,
        Role = role,
        ThreatPriority = threat,
        Vulnerability = vulnerability,
        ProtectionStrength = protection,
        Snapshot = new SpatialActorSnapshot
        {
            ActorId = actorId,
            Position = new GridCoord(x, y),
            ZoneId = "road",
            Noise = noise
        }
    };
}
