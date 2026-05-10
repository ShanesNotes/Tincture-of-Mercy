using Tincture.Substrate.Rules;

namespace Tincture.Substrate.Actors;

public sealed record AuraDefinition
{
    public string AuraId { get; init; } = string.Empty;

    public long DurationTicks { get; init; }

    public int MaxStacks { get; init; } = 1;

    public string ModifierId { get; init; } = string.Empty;

    public OutcomeModifierKind ModifierKind { get; init; } = OutcomeModifierKind.Aura;

    public int ModifierAmount { get; init; }

    public DerivedStatKey? DerivedStatKey { get; init; }

    public int DerivedStatDelta { get; init; }

    public AuraDefinition Validate()
    {
        if (string.IsNullOrWhiteSpace(AuraId))
        {
            throw new InvalidOperationException("AuraDefinition.AuraId must be non-blank.");
        }

        if (DurationTicks <= 0)
        {
            throw new InvalidOperationException("AuraDefinition.DurationTicks must be positive.");
        }

        if (MaxStacks <= 0)
        {
            throw new InvalidOperationException("AuraDefinition.MaxStacks must be positive.");
        }

        if (string.IsNullOrWhiteSpace(ModifierId))
        {
            throw new InvalidOperationException("AuraDefinition.ModifierId must be non-blank.");
        }

        return this;
    }
}
