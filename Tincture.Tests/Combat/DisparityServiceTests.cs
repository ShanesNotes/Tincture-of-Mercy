using Tincture.Substrate.Actors;
using Tincture.Substrate.Combat;
using Tincture.Substrate.Data;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;
using Tincture.Substrate.Sim;
using Tincture.Substrate.Sim.Timers;

namespace Tincture.Tests.Combat;

public sealed class DisparityServiceTests
{
    [Fact]
    public void DisparityService_ModifiesResolverWithoutOwningOutcome()
    {
        var stream = new SimEventStream();
        var modifier = new DisparityService().CreateModifier(new DisparityRequest
        {
            ModifierId = "disparity.fixture",
            ActorId = "kalev",
            TargetId = "wolf_01",
            ActorPower = 8,
            TargetPower = 18,
            SourceEventId = "evt-threat-001"
        });

        Assert.Equal(OutcomeModifierKind.Disparity, modifier.Kind);
        Assert.Equal(-2, modifier.Amount);
        Assert.Equal(DisparityService.SourceSystemId, modifier.SourceId);
        Assert.Equal("disparity.power_delta.v1", modifier.Metadata["disparity_rule_id"]);
        Assert.Empty(stream.Events);
    }

    [Fact]
    public void DisparityService_FeedsVerbInvocationModifiers()
    {
        var stream = new SimEventStream();
        var actor = ActorState.Create("kalev");
        var modifier = new DisparityService().CreateModifier(new DisparityRequest
        {
            ModifierId = "disparity.fixture.outmatched",
            ActorId = "kalev",
            TargetId = "wolf_01",
            ActorPower = 5,
            TargetPower = 20,
            SourceEventId = "evt-threat-001"
        });

        var result = new VerbInvocation().Invoke(new VerbInvocationRequest
        {
            InvocationId = "invoke-disparity-001",
            Actor = actor,
            TargetId = "wolf_01",
            Verb = CombatVerb(),
            EventStream = stream,
            Tick = 10,
            TimerDefinitions = Timers(),
            CooldownDefinitions = Cooldowns(),
            Modifiers = [modifier],
            AvailableItemIds = ["worn_knife"],
            Rng = SeededRng.FromRoot(12345UL),
            ScriptedRollValue = 50,
            ScriptedFixtureId = "b4_disparity_fixture"
        });

        var outcome = result.AppendedEvents.Single(simEvent => simEvent.SourceSystem == OutcomeResolver.ResolverId);

        Assert.True(result.Succeeded);
        Assert.Equal("disparity.fixture.outmatched", outcome.Fields["modifier_ids"]);
        Assert.Equal("-3", outcome.Fields["total_modifier"]);
        Assert.Equal("-3", outcome.Fields["disparity_amount"]);
        Assert.Equal("disparity.power_delta.v1", outcome.Fields["disparity_rule_id"]);
    }

    private static VerbDef CombatVerb() => new()
    {
        VerbId = "combat.protect.strike",
        Domain = SimDomain.Combat,
        OutcomeTable = new OutcomeTable
        {
            TableId = "combat.fixture.v1",
            RollStreamId = "combat_fixture",
            Entries =
            [
                new OutcomeTableEntry
                {
                    EntryId = "miss",
                    OutcomeKey = "miss",
                    MinimumTotal = 0,
                    Succeeded = false,
                    Tags = ["combat"]
                },
                new OutcomeTableEntry
                {
                    EntryId = "hit",
                    OutcomeKey = "hit",
                    MinimumTotal = 45,
                    Succeeded = true,
                    Tags = ["combat"]
                }
            ]
        },
        ResourceCosts = new SortedDictionary<ResourceKey, int>
        {
            [ResourceKey.Health] = 1
        },
        TimerId = "timer.swing.fixture",
        CooldownId = "cooldown.combat.fixture",
        PresenterKey = "presenter.combat.fixture",
        RequiredItemIds = ["worn_knife"],
        Tags = ["combat"]
    };

    private static IReadOnlyDictionary<string, TimerDefinition> Timers() => new SortedDictionary<string, TimerDefinition>(StringComparer.Ordinal)
    {
        ["timer.swing.fixture"] = new TimerDefinition
        {
            TimerId = "timer.swing.fixture",
            Kind = TimerKind.Swing,
            DurationTicks = 1,
            TickIntervalTicks = 1,
            Tags = ["swing"]
        }
    };

    private static IReadOnlyDictionary<string, CooldownDefinition> Cooldowns() => new SortedDictionary<string, CooldownDefinition>(StringComparer.Ordinal)
    {
        ["cooldown.combat.fixture"] = new CooldownDefinition
        {
            CooldownId = "cooldown.combat.fixture",
            DurationTicks = 5,
            Tags = ["combat"]
        }
    };
}
