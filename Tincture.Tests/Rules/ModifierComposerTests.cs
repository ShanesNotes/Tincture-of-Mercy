using Tincture.Substrate.Rules;

namespace Tincture.Tests.Rules;

public sealed class ModifierComposerTests
{
    [Fact]
    public void ModifierComposer_AddsAmountsWithNamedRule()
    {
        var composer = new ModifierComposer();

        var composition = composer.Compose(
        [
            new OutcomeModifier
            {
                ModifierId = "aura.tincture_calm",
                SourceId = "aura_system",
                Kind = OutcomeModifierKind.Aura,
                Amount = 4
            },
            new OutcomeModifier
            {
                ModifierId = "disparity.pack_pressure",
                SourceId = "disparity",
                Kind = OutcomeModifierKind.Disparity,
                Amount = -2
            }
        ]);

        Assert.Equal(ModifierComposer.CompositionRuleId, composition.RuleId);
        Assert.Equal(2, composition.Total);
        Assert.Equal(["aura.tincture_calm", "disparity.pack_pressure"], composition.Modifiers.Select(modifier => modifier.ModifierId));
    }
}
