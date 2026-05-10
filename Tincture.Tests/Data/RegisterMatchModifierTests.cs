using Tincture.Substrate.Data;
using Tincture.Tests.Rules;

namespace Tincture.Tests.Data;

public sealed class RegisterMatchModifierTests
{
    [Fact]
    public void RegisterMatchModifier_ToOutcomeModifierFailsFastForUnsupportedVoiceRegister()
    {
        var registerMatch = RegisterMatchModifier.FromProfile(
            path: LatentPath.Apothecary,
            voiceRegister: (VoiceRegister)999,
            profile: OutcomeTestData.BethanyReceptivity());

        var exception = Assert.Throws<ArgumentOutOfRangeException>(() => registerMatch.ToOutcomeModifier());

        Assert.Equal("voiceRegister", exception.ParamName);
    }
}
