using Tincture.Substrate.Actors;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;

namespace Tincture.Tests.Actors;

public sealed class AuraSystemTests
{
    [Fact]
    public void AuraSystem_ExpiresByTick()
    {
        var actor = ActorState.Create("kalev");
        var auraSystem = new AuraSystem();
        var stream = new SimEventStream();
        var aura = CalmAura(durationTicks: 5);

        var applied = actor.Apply(stream.AppendBatch([auraSystem.ApplyAura(actor, aura, 10, "care.tincture.administer", SimDomain.Care)]));

        Assert.Empty(auraSystem.ExpireByTick(applied, 14));
        var expiredEvents = auraSystem.ExpireByTick(applied, 15);
        var expired = applied.Apply(stream.AppendBatch(expiredEvents));

        Assert.Single(expiredEvents);
        Assert.Equal("aura_expired", expiredEvents.Single().EventType);
        Assert.Equal(SimDomain.Care, expiredEvents.Single().Domain);
        Assert.Contains("care", expiredEvents.Single().Tags);
        Assert.Empty(expired.ActiveAuras);
    }

    [Fact]
    public void AuraSystem_ComposesModifiersDeterministically()
    {
        var auraSystem = new AuraSystem(new ModifierAssembler());
        var stream = new SimEventStream();
        var actor = ActorState.Create("kalev");
        var calm = CalmAura("aura.calm", "aura.calm.steady", amount: 2);
        var witnessed = CalmAura("aura.witnessed", "aura.witnessed.resolve", amount: 5);
        var appended = stream.AppendBatch([
            auraSystem.ApplyAura(actor, witnessed, 1, "witness.kalev", SimDomain.Witness),
            auraSystem.ApplyAura(actor, calm, 2, "care.tincture.administer", SimDomain.Care)
        ]);

        var actorForward = actor.Apply(appended);
        var actorReordered = actor.Apply(appended.Reverse());
        var modifiersForward = auraSystem.AssembleModifiers(actorForward, 3);
        var modifiersReordered = auraSystem.AssembleModifiers(actorReordered, 3);

        Assert.Equal(["aura.witnessed.resolve", "aura.calm.steady"], modifiersForward.Select(modifier => modifier.ModifierId));
        Assert.Equal(7, modifiersForward.Sum(modifier => modifier.Amount));
        Assert.Equal(modifiersForward.Select(modifier => modifier.ModifierId), modifiersReordered.Select(modifier => modifier.ModifierId));
        Assert.All(modifiersForward, modifier => Assert.Equal(OutcomeModifierKind.Aura, modifier.Kind));
    }

    [Fact]
    public void AuraSystem_RefreshDoesNotDuplicateModifierSource()
    {
        var actor = ActorState.Create("kalev");
        var auraSystem = new AuraSystem();
        var stream = new SimEventStream();
        var aura = CalmAura(durationTicks: 5, maxStacks: 1);

        var applied = actor.Apply(stream.AppendBatch([auraSystem.ApplyAura(actor, aura, 1, "care.tincture.administer", SimDomain.Care)]));
        var refreshed = applied.Apply(stream.AppendBatch([auraSystem.ApplyAura(applied, aura, 3, "care.tincture.administer", SimDomain.Care)]));

        Assert.Single(refreshed.ActiveAuras);
        Assert.Equal(1, refreshed.ActiveAuras[aura.AuraId].StackCount);
        Assert.Equal(8, refreshed.ActiveAuras[aura.AuraId].ExpiresAtTick);
        Assert.Single(auraSystem.AssembleModifiers(refreshed, 4));
    }

    [Fact]
    public void AuraSystem_StackRuleIsDeterministic()
    {
        var actor = ActorState.Create("kalev");
        var auraSystem = new AuraSystem();
        var stream = new SimEventStream();
        var aura = CalmAura(durationTicks: 5, maxStacks: 2);

        var once = actor.Apply(stream.AppendBatch([auraSystem.ApplyAura(actor, aura, 1, "care.tincture.administer", SimDomain.Care)]));
        var twice = once.Apply(stream.AppendBatch([auraSystem.ApplyAura(once, aura, 2, "care.tincture.administer", SimDomain.Care)]));
        var capped = twice.Apply(stream.AppendBatch([auraSystem.ApplyAura(twice, aura, 3, "care.tincture.administer", SimDomain.Care)]));

        Assert.Equal(2, twice.ActiveAuras[aura.AuraId].StackCount);
        Assert.Equal(2, capped.ActiveAuras[aura.AuraId].StackCount);
        Assert.Equal(4, auraSystem.AssembleModifiers(capped, 4).Single().Amount);
    }

    [Fact]
    public void AuraSystem_AuraEventsUseSingularModifierIdMetadata()
    {
        var actor = ActorState.Create("kalev");
        var auraSystem = new AuraSystem();
        var simEvent = auraSystem.ApplyAura(actor, CalmAura(), 1, "care.tincture.administer", SimDomain.Care);

        Assert.Equal("aura.tincture_calm.steady", simEvent.Fields["modifier_id"]);
        Assert.False(simEvent.Fields.ContainsKey("modifier_ids"));
        Assert.Contains("care", simEvent.Tags);
    }

    private static AuraDefinition CalmAura(
        string auraId = "aura.tincture_calm",
        string modifierId = "aura.tincture_calm.steady",
        int amount = 2,
        long durationTicks = 10,
        int maxStacks = 2)
    {
        return new AuraDefinition
        {
            AuraId = auraId,
            DurationTicks = durationTicks,
            MaxStacks = maxStacks,
            ModifierId = modifierId,
            ModifierAmount = amount,
            DerivedStatKey = DerivedStatKey.ActionStability,
            DerivedStatDelta = 1
        };
    }
}
