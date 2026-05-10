using System.Globalization;
using Tincture.Substrate.Events;

namespace Tincture.Substrate.Combat;

public sealed class AggroCallFleeRadius
{
    public IReadOnlyList<EncounterEventCandidate> Evaluate(AggroCallFleeRequest request)
    {
        request.Validate();
        var candidates = new List<EncounterEventCandidate>();
        var inAggro = request.Distance <= request.AggroRadius;
        var outsideDisengage = request.Distance >= request.DisengageRadius;

        if (inAggro && !request.WasAggroed)
        {
            candidates.Add(Candidate(request, EncounterEventKind.AggroEntered, "aggro", new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["aggro_radius"] = request.AggroRadius.ToString(CultureInfo.InvariantCulture),
                ["distance"] = request.Distance.ToString(CultureInfo.InvariantCulture),
                ["encounter_id"] = request.EncounterId,
                ["target_id"] = request.TargetId
            }));
        }

        if (outsideDisengage && request.WasAggroed)
        {
            candidates.Add(Candidate(request, EncounterEventKind.AggroExited, "aggro", new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["disengage_radius"] = request.DisengageRadius.ToString(CultureInfo.InvariantCulture),
                ["distance"] = request.Distance.ToString(CultureInfo.InvariantCulture),
                ["encounter_id"] = request.EncounterId,
                ["target_id"] = request.TargetId
            }));
        }

        if (request.Distance <= request.PackCallRadius && !request.PackCallAlreadyEmitted && request.AlliesInCallRadius > 0)
        {
            candidates.Add(Candidate(request, EncounterEventKind.PackCallEmitted, "pack_call", new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["allies_in_call_radius"] = request.AlliesInCallRadius.ToString(CultureInfo.InvariantCulture),
                ["distance"] = request.Distance.ToString(CultureInfo.InvariantCulture),
                ["encounter_id"] = request.EncounterId,
                ["pack_call_radius"] = request.PackCallRadius.ToString(CultureInfo.InvariantCulture),
                ["target_id"] = request.TargetId
            }));
        }

        if (request.CurrentHealth <= request.FleeHealthThreshold && !request.FleeAlreadyInitiated)
        {
            candidates.Add(Candidate(request, EncounterEventKind.FleeInitiated, "flee", new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["current_health"] = request.CurrentHealth.ToString(CultureInfo.InvariantCulture),
                ["encounter_id"] = request.EncounterId,
                ["flee_health_threshold"] = request.FleeHealthThreshold.ToString(CultureInfo.InvariantCulture),
                ["target_id"] = request.TargetId
            }));
        }

        return candidates
            .OrderBy(candidate => candidate.Kind)
            .ThenBy(candidate => candidate.ActorId, StringComparer.Ordinal)
            .ThenBy(candidate => candidate.TargetId, StringComparer.Ordinal)
            .ToList()
            .AsReadOnly();
    }

    private static EncounterEventCandidate Candidate(
        AggroCallFleeRequest request,
        EncounterEventKind kind,
        string tag,
        SortedDictionary<string, string> fields)
    {
        return new EncounterEventCandidate
        {
            Kind = kind,
            Tick = request.Tick,
            ActorId = request.ActorId,
            TargetId = request.TargetId,
            VerbId = request.VerbId,
            Domain = request.Domain,
            Fields = fields,
            Tags = ["encounter_ai", tag, request.Domain.ToId()]
        }.Validate();
    }
}

public sealed record AggroCallFleeRequest
{
    public string EncounterId { get; init; } = string.Empty;

    public string ActorId { get; init; } = string.Empty;

    public string TargetId { get; init; } = string.Empty;

    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public long Tick { get; init; }

    public int Distance { get; init; }

    public int AggroRadius { get; init; }

    public int DisengageRadius { get; init; }

    public int PackCallRadius { get; init; }

    public int AlliesInCallRadius { get; init; }

    public int CurrentHealth { get; init; }

    public int FleeHealthThreshold { get; init; }

    public bool WasAggroed { get; init; }

    public bool PackCallAlreadyEmitted { get; init; }

    public bool FleeAlreadyInitiated { get; init; }

    public void Validate()
    {
        RequireNonBlank(EncounterId, nameof(EncounterId));
        RequireNonBlank(ActorId, nameof(ActorId));
        RequireNonBlank(TargetId, nameof(TargetId));
        RequireNonBlank(VerbId, nameof(VerbId));
        _ = Domain.ToId();
        if (Tick < 0 || Distance < 0 || AggroRadius < 0 || DisengageRadius < 0 || PackCallRadius < 0 || AlliesInCallRadius < 0 || CurrentHealth < 0 || FleeHealthThreshold < 0)
        {
            throw new InvalidOperationException("AggroCallFleeRequest numeric fields must be non-negative.");
        }

        if (DisengageRadius < AggroRadius)
        {
            throw new InvalidOperationException("AggroCallFleeRequest.DisengageRadius must be >= AggroRadius.");
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
