using Tincture.Substrate.Actors;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;

namespace Tincture.Tests.Rules;

public sealed class CostLedgerTests
{
    [Fact]
    public void CostLedger_AppliesCareAndCombatCostsThroughOneApi()
    {
        var actor = ActorState.Create("kalev");
        var ledger = new CostLedger();
        var stream = new SimEventStream();

        var care = ledger.ApplyCosts(actor, new CostRequest
        {
            RequestId = "care-cost-001",
            ActorId = actor.ActorId,
            VerbId = "care.bread.offer",
            Domain = SimDomain.Care,
            Tick = 10,
            Cause = "offer_bread",
            ResourceCosts = new SortedDictionary<ResourceKey, int>
            {
                [ResourceKey.Steady] = 2
            }
        });
        var afterCare = actor.Apply(stream.AppendBatch(care.Events));
        var combat = ledger.ApplyCosts(afterCare, new CostRequest
        {
            RequestId = "combat-cost-001",
            ActorId = actor.ActorId,
            VerbId = "combat.protect.shove",
            Domain = SimDomain.Combat,
            Tick = 11,
            Cause = "guard_boy",
            ResourceCosts = new SortedDictionary<ResourceKey, int>
            {
                [ResourceKey.Health] = 3,
                [ResourceKey.Spirit] = 1
            }
        });
        var afterCombat = afterCare.Apply(stream.AppendBatch(combat.Events));
        var craft = ledger.ApplyCosts(afterCombat, new CostRequest
        {
            RequestId = "craft-cost-001",
            ActorId = actor.ActorId,
            VerbId = "craft.tincture.prepare",
            Domain = SimDomain.Craft,
            Tick = 12,
            Cause = "prepare_tincture",
            ResourceCosts = new SortedDictionary<ResourceKey, int>
            {
                [ResourceKey.Steady] = 1
            }
        });

        Assert.True(care.Succeeded);
        Assert.True(combat.Succeeded);
        Assert.True(craft.Succeeded);
        var replayed = afterCombat.Apply(stream.AppendBatch(craft.Events));
        var appended = stream.Events;

        Assert.All(appended, simEvent => Assert.Equal(CostLedger.SourceSystemId, simEvent.SourceSystem));
        Assert.Equal(17, replayed.Resource(ResourceKey.Steady));
        Assert.Equal(17, replayed.Resource(ResourceKey.Health));
        Assert.Equal(19, replayed.Resource(ResourceKey.Spirit));
        Assert.Contains(appended, simEvent => simEvent.Domain == SimDomain.Care && simEvent.Fields["resource_key"] == "steady");
        Assert.Contains(appended, simEvent => simEvent.Domain == SimDomain.Combat && simEvent.Fields["resource_key"] == "health");
        Assert.Contains(appended, simEvent => simEvent.Domain == SimDomain.Craft && simEvent.Fields["resource_key"] == "steady");
    }

    [Fact]
    public void CostLedger_RejectsOverspendWithoutStateMutation()
    {
        var actor = ActorState.Create("kalev");
        var ledger = new CostLedger();

        var result = ledger.ApplyCosts(actor, new CostRequest
        {
            RequestId = "overspend-001",
            ActorId = actor.ActorId,
            VerbId = "combat.attack.resolve",
            Domain = SimDomain.Combat,
            Tick = 20,
            Cause = "overextend",
            ResourceCosts = new SortedDictionary<ResourceKey, int>
            {
                [ResourceKey.Health] = 999
            }
        });

        Assert.False(result.Succeeded);
        Assert.Single(result.Events);
        Assert.Equal("cost_rejected", result.Events.Single().EventType);
        Assert.Equal("health", result.Events.Single().Fields["insufficient_resources"]);
        Assert.Equal(actor.Resource(ResourceKey.Health), actor.Apply(result.Events).Resource(ResourceKey.Health));
    }

    [Fact]
    public void CostLedger_RecordsSignedDeltasForAllResourceProfileKeys()
    {
        var profiles = Enum.GetValues<ResourceKey>()
            .Select(key => new ResourceProfile { Key = key, Min = 0, Max = 100, StartingValue = 10 });
        var actor = ActorState.Create("kalev", profiles: profiles);
        var ledger = new CostLedger();
        var costs = new SortedDictionary<ResourceKey, int>(Enum.GetValues<ResourceKey>().ToDictionary(key => key, _ => 1));

        var result = ledger.ApplyCosts(actor, new CostRequest
        {
            RequestId = "all-resources-001",
            ActorId = actor.ActorId,
            VerbId = "debug.resource.spend",
            Domain = SimDomain.Debug,
            Tick = 30,
            Cause = "schema_check",
            ResourceCosts = costs
        });

        Assert.True(result.Succeeded);
        Assert.Equal(Enum.GetValues<ResourceKey>().Length, result.Events.Count);
        Assert.Equal(
            Enum.GetValues<ResourceKey>().Select(key => key.ToId()).Order(StringComparer.Ordinal),
            result.Events.Select(simEvent => simEvent.Fields["resource_key"]).Order(StringComparer.Ordinal));
        Assert.All(result.Events, simEvent => Assert.StartsWith("-", simEvent.Fields["delta"], StringComparison.Ordinal));
    }
}
