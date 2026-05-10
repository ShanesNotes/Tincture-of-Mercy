using Tincture.Substrate.Actors;
using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Data;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;
using Tincture.Substrate.Sim;
using Tincture.Substrate.Sim.Timers;

namespace Tincture.Tests.Rules;

public sealed class VerbInvocationTests
{
    private static string FixturePath(string fixtureName) => Path.Combine(AppContext.BaseDirectory, "Fixtures", fixtureName);

    [Fact]
    public void VerbInvocation_CareAndCombatUseSamePipeline()
    {
        var invocation = new VerbInvocation();
        var actor = ActorState.Create("kalev");
        var careStream = new SimEventStream();
        var combatStream = new SimEventStream();

        var care = invocation.Invoke(Request("invoke-care-001", actor, careStream, CareVerb(), targetId: "mother") with
        {
            ScriptedRollValue = 64,
            ScriptedFixtureId = "b5b_care_shared_path",
            AvailableItemIds = ["tincture"]
        });
        var combat = invocation.Invoke(Request("invoke-combat-001", actor, combatStream, CombatVerb(), targetId: "wolf_alpha") with
        {
            ScriptedRollValue = 61,
            ScriptedFixtureId = "b5b_combat_shared_path",
            AvailableItemIds = ["worn_knife"]
        });

        Assert.True(care.Succeeded);
        Assert.True(combat.Succeeded);
        Assert.Equal(OutcomeResolver.ResolverId, care.Outcome!.ResolverId);
        Assert.Equal(OutcomeResolver.ResolverId, combat.Outcome!.ResolverId);
        Assert.Equal(
            care.AppendedEvents.Select(simEvent => simEvent.SourceSystem).ToList(),
            combat.AppendedEvents.Select(simEvent => simEvent.SourceSystem).ToList());
        Assert.Contains(care.AppendedEvents, simEvent => simEvent.EventType == VerbInvocation.CompletedEventType);
        Assert.Contains(combat.AppendedEvents, simEvent => simEvent.EventType == VerbInvocation.CompletedEventType);
        Assert.Contains("care", care.AppendedEvents.Last().Tags);
        Assert.Contains("combat", combat.AppendedEvents.Last().Tags);
    }

    [Fact]
    public void VerbInvocation_AppendsEventsBeforeApplyingConsequences()
    {
        var invocation = new VerbInvocation();
        var stream = new SimEventStream();
        var result = invocation.Invoke(Request("invoke-wolf-defeat-001", ActorState.Create("kalev"), stream, WolfDefeatVerb(), targetId: "wolf_alpha") with
        {
            ScriptedEntryId = "wolf_defeated",
            AvailableItemIds = ["worn_knife"]
        });

        var outcome = result.AppendedEvents.Single(simEvent => simEvent.SourceSystem == OutcomeResolver.ResolverId);
        var death = result.AppendedEvents.Single(simEvent => simEvent.EventType == DeathFrictionSystem.DiedEventType);
        var completed = result.AppendedEvents.Single(simEvent => simEvent.EventType == VerbInvocation.CompletedEventType);

        Assert.True(result.Succeeded);
        Assert.True(outcome.Sequence < death.Sequence);
        Assert.True(death.Sequence < completed.Sequence);
        Assert.Equal(outcome.Id, death.Fields["cause_event_id"]);
        Assert.Equal("loot.wolf.material", death.Fields["loot_hook"]);
        Assert.DoesNotContain(result.AppendedEvents, simEvent => simEvent.EventType.StartsWith("loot_", StringComparison.Ordinal));
        Assert.True(result.ProjectionHooks.DeathFrictionStates["wolf_alpha"].IsDead);
        Assert.True(result.ProjectionHooks.DeathFrictionStates["wolf_alpha"].BodyEligible);
    }

    [Fact]
    public void VerbInvocation_CareCombatFixtureReplayStable()
    {
        var invocation = new VerbInvocation();
        var stream = new SimEventStream();
        var actor = ActorState.Create("kalev");
        var care = invocation.Invoke(Request("invoke-care-fixture-001", actor, stream, CareVerb(), targetId: "mother", tick: 10) with
        {
            ScriptedRollValue = 64,
            ScriptedFixtureId = "b5b_care_fixture",
            AvailableItemIds = ["tincture"]
        });
        var combat = invocation.Invoke(Request("invoke-combat-fixture-001", care.ProjectionHooks.Actor, stream, WolfDefeatVerb(), targetId: "wolf_alpha", tick: 30) with
        {
            ScriptedEntryId = "wolf_defeated",
            AvailableItemIds = ["worn_knife"]
        });

        var json = stream.ToStableJson();
        var replay = SimEventStream.FromStableJson(json);

        Assert.True(care.Succeeded);
        Assert.True(combat.Succeeded);
        Assert.Equal(File.ReadAllText(FixturePath("verb_invocation_care_combat_fixture.json")), json);
        Assert.Equal(json, replay.ToStableJson());
    }

    [Fact]
    public void VerbInvocation_InvalidDataFailsFast()
    {
        var invocation = new VerbInvocation();
        var stream = new SimEventStream();
        var actor = ActorState.Create("kalev");

        Assert.Throws<InvalidOperationException>(() =>
            invocation.Invoke(Request("invoke-invalid-001", actor, stream, CareVerb() with { TimerId = "timer.missing" })));
        Assert.Empty(stream.Events);

        Assert.Throws<InvalidOperationException>(() =>
            invocation.Invoke(Request("invoke-invalid-002", actor, stream, CareVerb(), cooldownDefinitions: Cooldowns(withCosts: true))));
        Assert.Empty(stream.Events);

        var rejected = invocation.Invoke(Request("invoke-missing-item-001", actor, stream, CareVerb()) with
        {
            ScriptedRollValue = 60,
            AvailableItemIds = []
        });
        Assert.False(rejected.Succeeded);
        Assert.Single(stream.Events);
        Assert.Equal(VerbInvocation.RejectedEventType, stream.Events.Single().EventType);
        Assert.Equal("missing_items", stream.Events.Single().Fields["reason"]);
    }

    [Fact]
    public void VerbInvocation_UsesCostLedgerAndModifierAssembler()
    {
        var stream = new SimEventStream();
        var actor = ActorState.Create("kalev");
        var auraSystem = new AuraSystem();
        stream.AppendBatch([auraSystem.ApplyAura(actor, CalmAura(), 1, "care.tincture.administer", SimDomain.Care)]);

        var invocation = new VerbInvocation(auraSystem: auraSystem, modifierAssembler: new ModifierAssembler());
        var result = invocation.Invoke(Request("invoke-modifiers-001", actor, stream, CareVerb(), targetId: "mother", tick: 5) with
        {
            ScriptedRollValue = 50,
            ScriptedFixtureId = "b5b_modifier_fixture",
            AvailableItemIds = ["tincture"],
            Modifiers =
            [
                new OutcomeModifier
                {
                    ModifierId = "scripted.bonus",
                    SourceId = "fixture",
                    SourceEventId = "evt-00000099",
                    Kind = OutcomeModifierKind.Scripted,
                    Amount = 4
                }
            ]
        });

        var cost = result.AppendedEvents.Single(simEvent => simEvent.EventType == "resource_changed");
        var outcome = result.AppendedEvents.Single(simEvent => simEvent.SourceSystem == OutcomeResolver.ResolverId);

        Assert.Equal(CostLedger.SourceSystemId, cost.SourceSystem);
        Assert.Equal("steady", cost.Fields["resource_key"]);
        Assert.Equal("modifier_composer.additive.v1", outcome.Fields["modifier_composition"]);
        Assert.Equal("aura.tincture_calm.steady,scripted.bonus", outcome.Fields["modifier_ids"]);
        Assert.Equal("6", outcome.Fields["total_modifier"]);
        Assert.Equal(19, result.ProjectionHooks.Actor.Resource(ResourceKey.Steady));
    }

    private static VerbInvocationRequest Request(
        string invocationId,
        ActorState actor,
        SimEventStream stream,
        VerbDef verb,
        string? targetId = null,
        long tick = 20,
        IReadOnlyDictionary<string, CooldownDefinition>? cooldownDefinitions = null) => new()
        {
            InvocationId = invocationId,
            Actor = actor,
            TargetId = targetId,
            Verb = verb,
            EventStream = stream,
            Tick = tick,
            TimerDefinitions = Timers(),
            CooldownDefinitions = cooldownDefinitions ?? Cooldowns(),
            Rng = SeededRng.FromRoot(424242UL)
        };

    private static IReadOnlyDictionary<string, TimerDefinition> Timers()
    {
        return new SortedDictionary<string, TimerDefinition>(StringComparer.Ordinal)
        {
            ["timer.cast.fixture"] = new TimerDefinition
            {
                TimerId = "timer.cast.fixture",
                Kind = TimerKind.Cast,
                DurationTicks = 1,
                TickIntervalTicks = 1,
                Tags = ["cast"]
            },
            ["timer.swing.fixture"] = new TimerDefinition
            {
                TimerId = "timer.swing.fixture",
                Kind = TimerKind.Swing,
                DurationTicks = 1,
                TickIntervalTicks = 1,
                Tags = ["swing"]
            }
        };
    }

    private static IReadOnlyDictionary<string, CooldownDefinition> Cooldowns(bool withCosts = false)
    {
        return new SortedDictionary<string, CooldownDefinition>(StringComparer.Ordinal)
        {
            ["cooldown.care.tincture"] = new CooldownDefinition
            {
                CooldownId = "cooldown.care.tincture",
                DurationTicks = 5,
                ResourceCosts = withCosts
                    ? new SortedDictionary<ResourceKey, int> { [ResourceKey.Spirit] = 1 }
                    : new SortedDictionary<ResourceKey, int>(),
                Tags = ["care", "tincture"]
            },
            ["cooldown.combat.strike"] = new CooldownDefinition
            {
                CooldownId = "cooldown.combat.strike",
                DurationTicks = 5,
                Tags = ["combat", "strike"]
            }
        };
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
        Tags = ["care", "tincture"]
    };

    private static VerbDef CombatVerb() => new()
    {
        VerbId = "combat.protect.strike",
        Domain = SimDomain.Combat,
        OutcomeTable = OutcomeTestData.WolfAttackTable(),
        ResourceCosts = new SortedDictionary<ResourceKey, int>
        {
            [ResourceKey.Health] = 2
        },
        TimerId = "timer.swing.fixture",
        CooldownId = "cooldown.combat.strike",
        PresenterKey = "presenter.combat.strike",
        RequiredItemIds = ["worn_knife"],
        Tags = ["combat", "wolf"]
    };

    private static VerbDef WolfDefeatVerb() => CombatVerb() with
    {
        OutcomeTable = new OutcomeTable
        {
            TableId = "combat.wolf_defeat.v1",
            RollStreamId = "wolf_defeat",
            Entries =
            [
                new OutcomeTableEntry
                {
                    EntryId = "wolf_deflects",
                    OutcomeKey = "wolf_deflects",
                    MinimumTotal = 0,
                    Succeeded = false,
                    ResultFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["damage"] = "1"
                    },
                    Tags = ["combat", "wolf"]
                },
                new OutcomeTableEntry
                {
                    EntryId = "wolf_defeated",
                    OutcomeKey = "wolf_defeated",
                    MinimumTotal = 50,
                    Succeeded = true,
                    ResultFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["body_eligibility"] = "recoverable_body",
                        ["consequence_tags"] = "body_recoverable,combat,material_consequence,wolf",
                        ["death_actor_id"] = "wolf_alpha",
                        ["death_context_body_eligibility_reason"] = "wolf_killed_in_reachable_zone",
                        ["death_kind"] = "biological_death",
                        ["friction_rule_id"] = "friction.wolf_body.recoverable.v1",
                        ["loot_hook"] = "loot.wolf.material",
                        ["recoverable"] = "false",
                        ["witness_hook"] = "progression.protection"
                    },
                    Tags = ["combat", "damage", "wolf"]
                }
            ]
        }
    };

    private static AuraDefinition CalmAura() => new()
    {
        AuraId = "aura.tincture_calm",
        DurationTicks = 10,
        MaxStacks = 1,
        ModifierId = "aura.tincture_calm.steady",
        ModifierAmount = 2,
        DerivedStatKey = DerivedStatKey.ActionStability,
        DerivedStatDelta = 1
    };
}
