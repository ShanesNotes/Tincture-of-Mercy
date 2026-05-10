using Tincture.Substrate.Events;
using Tincture.Substrate.World;

namespace Tincture.Substrate.Combat;

public enum EncounterRole
{
    Protector,
    Protected,
    Aggressor
}

public static class EncounterRoleExtensions
{
    public static string ToId(this EncounterRole role) => role switch
    {
        EncounterRole.Protector => "protector",
        EncounterRole.Protected => "protected",
        EncounterRole.Aggressor => "aggressor",
        _ => throw new ArgumentOutOfRangeException(nameof(role), role, "Unknown encounter role.")
    };

    public static EncounterRole FromId(string id) => id switch
    {
        "protector" => EncounterRole.Protector,
        "protected" => EncounterRole.Protected,
        "aggressor" => EncounterRole.Aggressor,
        _ => throw new ArgumentOutOfRangeException(nameof(id), id, "Unknown encounter role id.")
    };
}

public sealed record EncounterParticipant
{
    public string ActorId { get; init; } = string.Empty;

    public EncounterRole Role { get; init; }

    public SpatialActorSnapshot Snapshot { get; init; } = new();

    public int ThreatPriority { get; init; }

    public int Vulnerability { get; init; }

    public int ProtectionStrength { get; init; }

    public IReadOnlyList<string> Tags { get; init; } = [];

    public EncounterParticipant Validate()
    {
        if (string.IsNullOrWhiteSpace(ActorId))
        {
            throw new InvalidOperationException("EncounterParticipant.ActorId must be non-blank.");
        }

        _ = Role.ToId();
        var snapshot = Snapshot.Validate();
        if (!string.Equals(ActorId, snapshot.ActorId, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("EncounterParticipant.ActorId must match Snapshot.ActorId.");
        }

        return this with
        {
            Snapshot = snapshot,
            Tags = Tags
                .Where(tag => !string.IsNullOrWhiteSpace(tag))
                .Select(tag => tag.Trim())
                .Distinct(StringComparer.Ordinal)
                .Order(StringComparer.Ordinal)
                .ToList()
                .AsReadOnly()
        };
    }
}

public enum EncounterEventKind
{
    SpatialBandChanged,
    ThreatTargetChanged,
    AggroEntered,
    AggroExited,
    PackCallEmitted,
    FleeInitiated,
    LeashTriggered,
    RouteNodeReached,
    EncounterFrictionRequested,
    EncounterRespawnReset
}

public sealed record EncounterEventCandidate
{
    public EncounterEventKind Kind { get; init; }

    public long Tick { get; init; }

    public string ActorId { get; init; } = string.Empty;

    public string? TargetId { get; init; }

    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public SortedDictionary<string, string> Fields { get; init; } = new(StringComparer.Ordinal);

    public IReadOnlyList<string> Tags { get; init; } = [];

    public EncounterEventCandidate Validate()
    {
        if (Tick < 0)
        {
            throw new InvalidOperationException("EncounterEventCandidate.Tick must be non-negative.");
        }

        if (string.IsNullOrWhiteSpace(ActorId))
        {
            throw new InvalidOperationException("EncounterEventCandidate.ActorId must be non-blank.");
        }

        if (string.IsNullOrWhiteSpace(VerbId))
        {
            throw new InvalidOperationException("EncounterEventCandidate.VerbId must be non-blank.");
        }

        _ = Domain.ToId();
        _ = Kind.ToString();
        return this with
        {
            Fields = SimEvent.StableDictionary(Fields),
            Tags = SimEvent.StableTags(Tags)
        };
    }
}
