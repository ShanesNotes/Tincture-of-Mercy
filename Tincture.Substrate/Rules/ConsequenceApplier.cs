using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Events;

namespace Tincture.Substrate.Rules;

public sealed class ConsequenceApplier
{
    private readonly DeathFrictionSystem deathFrictionSystem;

    public ConsequenceApplier(DeathFrictionSystem? deathFrictionSystem = null)
    {
        this.deathFrictionSystem = deathFrictionSystem ?? new DeathFrictionSystem();
    }

    public ConsequenceApplierResult Apply(ConsequenceApplierRequest request)
    {
        request.Validate();

        var events = request.SourceEvents
            .Where(IsResolvedOutcome)
            .SelectMany((simEvent, index) => BuildDeathFrictionEvents(request.InvocationId, simEvent, index + 1))
            .ToList()
            .AsReadOnly();

        return new ConsequenceApplierResult(events);
    }

    public IReadOnlyDictionary<string, DeathFrictionState> ProjectDeathFriction(IEnumerable<SimEvent> events)
    {
        return deathFrictionSystem.Project(events);
    }

    private IEnumerable<SimEvent> BuildDeathFrictionEvents(string invocationId, SimEvent outcomeEvent, int outcomeIndex)
    {
        if (!outcomeEvent.Results.TryGetValue("death_kind", out var deathKindId))
        {
            yield break;
        }

        var kind = DeathFrictionKindExtensions.FromId(deathKindId);
        var actorId = ValueOrDefault(outcomeEvent.Results, "death_actor_id", outcomeEvent.TargetId ?? outcomeEvent.ActorId);
        var targetId = ValueOrDefault(outcomeEvent.Results, "death_target_id", outcomeEvent.ActorId);
        var requestId = ValueOrDefault(outcomeEvent.Results, "death_friction_request_id", $"{invocationId}.death.{outcomeIndex:D3}");
        var bodyEligibility = outcomeEvent.Results.TryGetValue("body_eligibility", out var bodyEligibilityId)
            ? BodyEligibilityExtensions.FromId(bodyEligibilityId)
            : BodyEligibility.NotApplicable;
        var recoverable = outcomeEvent.Results.TryGetValue("recoverable", out var recoverableId) && ParseBool(recoverableId);
        var witnessHook = ValueOrDefault(outcomeEvent.Results, "witness_hook", string.Empty);
        var frictionRuleId = ValueOrDefault(
            outcomeEvent.Results,
            "friction_rule_id",
            $"friction.{kind.ToId()}.from_outcome.v1");
        var cause = ValueOrDefault(outcomeEvent.Results, "death_cause", outcomeEvent.VerbId);
        var consequenceTags = TagsFrom(outcomeEvent.Results, "consequence_tags", outcomeEvent.Tags);
        var contextFields = DeathContextFields(outcomeEvent.Results);

        var request = new DeathFrictionRequest
        {
            RequestId = requestId,
            ActorId = actorId,
            TargetId = targetId,
            VerbId = outcomeEvent.VerbId,
            Domain = outcomeEvent.Domain,
            Tick = outcomeEvent.Tick,
            Kind = kind,
            Cause = cause,
            CauseEventId = outcomeEvent.Id,
            Recoverable = recoverable,
            BodyEligibility = bodyEligibility,
            WitnessHook = witnessHook,
            FrictionRuleId = frictionRuleId,
            ContextFields = contextFields,
            ConsequenceTags = consequenceTags
        };

        yield return kind switch
        {
            DeathFrictionKind.FixedDeath or DeathFrictionKind.BiologicalDeath => deathFrictionSystem.DeclareDeath(request),
            DeathFrictionKind.Downed => deathFrictionSystem.MarkDowned(request),
            DeathFrictionKind.MoralDeath => deathFrictionSystem.RecordMoralDeath(request),
            _ => throw new InvalidOperationException("Death recovery requires a source downed event and is not derived from outcome_resolved in B5b.")
        };
    }

    private static bool IsResolvedOutcome(SimEvent simEvent)
    {
        return string.Equals(simEvent.SourceSystem, OutcomeResolver.ResolverId, StringComparison.Ordinal)
            && string.Equals(simEvent.EventType, OutcomeResolver.ResolvedEventType, StringComparison.Ordinal);
    }

    private static SortedDictionary<string, string> DeathContextFields(IReadOnlyDictionary<string, string> results)
    {
        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var (key, value) in results.OrderBy(pair => pair.Key, StringComparer.Ordinal))
        {
            if (key.StartsWith("death_context_", StringComparison.Ordinal))
            {
                fields[key["death_context_".Length..]] = value;
            }
        }

        if (results.TryGetValue("loot_hook", out var lootHook))
        {
            fields["loot_hook"] = lootHook;
        }

        return fields;
    }

    private static List<string> TagsFrom(
        IReadOnlyDictionary<string, string> values,
        string key,
        IEnumerable<string> defaultTags)
    {
        if (!values.TryGetValue(key, out var csv) || string.IsNullOrWhiteSpace(csv))
        {
            return SimEvent.StableTags(defaultTags);
        }

        return SimEvent.StableTags(csv.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries));
    }

    private static string ValueOrDefault(IReadOnlyDictionary<string, string> values, string key, string defaultValue)
    {
        return values.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : defaultValue;
    }

    private static bool ParseBool(string value) => value switch
    {
        "true" => true,
        "false" => false,
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, "Expected true or false.")
    };
}

public sealed record ConsequenceApplierRequest
{
    public string InvocationId { get; init; } = string.Empty;

    public IReadOnlyList<SimEvent> SourceEvents { get; init; } = [];

    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(InvocationId))
        {
            throw new InvalidOperationException("ConsequenceApplierRequest.InvocationId must be non-blank.");
        }

        ArgumentNullException.ThrowIfNull(SourceEvents);
    }
}

public sealed record ConsequenceApplierResult(IReadOnlyList<SimEvent> Events);
