namespace Tincture.Substrate.Rules;

public sealed class ModifierComposer
{
    public const string CompositionRuleId = "modifier_composer.additive.v1";

    public ModifierComposition Compose(IEnumerable<OutcomeModifier> modifiers)
    {
        var normalized = modifiers
            .Select(modifier => modifier.Normalize())
            .ToList()
            .AsReadOnly();

        return new ModifierComposition(
            CompositionRuleId,
            normalized.Sum(modifier => modifier.Amount),
            normalized);
    }
}

public sealed record ModifierComposition(
    string RuleId,
    int Total,
    IReadOnlyList<OutcomeModifier> Modifiers);
