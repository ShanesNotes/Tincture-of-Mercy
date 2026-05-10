using Tincture.Substrate.Events;

namespace Tincture.Substrate.Consequences.DeathFriction;

public sealed class DeathFrictionSystem
{
    public const string SourceSystemId = "death_friction.v1";
    public const string DiedEventType = "actor_died";
    public const string DownedEventType = "actor_downed";
    public const string RecoveredEventType = "actor_recovered";
    public const string WitnessHookRecordedEventType = "witness_hook_recorded";
    public const string MoralDeathEventType = "moral_death_recorded";

    private static readonly HashSet<string> ReservedDeathFieldKeys = new(StringComparer.Ordinal)
    {
        "actor",
        "body_eligible",
        "body_eligibility",
        "cause",
        "cause_event_id",
        "consequence_tags",
        "death_friction_request_id",
        "death_kind",
        "friction_rule_id",
        "recoverable",
        "target",
        "witness_hook"
    };

    private static readonly HashSet<string> ReservedRecoveryFieldKeys = new(StringComparer.Ordinal)
    {
        "actor",
        "body_eligible",
        "body_eligibility",
        "consequence_tags",
        "death_friction_request_id",
        "death_kind",
        "friction_rule_id",
        "recoverable",
        "recovery_policy",
        "source_downed_event_id",
        "target",
        "witness_hook"
    };

    private static readonly HashSet<string> ReservedWitnessFieldKeys = new(StringComparer.Ordinal)
    {
        "actor",
        "consequence_tags",
        "source_event_id",
        "target",
        "target_actor_id",
        "witness_hook",
        "witness_request_id"
    };

    public SimEvent DeclareDeath(DeathFrictionRequest request)
    {
        request.Validate(DeathFrictionKind.FixedDeath, DeathFrictionKind.BiologicalDeath);
        return BuildDeathLikeEvent(request, DiedEventType, ["death"]);
    }

    public SimEvent MarkDowned(DeathFrictionRequest request)
    {
        request.Validate(DeathFrictionKind.Downed);
        return BuildDeathLikeEvent(request, DownedEventType, ["downed"]);
    }

    public SimEvent RecordMoralDeath(DeathFrictionRequest request)
    {
        request.Validate(DeathFrictionKind.MoralDeath);
        return BuildDeathLikeEvent(request, MoralDeathEventType, ["moral_death"]);
    }

    public SimEvent Recover(DeathRecoveryRequest request)
    {
        request.Validate();
        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["actor"] = request.ActorId,
            ["body_eligible"] = BoolId(false),
            ["body_eligibility"] = BodyEligibility.NotApplicable.ToId(),
            ["consequence_tags"] = TagsCsv(request.ConsequenceTags),
            ["death_friction_request_id"] = request.RequestId,
            ["death_kind"] = DeathFrictionKind.Recovery.ToId(),
            ["friction_rule_id"] = request.FrictionRuleId,
            ["recoverable"] = BoolId(false),
            ["recovery_policy"] = request.RecoveryPolicy,
            ["source_downed_event_id"] = request.SourceDownedEventId,
            ["witness_hook"] = string.Empty
        };
        AddOptional(fields, "target", request.TargetId);
        AddContextFields(fields, request.ContextFields, ReservedRecoveryFieldKeys);

        return new SimEvent
        {
            Tick = request.Tick,
            ActorId = request.ActorId,
            TargetId = request.TargetId,
            VerbId = request.VerbId,
            Domain = request.Domain,
            SourceSystem = SourceSystemId,
            EventType = RecoveredEventType,
            Fields = SimEvent.StableDictionary(fields),
            Results = BuildStateResults(MortalityState.Alive, recoverable: false, BodyEligibility.NotApplicable),
            Tags = SimEvent.StableTags([.. request.ConsequenceTags, "death_friction", request.Domain.ToId(), "recovery"])
        };
    }

    public SimEvent RecordWitness(WitnessHookRequest request)
    {
        request.Validate();
        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["consequence_tags"] = TagsCsv(request.ConsequenceTags),
            ["source_event_id"] = request.SourceEventId,
            ["target_actor_id"] = request.TargetId,
            ["witness_hook"] = request.WitnessHook,
            ["witness_request_id"] = request.RequestId
        };
        AddContextFields(fields, request.ContextFields, ReservedWitnessFieldKeys);

        return new SimEvent
        {
            Tick = request.Tick,
            ActorId = request.ActorId,
            TargetId = request.TargetId,
            VerbId = request.VerbId,
            Domain = request.Domain,
            SourceSystem = SourceSystemId,
            EventType = WitnessHookRecordedEventType,
            Fields = SimEvent.StableDictionary(fields),
            Tags = SimEvent.StableTags([.. request.ConsequenceTags, "death_friction", request.Domain.ToId(), "witness"])
        };
    }

    public IReadOnlyDictionary<string, DeathFrictionState> Project(IEnumerable<SimEvent> events)
    {
        ArgumentNullException.ThrowIfNull(events);
        var states = new SortedDictionary<string, DeathFrictionState>(StringComparer.Ordinal);

        foreach (var simEvent in events.OrderBy(simEvent => simEvent.Sequence))
        {
            if (!string.Equals(simEvent.SourceSystem, SourceSystemId, StringComparison.Ordinal))
            {
                continue;
            }

            if (simEvent.EventType == WitnessHookRecordedEventType)
            {
                continue;
            }

            if (!states.TryGetValue(simEvent.ActorId, out var state))
            {
                state = DeathFrictionState.Create(simEvent.ActorId);
            }

            states[simEvent.ActorId] = state.Apply(simEvent);
        }

        return states;
    }

    private static SimEvent BuildDeathLikeEvent(DeathFrictionRequest request, string eventType, IReadOnlyList<string> eventTags)
    {
        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["actor"] = request.ActorId,
            ["body_eligible"] = BoolId(request.BodyEligibility == BodyEligibility.RecoverableBody),
            ["body_eligibility"] = request.BodyEligibility.ToId(),
            ["cause"] = request.Cause,
            ["consequence_tags"] = TagsCsv(request.ConsequenceTags),
            ["death_friction_request_id"] = request.RequestId,
            ["death_kind"] = request.Kind.ToId(),
            ["friction_rule_id"] = request.FrictionRuleId,
            ["recoverable"] = BoolId(request.Recoverable),
            ["witness_hook"] = request.WitnessHook
        };
        AddOptional(fields, "cause_event_id", request.CauseEventId);
        AddOptional(fields, "target", request.TargetId);
        AddContextFields(fields, request.ContextFields, ReservedDeathFieldKeys);

        return new SimEvent
        {
            Tick = request.Tick,
            ActorId = request.ActorId,
            TargetId = request.TargetId,
            VerbId = request.VerbId,
            Domain = request.Domain,
            SourceSystem = SourceSystemId,
            EventType = eventType,
            Fields = SimEvent.StableDictionary(fields),
            Results = BuildStateResults(MortalityStateFor(request.Kind), request.Recoverable, request.BodyEligibility),
            Tags = SimEvent.StableTags([.. request.ConsequenceTags, .. eventTags, "death_friction", request.Domain.ToId(), request.Kind.ToId()])
        };
    }

    private static string TagsCsv(IEnumerable<string> tags) => string.Join(',', SimEvent.StableTags(tags));

    private static string BoolId(bool value) => value ? "true" : "false";

    private static SortedDictionary<string, string> BuildStateResults(
        MortalityState mortalityState,
        bool recoverable,
        BodyEligibility bodyEligibility)
    {
        return SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["body_eligible"] = BoolId(bodyEligibility == BodyEligibility.RecoverableBody),
            ["mortality_state"] = mortalityState.ToId(),
            ["recoverable"] = BoolId(recoverable)
        });
    }

    private static MortalityState MortalityStateFor(DeathFrictionKind kind) => kind switch
    {
        DeathFrictionKind.FixedDeath or DeathFrictionKind.BiologicalDeath => MortalityState.Dead,
        DeathFrictionKind.Downed => MortalityState.Downed,
        DeathFrictionKind.Recovery => MortalityState.Alive,
        DeathFrictionKind.MoralDeath => MortalityState.MoralDeath,
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown death/friction kind.")
    };

    private static void AddOptional(IDictionary<string, string> fields, string key, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            fields[key] = value;
        }
    }

    private static void AddContextFields(
        IDictionary<string, string> fields,
        IReadOnlyDictionary<string, string> contextFields,
        IReadOnlySet<string> reservedKeys)
    {
        foreach (var (key, value) in contextFields.OrderBy(pair => pair.Key, StringComparer.Ordinal))
        {
            if (reservedKeys.Contains(key))
            {
                throw new InvalidOperationException($"Death friction context field '{key}' is reserved.");
            }

            fields[key] = value;
        }
    }
}
