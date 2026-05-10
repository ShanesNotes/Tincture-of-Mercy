using Tincture.Substrate.Events;

namespace Tincture.Substrate.Rules;

public enum OutcomeModifierKind
{
    Generic,
    Aura,
    Receptivity,
    RegisterMatch,
    Disparity,
    Scripted
}

public sealed record OutcomeModifier
{
    public string ModifierId { get; init; } = string.Empty;

    public string SourceId { get; init; } = string.Empty;

    public string? SourceEventId { get; init; }

    public OutcomeModifierKind Kind { get; init; } = OutcomeModifierKind.Generic;

    public int Amount { get; init; }

    public SortedDictionary<string, string> Metadata { get; init; } = new(StringComparer.Ordinal);

    public OutcomeModifier Normalize()
    {
        if (string.IsNullOrWhiteSpace(ModifierId))
        {
            throw new InvalidOperationException("OutcomeModifier.ModifierId must be non-blank.");
        }

        if (string.IsNullOrWhiteSpace(SourceId))
        {
            throw new InvalidOperationException("OutcomeModifier.SourceId must be non-blank.");
        }

        return this with { Metadata = SimEvent.StableDictionary(Metadata) };
    }
}
