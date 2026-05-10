using System.Globalization;
using Tincture.Substrate.Events;
using Tincture.Substrate.World;

namespace Tincture.Substrate.Combat;

public sealed class AttentionThreatTable
{
    public ThreatTargetDecision ChooseTarget(ThreatTargetRequest request)
    {
        request.Validate();
        var context = new SpatialContext(request.Participants.Select(participant => participant.Snapshot));
        var aggressor = request.Participants.Single(participant => participant.ActorId == request.AggressorId);
        var candidates = request.Participants
            .Where(participant => participant.ActorId != aggressor.ActorId)
            .Select(participant => Score(request, context, aggressor, participant))
            .OrderByDescending(evaluation => evaluation.Score)
            .ThenBy(evaluation => RolePriority(evaluation.Role))
            .ThenBy(evaluation => evaluation.ActorId, StringComparer.Ordinal)
            .ToList();

        if (candidates.Count == 0)
        {
            throw new InvalidOperationException("ThreatTargetRequest must include at least one non-aggressor candidate.");
        }

        return new ThreatTargetDecision(
            AggressorId: aggressor.ActorId,
            TargetId: candidates[0].ActorId,
            Score: candidates[0].Score,
            Evaluations: candidates.AsReadOnly());
    }

    public EncounterEventCandidate? TargetChangedCandidate(ThreatTargetRequest request)
    {
        var decision = ChooseTarget(request);
        if (string.Equals(decision.TargetId, request.PreviousTargetId, StringComparison.Ordinal))
        {
            return null;
        }

        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["aggressor_id"] = decision.AggressorId,
            ["encounter_id"] = request.EncounterId,
            ["previous_target_id"] = request.PreviousTargetId ?? string.Empty,
            ["score"] = decision.Score.ToString(CultureInfo.InvariantCulture),
            ["target_id"] = decision.TargetId,
            ["threat_table_id"] = "attention_threat_table.v1"
        };

        return new EncounterEventCandidate
        {
            Kind = EncounterEventKind.ThreatTargetChanged,
            Tick = request.Tick,
            ActorId = decision.AggressorId,
            TargetId = decision.TargetId,
            VerbId = request.VerbId,
            Domain = request.Domain,
            Fields = fields,
            Tags = ["encounter_ai", "threat", request.Domain.ToId()]
        };
    }

    private static ThreatEvaluation Score(
        ThreatTargetRequest request,
        SpatialContext context,
        EncounterParticipant aggressor,
        EncounterParticipant candidate)
    {
        var distance = Math.Max(0, context.ManhattanDistance(aggressor.ActorId, candidate.ActorId));
        var distancePressure = Math.Max(0, 10 - distance);
        var score = candidate.ThreatPriority + candidate.Vulnerability + context.NoiseAt(candidate.ActorId) + distancePressure;
        var lineProtected = false;

        if (candidate.Role == EncounterRole.Protected)
        {
            var lineProtector = request.Participants
                .Where(participant => participant.Role == EncounterRole.Protector)
                .Any(protector => context.IsProtectorOnLine(aggressor.ActorId, candidate.ActorId, protector.ActorId));
            lineProtected = lineProtector;
            if (lineProtector)
            {
                score -= request.LineProtectionShift;
            }
        }

        if (candidate.Role == EncounterRole.Protector)
        {
            var shielding = request.Participants
                .Where(participant => participant.Role == EncounterRole.Protected)
                .Any(protectedActor => context.IsProtectorOnLine(aggressor.ActorId, protectedActor.ActorId, candidate.ActorId));
            if (shielding)
            {
                score += candidate.ProtectionStrength + request.LineProtectionShift;
                lineProtected = true;
            }
        }

        return new ThreatEvaluation(candidate.ActorId, candidate.Role, score, lineProtected);
    }

    private static int RolePriority(EncounterRole role) => role switch
    {
        EncounterRole.Protected => 0,
        EncounterRole.Protector => 1,
        EncounterRole.Aggressor => 2,
        _ => throw new ArgumentOutOfRangeException(nameof(role), role, "Unknown encounter role.")
    };
}

public sealed record ThreatTargetRequest
{
    public string EncounterId { get; init; } = string.Empty;

    public string AggressorId { get; init; } = string.Empty;

    public string? PreviousTargetId { get; init; }

    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public long Tick { get; init; }

    public int LineProtectionShift { get; init; } = 30;

    public IReadOnlyList<EncounterParticipant> Participants { get; init; } = [];

    public void Validate()
    {
        RequireNonBlank(EncounterId, nameof(EncounterId));
        RequireNonBlank(AggressorId, nameof(AggressorId));
        RequireNonBlank(VerbId, nameof(VerbId));
        _ = Domain.ToId();
        if (Tick < 0)
        {
            throw new InvalidOperationException("ThreatTargetRequest.Tick must be non-negative.");
        }

        if (LineProtectionShift < 0)
        {
            throw new InvalidOperationException("ThreatTargetRequest.LineProtectionShift must be non-negative.");
        }

        if (Participants.Count == 0)
        {
            throw new InvalidOperationException("ThreatTargetRequest.Participants must not be empty.");
        }

        var normalized = Participants.Select(participant => participant.Validate()).ToList();
        if (normalized.All(participant => participant.ActorId != AggressorId))
        {
            throw new InvalidOperationException("ThreatTargetRequest.AggressorId must be present in participants.");
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

public sealed record ThreatEvaluation(string ActorId, EncounterRole Role, int Score, bool LineProtected);

public sealed record ThreatTargetDecision(
    string AggressorId,
    string TargetId,
    int Score,
    IReadOnlyList<ThreatEvaluation> Evaluations);
