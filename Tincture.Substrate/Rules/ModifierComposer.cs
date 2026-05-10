namespace Tincture.Substrate.Rules;

public sealed class ModifierComposer
{
    public const string CompositionRuleId = "modifier_composer.additive.v1";

    public ModifierComposition Compose(IEnumerable<OutcomeModifier> modifiers)
    {
        // ModifierAssembler owns normalization and ordering; the composer owns only the composition rule.
        var orderedModifiers = modifiers
            .ToList()
            .AsReadOnly();

        return new ModifierComposition(
            CompositionRuleId,
            orderedModifiers.Sum(modifier => modifier.Amount),
            orderedModifiers);
    }
}

public sealed record ModifierComposition(
    string RuleId,
    int Total,
    IReadOnlyList<OutcomeModifier> Modifiers);
