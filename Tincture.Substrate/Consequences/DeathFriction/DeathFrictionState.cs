using Tincture.Substrate.Events;

namespace Tincture.Substrate.Consequences.DeathFriction;

public sealed record DeathFrictionState
{
    public string ActorId { get; init; } = string.Empty;

    public DeathFrictionKind? CurrentKind { get; init; }

    public bool IsDowned => CurrentKind == DeathFrictionKind.Downed;

    public bool IsDead => CurrentKind is DeathFrictionKind.FixedDeath or DeathFrictionKind.BiologicalDeath;

    public bool IsMoralDeath => CurrentKind == DeathFrictionKind.MoralDeath;

    public bool Recoverable { get; init; }

    public BodyEligibility BodyEligibility { get; init; } = Tincture.Substrate.Consequences.DeathFriction.BodyEligibility.NotApplicable;

    public bool BodyEligible => BodyEligibility == Tincture.Substrate.Consequences.DeathFriction.BodyEligibility.RecoverableBody;

    public string WitnessHook { get; init; } = string.Empty;

    public string FrictionRuleId { get; init; } = string.Empty;

    public string LastEventId { get; init; } = string.Empty;

    public long UpdatedTick { get; init; }

    public IReadOnlyList<string> ConsequenceTags { get; init; } = [];

    public static DeathFrictionState Create(string actorId)
    {
        if (string.IsNullOrWhiteSpace(actorId))
        {
            throw new ArgumentException("Actor id must be non-blank.", nameof(actorId));
        }

        return new DeathFrictionState { ActorId = actorId };
    }

    public DeathFrictionState Apply(SimEvent simEvent)
    {
        if (!string.Equals(simEvent.ActorId, ActorId, StringComparison.Ordinal))
        {
            return this;
        }

        if (!string.Equals(simEvent.SourceSystem, DeathFrictionSystem.SourceSystemId, StringComparison.Ordinal))
        {
            return this;
        }

        return simEvent.EventType switch
        {
            DeathFrictionSystem.DiedEventType => ApplyTerminalOrDowned(simEvent),
            DeathFrictionSystem.DownedEventType => ApplyTerminalOrDowned(simEvent),
            DeathFrictionSystem.MoralDeathEventType => ApplyTerminalOrDowned(simEvent),
            DeathFrictionSystem.RecoveredEventType => ApplyRecovery(simEvent),
            _ => this
        };
    }

    private DeathFrictionState ApplyTerminalOrDowned(SimEvent simEvent)
    {
        var kind = DeathFrictionKindExtensions.FromId(Required(simEvent.Fields, "death_kind"));
        return this with
        {
            CurrentKind = kind,
            Recoverable = BoolField(simEvent, "recoverable"),
            BodyEligibility = BodyEligibilityExtensions.FromId(Required(simEvent.Fields, "body_eligibility")),
            WitnessHook = FieldOrEmpty(simEvent, "witness_hook"),
            FrictionRuleId = FieldOrEmpty(simEvent, "friction_rule_id"),
            LastEventId = simEvent.Id,
            UpdatedTick = simEvent.Tick,
            ConsequenceTags = TagsFromEvent(simEvent)
        };
    }

    private DeathFrictionState ApplyRecovery(SimEvent simEvent)
    {
        return this with
        {
            CurrentKind = null,
            Recoverable = false,
            BodyEligibility = Tincture.Substrate.Consequences.DeathFriction.BodyEligibility.NotApplicable,
            WitnessHook = FieldOrEmpty(simEvent, "witness_hook"),
            FrictionRuleId = FieldOrEmpty(simEvent, "friction_rule_id"),
            LastEventId = simEvent.Id,
            UpdatedTick = simEvent.Tick,
            ConsequenceTags = TagsFromEvent(simEvent)
        };
    }

    private static bool BoolField(SimEvent simEvent, string key)
    {
        return bool.TryParse(Required(simEvent.Fields, key), out var value)
            ? value
            : throw new InvalidOperationException($"Death friction event has invalid {key}.");
    }

    private static IReadOnlyList<string> TagsFromEvent(SimEvent simEvent)
    {
        return FieldOrEmpty(simEvent, "consequence_tags")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Order(StringComparer.Ordinal)
            .ToList()
            .AsReadOnly();
    }

    private static string Required(IReadOnlyDictionary<string, string> fields, string key)
    {
        return fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : throw new InvalidOperationException($"Death friction event is missing {key}.");
    }

    private static string FieldOrEmpty(SimEvent simEvent, string key)
    {
        return simEvent.Fields.TryGetValue(key, out var value) ? value : string.Empty;
    }
}
