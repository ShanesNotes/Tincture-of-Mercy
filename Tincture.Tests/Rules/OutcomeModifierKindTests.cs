using Tincture.Substrate.Rules;

namespace Tincture.Tests.Rules;

public sealed class OutcomeModifierKindTests
{
    [Theory]
    [InlineData(OutcomeModifierKind.Generic, "generic")]
    [InlineData(OutcomeModifierKind.Aura, "aura")]
    [InlineData(OutcomeModifierKind.Receptivity, "receptivity")]
    [InlineData(OutcomeModifierKind.RegisterMatch, "register_match")]
    [InlineData(OutcomeModifierKind.Disparity, "disparity")]
    [InlineData(OutcomeModifierKind.Scripted, "scripted")]
    public void OutcomeModifierKind_ToIdUsesExplicitStableIds(OutcomeModifierKind kind, string id)
    {
        Assert.Equal(id, kind.ToId());
        Assert.Equal(kind, OutcomeModifierKindExtensions.FromId(id));
    }

    [Fact]
    public void OutcomeModifierKind_ToIdThrowsForUnknownValues()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => ((OutcomeModifierKind)999).ToId());
        Assert.Throws<ArgumentOutOfRangeException>(() => OutcomeModifierKindExtensions.FromId("future_kind"));
    }
}
