using Tincture.Substrate.Actors;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;

namespace Tincture.Tests.Actors;

public sealed class ActorStateTests
{
    [Fact]
    public void ActorState_ResourcesChangeFromEvents()
    {
        var actor = ActorState.Create("kalev");
        var ledger = new CostLedger();
        var stream = new SimEventStream();
        var cost = ledger.ApplyCosts(actor, new CostRequest
        {
            RequestId = "resource-replay-001",
            ActorId = actor.ActorId,
            VerbId = "care.tincture.administer",
            Domain = SimDomain.Care,
            Tick = 40,
            Cause = "steady_hands",
            ResourceCosts = new SortedDictionary<ResourceKey, int>
            {
                [ResourceKey.Pressure] = 0,
                [ResourceKey.Steady] = 4
            }
        });

        var appended = stream.AppendBatch(cost.Events);
        var replayJson = stream.ToStableJson();
        var replayedEvents = SimEventStream.FromStableJson(replayJson).Events;
        var directState = actor.Apply(appended);
        var replayedState = actor.Apply(replayedEvents);

        Assert.Equal(16, directState.Resource(ResourceKey.Steady));
        Assert.Equal(directState.Resource(ResourceKey.Steady), replayedState.Resource(ResourceKey.Steady));
        Assert.All(appended, simEvent =>
        {
            Assert.True(simEvent.Fields.ContainsKey("old_value"));
            Assert.True(simEvent.Fields.ContainsKey("new_value"));
            Assert.True(simEvent.Fields.ContainsKey("delta"));
            Assert.True(simEvent.Fields.ContainsKey("resource_key"));
            Assert.True(simEvent.Fields.ContainsKey("cause"));
        });
    }

    [Fact]
    public void ActorState_ReplayProducesSameStateWhenEventsAreReorderedBySequence()
    {
        var actor = ActorState.Create("kalev");
        var ledger = new CostLedger();
        var stream = new SimEventStream();
        var first = ledger.ApplyCosts(actor, Cost(ResourceKey.Steady, 3, 1));
        var afterFirst = actor.Apply(stream.AppendBatch(first.Events));
        var second = ledger.ApplyCosts(afterFirst, Cost(ResourceKey.Spirit, 2, 2));
        var appended = stream.AppendBatch(second.Events);

        var reversed = appended.Concat(stream.Events.Take(1)).Reverse().ToList();
        var replayed = actor.Apply(reversed);

        Assert.Equal(17, replayed.Resource(ResourceKey.Steady));
        Assert.Equal(18, replayed.Resource(ResourceKey.Spirit));
    }

    [Fact]
    public void ActorState_IgnoresPresenterOnlyEvents()
    {
        var actor = ActorState.Create("kalev");
        var presenterEvent = new SimEvent
        {
            Tick = 1,
            ActorId = "kalev",
            VerbId = "debug.presenter.render",
            Domain = SimDomain.Debug,
            SourceSystem = "debug_presenter.v1",
            EventType = "presenter_rendered",
            Fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["surface"] = "debug"
            }
        };

        var projected = actor.Apply(new SimEventStream().AppendBatch([presenterEvent]));

        Assert.Equal(actor.Resource(ResourceKey.Health), projected.Resource(ResourceKey.Health));
        Assert.Empty(projected.ActiveAuras);
    }

    [Fact]
    public void ActorState_DerivedStatsRecomputeFromAuras()
    {
        var actor = ActorState.Create("kalev", new StatBlock { Body = 3, Spirit = 2, Care = 4, Nerve = 5, Attention = 6 });
        var baseStability = actor.DerivedStats.ActionStability;
        var auraSystem = new AuraSystem();
        var stream = new SimEventStream();
        var aura = new AuraDefinition
        {
            AuraId = "aura.tincture_calm",
            DurationTicks = 10,
            MaxStacks = 2,
            ModifierId = "aura.tincture_calm.steady",
            ModifierAmount = 3,
            DerivedStatKey = DerivedStatKey.ActionStability,
            DerivedStatDelta = 2
        };

        var applied = actor.Apply(stream.AppendBatch([auraSystem.ApplyAura(actor, aura, 5, "care.tincture.administer", SimDomain.Care)]));
        var stacked = applied.Apply(stream.AppendBatch([auraSystem.ApplyAura(applied, aura, 6, "care.tincture.administer", SimDomain.Care)]));
        var expired = stacked.Apply(stream.AppendBatch(auraSystem.ExpireByTick(stacked, 16)));

        Assert.Equal(baseStability + 2, applied.DerivedStats.ActionStability);
        Assert.Equal(baseStability + 4, stacked.DerivedStats.ActionStability);
        Assert.Equal(baseStability, expired.DerivedStats.ActionStability);
    }

    private static CostRequest Cost(ResourceKey key, int amount, long tick) => new()
    {
        RequestId = $"cost-{tick}",
        ActorId = "kalev",
        VerbId = "debug.resource.spend",
        Domain = SimDomain.Debug,
        Tick = tick,
        Cause = "replay_order",
        ResourceCosts = new SortedDictionary<ResourceKey, int>
        {
            [key] = amount
        }
    };
}
