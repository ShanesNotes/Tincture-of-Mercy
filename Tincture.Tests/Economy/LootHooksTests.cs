using Tincture.Substrate.Combat;
using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Data;
using Tincture.Substrate.Economy;
using Tincture.Substrate.Events;
using Tincture.Substrate.Sim;

namespace Tincture.Tests.Economy;

public sealed class LootHooksTests
{
    private static string FixturePath(string fixtureName) => Path.Combine(AppContext.BaseDirectory, "Fixtures", fixtureName);

    [Fact]
    public void LootHooks_WolfRecoverableBodyEmitsMaterialOutcome()
    {
        var stream = new SimEventStream();
        var death = AppendRecoverableWolfDeath(stream);
        var system = new LootSystem();

        var result = system.EvaluateAndAppend(WolfLootRequest(stream, death.Id) with
        {
            ScriptedEntryId = "wolf_pelt_fine",
            ScriptedFixtureId = "b5c_wolf_material_fixture"
        });

        var eligibility = result.AppendedEvents.Single(simEvent => simEvent.EventType == LootSystem.EligibilityRecordedEventType);
        var material = result.AppendedEvents.Single(simEvent => simEvent.EventType == LootSystem.MaterialOutcomeEventType);

        Assert.True(result.Eligibility.Eligible);
        Assert.NotNull(result.MaterialOutcome);
        Assert.Equal(death.Id, eligibility.Fields["source_event_id"]);
        Assert.Equal(death.Id, material.Fields["source_event_id"]);
        Assert.Equal("wolf_alpha", material.Fields["source_actor"]);
        Assert.Equal("wolf_pelt", material.Fields["item_id"]);
        Assert.Equal("fine", material.Fields["quality"]);
        Assert.Equal("uncommon", material.Fields["rarity"]);
        Assert.Equal("2", material.Fields["quantity"]);
        Assert.Equal("loot.wolf.material", material.Fields["loot_table"]);
        Assert.Equal("wolf_killed_in_reachable_zone", material.Fields["eligibility_reason"]);
        Assert.Equal("scripted", material.Fields["roll_kind"]);
        Assert.Equal("b5c_wolf_material_fixture", material.Fields["scripted_fixture_id"]);
        Assert.Equal(death.Sequence + 1, eligibility.Sequence);
        Assert.Equal(eligibility.Sequence + 1, material.Sequence);
        Assert.Equal(File.ReadAllText(FixturePath("loot_hooks_wolf_material_fixture.json")), stream.ToStableJson());
    }

    [Fact]
    public void LootHooks_FleeOrLeashCanWithholdMaterialOutcome()
    {
        var flee = EvaluateWithEncounterSource(EncounterAiSystem.FleeInitiatedEventType);
        var leash = EvaluateWithEncounterSource(EncounterAiSystem.LeashTriggeredEventType);

        Assert.False(flee.result.Eligibility.Eligible);
        Assert.Null(flee.result.MaterialOutcome);
        Assert.Single(flee.result.AppendedEvents);
        Assert.Equal(LootSystem.EligibilityRecordedEventType, flee.result.AppendedEvents.Single().EventType);
        Assert.Equal("source_actor_fled", flee.result.AppendedEvents.Single().Fields["eligibility_reason"]);
        Assert.DoesNotContain(flee.stream.Events, simEvent => simEvent.EventType == LootSystem.MaterialOutcomeEventType);

        Assert.False(leash.result.Eligibility.Eligible);
        Assert.Null(leash.result.MaterialOutcome);
        Assert.Single(leash.result.AppendedEvents);
        Assert.Equal("source_actor_leashed", leash.result.AppendedEvents.Single().Fields["eligibility_reason"]);
        Assert.DoesNotContain(leash.stream.Events, simEvent => simEvent.EventType == LootSystem.MaterialOutcomeEventType);
    }

    [Fact]
    public void LootHooks_QualityRarityReplayFromSeed()
    {
        var first = EvaluateSeededWolfLoot(20260510UL);
        var second = EvaluateSeededWolfLoot(20260510UL);
        var material = first.stream.Events.Single(simEvent => simEvent.EventType == LootSystem.MaterialOutcomeEventType);

        Assert.Equal(first.stream.ToStableJson(), second.stream.ToStableJson());
        Assert.Equal(first.result.MaterialOutcome!.EntryId, second.result.MaterialOutcome!.EntryId);
        Assert.Equal(first.result.MaterialOutcome.Quality, second.result.MaterialOutcome.Quality);
        Assert.Equal(first.result.MaterialOutcome.Rarity, second.result.MaterialOutcome.Rarity);
        Assert.Equal("seeded", material.Fields["roll_kind"]);
        Assert.Equal("20260510", material.Fields["root_seed"]);
        Assert.Equal("loot_wolf_material", material.Fields["roll_stream_id"]);
        Assert.Equal("1", material.Fields["roll_step"]);
        Assert.False(string.IsNullOrWhiteSpace(material.Fields["roll_stream_seed"]));
        Assert.False(string.IsNullOrWhiteSpace(material.Fields["quality"]));
        Assert.False(string.IsNullOrWhiteSpace(material.Fields["rarity"]));
    }

    [Fact]
    public void LootHooks_EligibilityTracesToSourceEvent()
    {
        var stream = new SimEventStream();
        var death = AppendRecoverableWolfDeath(stream);
        var result = new LootSystem().EvaluateAndAppend(WolfLootRequest(stream, death.Id) with
        {
            ScriptedEntryId = "wolf_bone_common",
            ScriptedFixtureId = "b5c_trace_fixture"
        });

        var eligibility = result.AppendedEvents.Single(simEvent => simEvent.EventType == LootSystem.EligibilityRecordedEventType);
        var material = result.AppendedEvents.Single(simEvent => simEvent.EventType == LootSystem.MaterialOutcomeEventType);

        Assert.Equal(death.Id, result.Eligibility.SourceEventId);
        Assert.Equal(DeathFrictionSystem.SourceSystemId, result.Eligibility.SourceSystem);
        Assert.Equal(DeathFrictionSystem.DiedEventType, result.Eligibility.SourceEventType);
        Assert.Equal("combat", eligibility.Fields["source_domain"]);
        Assert.Equal("loot.wolf.material", eligibility.Fields["loot_hook"]);
        Assert.Equal("true", eligibility.Fields["eligible"]);
        Assert.Equal(death.Id, material.Fields["source_event_id"]);
        Assert.Equal("actor_died", material.Fields["source_event_type"]);
        Assert.Equal("wolf_killed_in_reachable_zone", material.Fields["eligibility_reason"]);
    }


    [Fact]
    public void LootHooks_DownedWithoutRecoverableBodyWithholdsMaterialOutcome()
    {
        var stream = new SimEventStream();
        var downed = AppendDownedWithoutRecoverableBody(stream);
        var result = new LootSystem().EvaluateAndAppend(WolfLootRequest(stream, downed.Id) with
        {
            LootTableId = "loot.wolf.material",
            ScriptedEntryId = "wolf_bone_common",
            ScriptedFixtureId = "b5c_downed_withheld_fixture"
        });

        var eligibility = result.AppendedEvents.Single();

        Assert.False(result.Eligibility.Eligible);
        Assert.Null(result.MaterialOutcome);
        Assert.Equal(LootSystem.EligibilityRecordedEventType, eligibility.EventType);
        Assert.Equal(downed.Id, eligibility.Fields["source_event_id"]);
        Assert.Equal(DeathFrictionSystem.DownedEventType, eligibility.Fields["source_event_type"]);
        Assert.Equal("body_not_recoverable", eligibility.Fields["eligibility_reason"]);
        Assert.DoesNotContain(stream.Events, simEvent => simEvent.EventType == LootSystem.MaterialOutcomeEventType);
    }

    [Fact]
    public void LootHooks_InvalidRowsAndEnumsFailFast()
    {
        Assert.Throws<InvalidOperationException>(() => (WolfLootTable() with { Entries = [] }).Validate());
        Assert.Throws<InvalidOperationException>(() => (WolfLootTable() with
        {
            Entries = [WolfLootTable().Entries.First() with { MinimumRoll = 0 }]
        }).Validate());
        Assert.Throws<ArgumentOutOfRangeException>(() => ((LootQuality)999).ToId());
        Assert.Throws<ArgumentOutOfRangeException>(() => LootQualityExtensions.FromId("excellent"));
        Assert.Throws<ArgumentOutOfRangeException>(() => ((LootRarity)999).ToId());
        Assert.Throws<ArgumentOutOfRangeException>(() => LootRarityExtensions.FromId("mythic"));

        var stream = new SimEventStream();
        var death = AppendRecoverableWolfDeath(stream);
        Assert.Throws<InvalidOperationException>(() => new LootSystem().EvaluateAndAppend(WolfLootRequest(stream, death.Id) with
        {
            ScriptedEntryId = null,
            Rng = null
        }));
        Assert.Throws<InvalidOperationException>(() => new LootSystem().EvaluateAndAppend(WolfLootRequest(stream, death.Id) with
        {
            ContextFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["item_id"] = "spoofed"
            }
        }));
        Assert.Throws<InvalidOperationException>(() => new LootSystem().EvaluateAndAppend(WolfLootRequest(stream, death.Id) with
        {
            ContextFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["material_kind"] = "spoofed"
            }
        }));
    }

    private static (SimEventStream stream, LootResult result) EvaluateWithEncounterSource(string eventType)
    {
        var stream = new SimEventStream();
        var source = stream.AppendBatch([EncounterSource(eventType)]).Single();
        var result = new LootSystem().EvaluateAndAppend(WolfLootRequest(stream, source.Id) with
        {
            LootTableId = "loot.wolf.material",
            ScriptedEntryId = "wolf_pelt_fine",
            ScriptedFixtureId = "b5c_withheld_fixture"
        });

        return (stream, result);
    }

    private static (SimEventStream stream, LootResult result) EvaluateSeededWolfLoot(ulong seed)
    {
        var stream = new SimEventStream();
        var death = AppendRecoverableWolfDeath(stream);
        var result = new LootSystem().EvaluateAndAppend(WolfLootRequest(stream, death.Id) with
        {
            Rng = SeededRng.FromRoot(seed),
            ScriptedEntryId = null,
            ScriptedFixtureId = null
        });

        return (stream, result);
    }

    private static LootRequest WolfLootRequest(SimEventStream stream, string sourceEventId) => new()
    {
        RequestId = "loot-wolf-material-001",
        ActorId = "kalev",
        VerbId = "economy.loot.resolve",
        Tick = 40,
        EventStream = stream,
        SourceEventId = sourceEventId,
        LootTables = WolfLootTables(),
        ScriptedEntryId = "wolf_bone_common",
        ScriptedFixtureId = "b5c_default_fixture",
        ContextFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["collector_id"] = "kalev"
        }
    };

    private static IReadOnlyDictionary<string, LootTableDef> WolfLootTables()
    {
        return new SortedDictionary<string, LootTableDef>(StringComparer.Ordinal)
        {
            ["loot.wolf.material"] = WolfLootTable()
        };
    }

    private static LootTableDef WolfLootTable() => new()
    {
        TableId = "loot.wolf.material",
        RollStreamId = "loot_wolf_material",
        Tags = ["wolf", "material"],
        Entries =
        [
            new LootTableEntry
            {
                EntryId = "wolf_bone_common",
                ItemId = "wolf_bone",
                MinimumRoll = 1,
                Quantity = 1,
                Quality = LootQuality.Standard,
                Rarity = LootRarity.Common,
                Tags = ["wolf", "bone", "material"],
                ResultFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    ["material_kind"] = "bone"
                }
            },
            new LootTableEntry
            {
                EntryId = "wolf_pelt_fine",
                ItemId = "wolf_pelt",
                MinimumRoll = 50,
                Quantity = 2,
                Quality = LootQuality.Fine,
                Rarity = LootRarity.Uncommon,
                Tags = ["wolf", "pelt", "material"],
                ResultFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    ["material_kind"] = "pelt"
                }
            },
            new LootTableEntry
            {
                EntryId = "wolf_heart_rare",
                ItemId = "wolf_heart",
                MinimumRoll = 90,
                Quantity = 1,
                Quality = LootQuality.Pristine,
                Rarity = LootRarity.Rare,
                Tags = ["wolf", "heart", "material"],
                ResultFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    ["material_kind"] = "heart"
                }
            }
        ]
    };

    private static SimEvent AppendRecoverableWolfDeath(SimEventStream stream)
    {
        var deathSystem = new DeathFrictionSystem();
        var death = deathSystem.DeclareDeath(new DeathFrictionRequest
        {
            RequestId = "wolf-death-001",
            ActorId = "wolf_alpha",
            TargetId = "kalev",
            VerbId = "combat.protect.strike",
            Domain = SimDomain.Combat,
            Tick = 30,
            Kind = DeathFrictionKind.BiologicalDeath,
            Cause = "combat.protect.strike",
            CauseEventId = "evt-outcome-001",
            Recoverable = false,
            BodyEligibility = BodyEligibility.RecoverableBody,
            FrictionRuleId = "friction.wolf_body.recoverable.v1",
            ConsequenceTags = ["body_recoverable", "combat", "material_consequence", "wolf"],
            ContextFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["body_eligibility_reason"] = "wolf_killed_in_reachable_zone",
                ["loot_hook"] = "loot.wolf.material"
            }
        });

        return stream.AppendBatch([death]).Single();
    }


    private static SimEvent AppendDownedWithoutRecoverableBody(SimEventStream stream)
    {
        var deathSystem = new DeathFrictionSystem();
        var downed = deathSystem.MarkDowned(new DeathFrictionRequest
        {
            RequestId = "wolf-downed-001",
            ActorId = "wolf_alpha",
            TargetId = "kalev",
            VerbId = "combat.protect.strike",
            Domain = SimDomain.Combat,
            Tick = 30,
            Kind = DeathFrictionKind.Downed,
            Cause = "combat.protect.strike",
            CauseEventId = "evt-outcome-001",
            Recoverable = false,
            BodyEligibility = BodyEligibility.NotApplicable,
            FrictionRuleId = "friction.wolf_body.not_recoverable.v1",
            ConsequenceTags = ["combat", "wolf"]
        });

        return stream.AppendBatch([downed]).Single();
    }

    private static SimEvent EncounterSource(string eventType) => new()
    {
        Tick = 32,
        ActorId = "wolf_alpha",
        TargetId = "kalev",
        VerbId = "combat.intent.keep_line",
        Domain = SimDomain.Combat,
        SourceSystem = EncounterAiSystem.SourceSystemId,
        EventType = eventType,
        Fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["actor_id"] = "wolf_alpha",
            ["encounter_id"] = "encounter.keep_line.fixture",
            ["target_id"] = "kalev"
        },
        Tags = ["combat", "encounter_ai"]
    };
}
