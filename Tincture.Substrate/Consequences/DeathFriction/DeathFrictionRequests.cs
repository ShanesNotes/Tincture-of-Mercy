using Tincture.Substrate.Events;

namespace Tincture.Substrate.Consequences.DeathFriction;

public sealed record DeathFrictionRequest
{
    public string RequestId { get; init; } = string.Empty;

    public string ActorId { get; init; } = string.Empty;

    public string? TargetId { get; init; }

    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public long Tick { get; init; }

    public DeathFrictionKind Kind { get; init; }

    public string Cause { get; init; } = string.Empty;

    public string? CauseEventId { get; init; }

    public bool Recoverable { get; init; }

    public BodyEligibility BodyEligibility { get; init; } = Tincture.Substrate.Consequences.DeathFriction.BodyEligibility.NotApplicable;

    public string WitnessHook { get; init; } = string.Empty;

    public string FrictionRuleId { get; init; } = string.Empty;

    public SortedDictionary<string, string> ContextFields { get; init; } = new(StringComparer.Ordinal);

    public List<string> ConsequenceTags { get; init; } = [];

    public void Validate(params DeathFrictionKind[] allowedKinds)
    {
        RequireNonBlank(RequestId, nameof(RequestId));
        RequireNonBlank(ActorId, nameof(ActorId));
        RequireNonBlank(VerbId, nameof(VerbId));
        RequireNonBlank(Cause, nameof(Cause));
        RequireNonBlank(FrictionRuleId, nameof(FrictionRuleId));
        _ = Domain.ToId();
        _ = Kind.ToId();
        _ = BodyEligibility.ToId();

        if (Tick < 0)
        {
            throw new InvalidOperationException("DeathFrictionRequest.Tick must be non-negative.");
        }

        if (allowedKinds.Length > 0 && !allowedKinds.Contains(Kind))
        {
            throw new InvalidOperationException($"DeathFrictionRequest.Kind must be one of: {string.Join(", ", allowedKinds.Select(kind => kind.ToId()))}.");
        }

        ValidateTags(ConsequenceTags);
        ValidateContextFields(ContextFields);
    }

    internal static void ValidateTags(IEnumerable<string> tags)
    {
        foreach (var tag in tags)
        {
            RequireNonBlank(tag, nameof(ConsequenceTags));
        }
    }

    internal static void ValidateContextFields(IReadOnlyDictionary<string, string> contextFields)
    {
        foreach (var (key, _) in contextFields)
        {
            RequireNonBlank(key, nameof(ContextFields));
        }
    }

    internal static void RequireNonBlank(string? value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{name} must be non-blank.");
        }
    }
}

public sealed record DeathRecoveryRequest
{
    public string RequestId { get; init; } = string.Empty;

    public string ActorId { get; init; } = string.Empty;

    public string? TargetId { get; init; }

    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public long Tick { get; init; }

    public string SourceDownedEventId { get; init; } = string.Empty;

    public string RecoveryPolicy { get; init; } = string.Empty;

    public string FrictionRuleId { get; init; } = string.Empty;

    public SortedDictionary<string, string> ContextFields { get; init; } = new(StringComparer.Ordinal);

    public List<string> ConsequenceTags { get; init; } = [];

    public void Validate()
    {
        DeathFrictionRequest.RequireNonBlank(RequestId, nameof(RequestId));
        DeathFrictionRequest.RequireNonBlank(ActorId, nameof(ActorId));
        DeathFrictionRequest.RequireNonBlank(VerbId, nameof(VerbId));
        DeathFrictionRequest.RequireNonBlank(SourceDownedEventId, nameof(SourceDownedEventId));
        DeathFrictionRequest.RequireNonBlank(RecoveryPolicy, nameof(RecoveryPolicy));
        DeathFrictionRequest.RequireNonBlank(FrictionRuleId, nameof(FrictionRuleId));
        _ = Domain.ToId();

        if (Tick < 0)
        {
            throw new InvalidOperationException("DeathRecoveryRequest.Tick must be non-negative.");
        }

        DeathFrictionRequest.ValidateTags(ConsequenceTags);
        DeathFrictionRequest.ValidateContextFields(ContextFields);
    }
}

public sealed record WitnessHookRequest
{
    public string RequestId { get; init; } = string.Empty;

    public string ActorId { get; init; } = string.Empty;

    public string TargetId { get; init; } = string.Empty;

    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public long Tick { get; init; }

    public string SourceEventId { get; init; } = string.Empty;

    public string WitnessHook { get; init; } = string.Empty;

    public SortedDictionary<string, string> ContextFields { get; init; } = new(StringComparer.Ordinal);

    public List<string> ConsequenceTags { get; init; } = [];

    public void Validate()
    {
        RequireNonBlank(RequestId, nameof(RequestId));
        RequireNonBlank(ActorId, nameof(ActorId));
        RequireNonBlank(TargetId, nameof(TargetId));
        RequireNonBlank(VerbId, nameof(VerbId));
        RequireNonBlank(SourceEventId, nameof(SourceEventId));
        RequireNonBlank(WitnessHook, nameof(WitnessHook));
        _ = Domain.ToId();

        if (Tick < 0)
        {
            throw new InvalidOperationException("WitnessHookRequest.Tick must be non-negative.");
        }

        DeathFrictionRequest.ValidateTags(ConsequenceTags);
        DeathFrictionRequest.ValidateContextFields(ContextFields);
    }

    private static void RequireNonBlank(string? value, string name) => DeathFrictionRequest.RequireNonBlank(value, name);
}
