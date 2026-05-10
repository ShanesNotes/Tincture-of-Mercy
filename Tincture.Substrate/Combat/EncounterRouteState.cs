using Tincture.Substrate.Events;
using Tincture.Substrate.World;

namespace Tincture.Substrate.Combat;

public sealed class EncounterRouteState
{
    public IReadOnlyList<EncounterEventCandidate> Evaluate(EncounterRouteRequest request)
    {
        request.Validate();
        if (!request.SpatialContext.IsRouteNodeReached(request.ActorId, request.NextNodeId, request.ReachDistance))
        {
            return [];
        }

        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["actor_id"] = request.ActorId,
            ["encounter_id"] = request.EncounterId,
            ["node_id"] = request.NextNodeId,
            ["route_id"] = request.RouteId
        };

        return
        [
            new EncounterEventCandidate
            {
                Kind = EncounterEventKind.RouteNodeReached,
                Tick = request.Tick,
                ActorId = request.ActorId,
                TargetId = request.TargetId,
                VerbId = request.VerbId,
                Domain = request.Domain,
                Fields = fields,
                Tags = ["encounter_ai", "route", request.Domain.ToId()]
            }.Validate()
        ];
    }
}

public sealed record EncounterRouteRequest
{
    public string EncounterId { get; init; } = string.Empty;

    public string RouteId { get; init; } = string.Empty;

    public string ActorId { get; init; } = string.Empty;

    public string? TargetId { get; init; }

    public string NextNodeId { get; init; } = string.Empty;

    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public long Tick { get; init; }

    public int ReachDistance { get; init; }

    public SpatialContext SpatialContext { get; init; } = null!;

    public void Validate()
    {
        RequireNonBlank(EncounterId, nameof(EncounterId));
        RequireNonBlank(RouteId, nameof(RouteId));
        RequireNonBlank(ActorId, nameof(ActorId));
        RequireNonBlank(NextNodeId, nameof(NextNodeId));
        RequireNonBlank(VerbId, nameof(VerbId));
        _ = Domain.ToId();
        ArgumentNullException.ThrowIfNull(SpatialContext);
        if (Tick < 0 || ReachDistance < 0)
        {
            throw new InvalidOperationException("EncounterRouteRequest numeric fields must be non-negative.");
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
