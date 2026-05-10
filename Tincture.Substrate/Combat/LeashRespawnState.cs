using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Events;
using Tincture.Substrate.World;

namespace Tincture.Substrate.Combat;

public sealed class LeashRespawnState
{
    public IReadOnlyList<EncounterEventCandidate> Evaluate(LeashRespawnRequest request)
    {
        request.Validate();
        var candidates = new List<EncounterEventCandidate>();
        var actor = request.SpatialContext.Snapshot(request.ActorId);
        var distanceFromAnchor = actor.Position.ManhattanDistanceTo(request.Anchor);

        if (distanceFromAnchor > request.LeashRadius && !request.LeashAlreadyTriggered)
        {
            candidates.Add(new EncounterEventCandidate
            {
                Kind = EncounterEventKind.LeashTriggered,
                Tick = request.Tick,
                ActorId = request.ActorId,
                TargetId = request.TargetId,
                VerbId = request.VerbId,
                Domain = request.Domain,
                Fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    ["actor_id"] = request.ActorId,
                    ["anchor"] = request.Anchor.ToId(),
                    ["distance_from_anchor"] = distanceFromAnchor.ToString(System.Globalization.CultureInfo.InvariantCulture),
                    ["encounter_id"] = request.EncounterId,
                    ["leash_radius"] = request.LeashRadius.ToString(System.Globalization.CultureInfo.InvariantCulture)
                },
                Tags = ["encounter_ai", "leash", request.Domain.ToId()]
            }.Validate());
        }

        if (request.DeathFrictionStates.TryGetValue(request.ActorId, out var deathState) && (deathState.IsDead || deathState.IsDowned))
        {
            candidates.Add(DeathDrivenCandidate(request, deathState, EncounterEventKind.EncounterFrictionRequested, "friction"));
            candidates.Add(DeathDrivenCandidate(request, deathState, EncounterEventKind.EncounterRespawnReset, "respawn"));
        }

        return candidates
            .OrderBy(candidate => candidate.Kind)
            .ThenBy(candidate => candidate.ActorId, StringComparer.Ordinal)
            .ToList()
            .AsReadOnly();
    }

    private static EncounterEventCandidate DeathDrivenCandidate(
        LeashRespawnRequest request,
        DeathFrictionState deathState,
        EncounterEventKind kind,
        string tag)
    {
        return new EncounterEventCandidate
        {
            Kind = kind,
            Tick = request.Tick,
            ActorId = request.ActorId,
            TargetId = request.TargetId,
            VerbId = request.VerbId,
            Domain = request.Domain,
            Fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["actor_id"] = request.ActorId,
                ["death_triggered"] = "true",
                ["encounter_id"] = request.EncounterId,
                ["friction_rule_id"] = deathState.FrictionRuleId,
                ["source_death_event_id"] = deathState.LastEventId
            },
            Tags = ["encounter_ai", tag, request.Domain.ToId()]
        }.Validate();
    }
}

public sealed record LeashRespawnRequest
{
    public string EncounterId { get; init; } = string.Empty;

    public string ActorId { get; init; } = string.Empty;

    public string? TargetId { get; init; }

    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public long Tick { get; init; }

    public SpatialContext SpatialContext { get; init; } = null!;

    public GridCoord Anchor { get; init; }

    public int LeashRadius { get; init; }

    public bool LeashAlreadyTriggered { get; init; }

    public IReadOnlyDictionary<string, DeathFrictionState> DeathFrictionStates { get; init; } =
        new SortedDictionary<string, DeathFrictionState>(StringComparer.Ordinal);

    public void Validate()
    {
        RequireNonBlank(EncounterId, nameof(EncounterId));
        RequireNonBlank(ActorId, nameof(ActorId));
        RequireNonBlank(VerbId, nameof(VerbId));
        _ = Domain.ToId();
        ArgumentNullException.ThrowIfNull(SpatialContext);
        ArgumentNullException.ThrowIfNull(DeathFrictionStates);
        if (Tick < 0 || LeashRadius < 0)
        {
            throw new InvalidOperationException("LeashRespawnRequest numeric fields must be non-negative.");
        }
    }

    private static void RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{name} must be non-blank.");
        }
    }
}
