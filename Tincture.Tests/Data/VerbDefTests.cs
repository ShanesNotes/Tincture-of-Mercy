using Tincture.Substrate.Actors;
using Tincture.Substrate.Data;
using Tincture.Substrate.Events;
using Tincture.Tests.Rules;

namespace Tincture.Tests.Data;

public sealed class VerbDefTests
{
    [Fact]
    public void VerbDef_RequiresCostDomainTableTimerAndPresenterKey()
    {
        var valid = CareVerb().Validate();

        Assert.Equal("care.tincture.administer", valid.VerbId);
        Assert.Equal(SimDomain.Care, valid.Domain);
        Assert.Equal("care.tincture.v1", valid.OutcomeTable.TableId);
        Assert.Equal("timer.cast.fixture", valid.TimerId);
        Assert.Equal("presenter.care.tincture", valid.PresenterKey);
        Assert.Equal(["tincture"], valid.RequiredItemIds);
        Assert.Equal(["care", "tincture"], valid.Tags);

        Assert.Throws<InvalidOperationException>(() => (CareVerb() with { ResourceCosts = new SortedDictionary<ResourceKey, int>() }).Validate());
        Assert.Throws<InvalidOperationException>(() => (CareVerb() with { ResourceCosts = new SortedDictionary<ResourceKey, int> { [ResourceKey.Steady] = -1 } }).Validate());
        Assert.Throws<InvalidOperationException>(() => (CareVerb() with { OutcomeTable = new() }).Validate());
        Assert.Throws<InvalidOperationException>(() => (CareVerb() with { TimerId = string.Empty }).Validate());
        Assert.Throws<InvalidOperationException>(() => (CareVerb() with { PresenterKey = string.Empty }).Validate());
        Assert.Throws<ArgumentOutOfRangeException>(() => (CareVerb() with { Domain = (SimDomain)999 }).Validate());
    }

    [Fact]
    public void AbilityAndItemDef_ValidateNestedVerbAndPresenterRows()
    {
        var ability = new AbilityDef
        {
            AbilityId = "ability.care.tincture",
            Verb = CareVerb(),
            PresenterKey = "presenter.ability.tincture",
            Tags = ["tincture", "care"]
        }.Validate();
        var item = new ItemDef
        {
            ItemId = "item.tincture",
            PresenterKey = "presenter.item.tincture",
            VerbIds = ["care.tincture.administer"],
            Tags = ["tincture", "consumable"]
        }.Validate();

        Assert.Equal("care.tincture.administer", ability.Verb.VerbId);
        Assert.Equal(["care", "tincture"], ability.Tags);
        Assert.Equal(["care.tincture.administer"], item.VerbIds);
        Assert.Equal(["consumable", "tincture"], item.Tags);
        Assert.Throws<InvalidOperationException>(() => (ability with { AbilityId = string.Empty }).Validate());
        Assert.Throws<InvalidOperationException>(() => (ability with { Verb = CareVerb() with { TimerId = string.Empty } }).Validate());
        Assert.Throws<InvalidOperationException>(() => (item with { ItemId = string.Empty }).Validate());
        Assert.Throws<InvalidOperationException>(() => (item with { VerbIds = [""] }).Validate());
    }

    private static VerbDef CareVerb() => new()
    {
        VerbId = "care.tincture.administer",
        Domain = SimDomain.Care,
        OutcomeTable = OutcomeTestData.TinctureTable(),
        ResourceCosts = new SortedDictionary<ResourceKey, int>
        {
            [ResourceKey.Steady] = 1
        },
        TimerId = "timer.cast.fixture",
        CooldownId = "cooldown.care.tincture",
        PresenterKey = "presenter.care.tincture",
        RequiredItemIds = ["tincture"],
        Tags = ["tincture", "care"]
    };
}
