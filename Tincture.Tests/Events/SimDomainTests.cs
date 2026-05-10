using Tincture.Substrate.Events;

namespace Tincture.Tests.Events;

public sealed class SimDomainTests
{
    [Theory]
    [InlineData(SimDomain.Care, "care")]
    [InlineData(SimDomain.Craft, "craft")]
    [InlineData(SimDomain.Combat, "combat")]
    [InlineData(SimDomain.Witness, "witness")]
    [InlineData(SimDomain.Economy, "economy")]
    [InlineData(SimDomain.Progression, "progression")]
    [InlineData(SimDomain.Notebook, "notebook")]
    [InlineData(SimDomain.Debug, "debug")]
    public void SimDomain_ToIdUsesExplicitStableIds(SimDomain domain, string id)
    {
        Assert.Equal(id, domain.ToId());
        Assert.Equal(domain, SimDomainExtensions.FromId(id));
    }

    [Fact]
    public void SimDomain_ToIdThrowsForUnknownValues()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => ((SimDomain)999).ToId());
        Assert.Throws<ArgumentOutOfRangeException>(() => SimDomainExtensions.FromId("aftermath"));
    }
}
