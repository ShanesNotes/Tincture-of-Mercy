using Tincture.Substrate.Events;
using Tincture.Substrate.Sim;

namespace Tincture.Substrate.Rules;

public sealed record ResolverRoll(
    string RollKind,
    int Value,
    int Total,
    string? FixtureId,
    RollResult? SeededRoll);

public sealed record ResolvedOutcome
{
    public string RequestId { get; init; } = string.Empty;

    public string ResolverId { get; init; } = OutcomeResolver.ResolverId;

    public string TableId { get; init; } = string.Empty;

    public string OutcomeKey { get; init; } = string.Empty;

    public bool Succeeded { get; init; }

    public int TotalModifier { get; init; }

    public ResolverRoll Roll { get; init; } = new("none", 0, 0, null, null);

    public IReadOnlyList<OutcomeModifier> AppliedModifiers { get; init; } = [];

    public IReadOnlyList<SimEvent> Events { get; init; } = [];

    public SortedDictionary<string, string> Metadata { get; init; } = new(StringComparer.Ordinal);
}
