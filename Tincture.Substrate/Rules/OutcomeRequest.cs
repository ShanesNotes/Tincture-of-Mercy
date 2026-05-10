using Tincture.Substrate.Events;
using Tincture.Substrate.Sim;

namespace Tincture.Substrate.Rules;

public sealed record OutcomeRequest
{
    public string RequestId { get; init; } = string.Empty;

    public string ActorId { get; init; } = string.Empty;

    public string? TargetId { get; init; }

    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public long Tick { get; init; }

    public OutcomeTable Table { get; init; } = new();

    public IReadOnlyList<OutcomeModifier> Modifiers { get; init; } = [];

    public SeededRng? Rng { get; init; }

    public int? ScriptedRollValue { get; init; }

    public string? ScriptedFixtureId { get; init; }

    public string? ScriptedEntryId { get; init; }
}
