using Tincture.Substrate.Actors;
using Tincture.Substrate.Events;

namespace Tincture.Tests.Actors;

public sealed class CooldownStateTests
{
    [Fact]
    public void CooldownState_FsrVigilDataRowStartReadyUnavailableReplay()
    {
        var actor = ActorState.Create("kalev");
        var cooldownSystem = new CooldownSystem();
        var stream = new SimEventStream();
        var fsrVigil = FsrVigilDataRow();
        var request = new CooldownRequest
        {
            RequestId = "fsr-vigil-001",
            VerbId = "care.tincture.self_administer",
            Domain = SimDomain.Care,
            Tick = 5
        };

        var started = cooldownSystem.Start(actor, fsrVigil, request);
        Assert.True(started.Succeeded);
        var afterStart = actor.Apply(stream.AppendBatch(started.Events));

        var unavailable = cooldownSystem.Start(afterStart, fsrVigil, request with { RequestId = "fsr-vigil-002", Tick = 6 });
        var afterUnavailable = afterStart.Apply(stream.AppendBatch(unavailable.Events));
        var readyEvents = cooldownSystem.ReadyEvents(afterUnavailable, 15);
        var afterReady = afterUnavailable.Apply(stream.AppendBatch(readyEvents));
        var replayed = ActorState.Create("kalev").Apply(SimEventStream.FromStableJson(stream.ToStableJson()).Events);

        Assert.False(unavailable.Succeeded);
        Assert.Equal("cooldown_unavailable", unavailable.Events.Single().EventType);
        Assert.Equal(17, afterStart.Resource(ResourceKey.Spirit));
        Assert.Equal(afterStart.Resource(ResourceKey.Spirit), afterUnavailable.Resource(ResourceKey.Spirit));
        Assert.Equal(15, afterStart.Cooldowns[fsrVigil.CooldownId].ReadyTick);
        Assert.Equal(SimDomain.Care, readyEvents.Single().Domain);
        Assert.Contains("care", readyEvents.Single().Tags);
        Assert.True(afterReady.Cooldowns[fsrVigil.CooldownId].ReadyEmitted);
        Assert.Equal(afterReady.Resource(ResourceKey.Spirit), replayed.Resource(ResourceKey.Spirit));
        Assert.Equal(afterReady.Cooldowns[fsrVigil.CooldownId].ReadyTick, replayed.Cooldowns[fsrVigil.CooldownId].ReadyTick);
        Assert.Contains(started.Events, simEvent => simEvent.EventType == "resource_changed" && simEvent.Fields["resource_key"] == "spirit");
        Assert.Contains(started.Events, simEvent => simEvent.EventType == "cooldown_started" && simEvent.Fields["clarity_delta"] == "1");
    }

    [Fact]
    public void CooldownState_UnavailableDoesNotSpendCost()
    {
        var actor = ActorState.Create("kalev");
        var cooldownSystem = new CooldownSystem();
        var stream = new SimEventStream();
        var fsrVigil = FsrVigilDataRow();
        var started = cooldownSystem.Start(actor, fsrVigil, Request("fsr-vigil-001", 1));
        var afterStart = actor.Apply(stream.AppendBatch(started.Events));

        var unavailable = cooldownSystem.Start(afterStart, fsrVigil, Request("fsr-vigil-002", 2));
        var afterUnavailable = afterStart.Apply(stream.AppendBatch(unavailable.Events));

        Assert.Equal(afterStart.Resource(ResourceKey.Spirit), afterUnavailable.Resource(ResourceKey.Spirit));
        Assert.DoesNotContain(unavailable.Events, simEvent => simEvent.EventType == "resource_changed");
    }

    [Fact]
    public void CooldownState_ReplayRestoresReadyTickAndAvailability()
    {
        var actor = ActorState.Create("kalev");
        var cooldownSystem = new CooldownSystem();
        var stream = new SimEventStream();
        var fsrVigil = FsrVigilDataRow();
        var afterStart = actor.Apply(stream.AppendBatch(cooldownSystem.Start(actor, fsrVigil, Request("fsr-vigil-001", 1)).Events));
        var afterReady = afterStart.Apply(stream.AppendBatch(cooldownSystem.ReadyEvents(afterStart, 11)));

        var replayed = ActorState.Create("kalev").Apply(SimEventStream.FromStableJson(stream.ToStableJson()).Events);

        Assert.True(afterReady.Cooldowns[fsrVigil.CooldownId].IsReadyAt(11));
        Assert.True(replayed.Cooldowns[fsrVigil.CooldownId].ReadyEmitted);
        Assert.Equal(afterReady.Cooldowns[fsrVigil.CooldownId].ReadyTick, replayed.Cooldowns[fsrVigil.CooldownId].ReadyTick);
    }

    private static CooldownDefinition FsrVigilDataRow() => new()
    {
        CooldownId = "fsr_vigil.self_use.v1",
        DurationTicks = 10,
        ResourceCosts = new SortedDictionary<ResourceKey, int>
        {
            [ResourceKey.Spirit] = 3
        },
        ConsequenceFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["clarity_delta"] = "1",
            ["stability_window"] = "brief"
        },
        Tags = ["fsr_vigil", "self_use"]
    };

    private static CooldownRequest Request(string requestId, long tick) => new()
    {
        RequestId = requestId,
        VerbId = "care.tincture.self_administer",
        Domain = SimDomain.Care,
        Tick = tick
    };
}
