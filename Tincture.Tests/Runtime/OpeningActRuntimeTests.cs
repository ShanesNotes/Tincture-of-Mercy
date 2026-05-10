using Tincture.Substrate.Combat;
using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Data;
using Tincture.Substrate.Economy;
using Tincture.Substrate.Events;
using Tincture.Substrate.Runtime;
using Tincture.Substrate.World;
using Tincture.Tests.Support;

namespace Tincture.Tests.Runtime;

public sealed class OpeningActRuntimeTests
{
    private static string FixturePath(string fixtureName) => Path.Combine(AppContext.BaseDirectory, "Fixtures", fixtureName);

    [Fact]
    public void OpeningActRuntime_TickCoordinatesEncounterLootAndSnapshotWithoutOwningAppendAuthority()
    {
        var stream = new SimEventStream();
        var death = stream.AppendBatch([RecoverableDeathEvent()]).Single();
        var runtime = new OpeningActRuntime();
        var result = runtime.Tick(new OpeningActRuntimeRequest
        {
            Tick = 20,
            EventStream = stream,
            EncounterRequests = [EncounterRequest(stream)],
            LootRequests = [LootRequest(stream, death.Id)]
        });

        Assert.Equal(3, result.AppendedEvents.Count);
        Assert.Contains(result.AppendedEvents, simEvent => simEvent.EventType == EncounterAiSystem.SpatialBandChangedEventType);
        Assert.Contains(result.AppendedEvents, simEvent => simEvent.EventType == LootSystem.EligibilityRecordedEventType);
        Assert.Contains(result.AppendedEvents, simEvent => simEvent.EventType == LootSystem.MaterialOutcomeEventType);
        Assert.Equal(1, result.Snapshot.Inventory.QuantityOf("wolf_pelt"));
        Assert.Equal(stream.Events.Count, result.Snapshot.EventCount);
        Assert.Equal(File.ReadAllText(FixturePath("opening_act_runtime_prelude_fixture.json")), stream.ToStableJson());
    }

    [Fact]
    public void OpeningActRuntime_RequiresSubRequestsToUseRuntimeStream()
    {
        var runtimeStream = new SimEventStream();
        var otherStream = new SimEventStream();
        var request = new OpeningActRuntimeRequest
        {
            Tick = 1,
            EventStream = runtimeStream,
            EncounterRequests = [EncounterRequest(otherStream)]
        };

        var error = Assert.Throws<InvalidOperationException>(() => new OpeningActRuntime().Tick(request));
        Assert.Contains("runtime event stream", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void OpeningActRuntimeStructure_DoesNotCallAppendBatch()
    {
        var source = File.ReadAllText(Path.Combine(StructureGuard.SubstrateRoot, "Runtime", "OpeningActRuntime.cs"));

        Assert.DoesNotContain("AppendBatch", source, StringComparison.Ordinal);
        Assert.DoesNotContain("new SimEvent", source, StringComparison.Ordinal);
        Assert.DoesNotContain("EventType =", source, StringComparison.Ordinal);
    }

    [Fact]
    public void OpeningActRuntimeStructure_OnlyUsesAuthorizedAppendCoordinators()
    {
        var source = File.ReadAllText(Path.Combine(StructureGuard.SubstrateRoot, "Runtime", "OpeningActRuntime.cs"));

        Assert.Contains("verbInvocation.Invoke", source, StringComparison.Ordinal);
        Assert.Contains("encounterAiSystem.EvaluateAndAppend", source, StringComparison.Ordinal);
        Assert.Contains("lootSystem.EvaluateAndAppend", source, StringComparison.Ordinal);
        Assert.DoesNotContain("IRuntimeEventSink", source, StringComparison.Ordinal);
        Assert.DoesNotContain("IEventBroker", source, StringComparison.Ordinal);
    }

    private static EncounterAiRequest EncounterRequest(SimEventStream stream) => new()
    {
        EncounterId = "architecture_prelude.encounter_probe",
        VerbId = "combat.intent.probe",
        Domain = SimDomain.Combat,
        Tick = 20,
        EventStream = stream,
        SpatialContext = new SpatialContext([
            new SpatialActorSnapshot { ActorId = "wolf_fixture", Position = new GridCoord(0, 0), ZoneId = "test_zone" },
            new SpatialActorSnapshot { ActorId = "kalev", Position = new GridCoord(2, 0), ZoneId = "test_zone" }
        ]),
        SpatialBandPair = new SpatialBandPair("wolf_fixture", "kalev"),
        PreviousSpatialBand = SpatialBand.Distant
    };

    private static LootRequest LootRequest(SimEventStream stream, string sourceEventId) => new()
    {
        RequestId = "architecture-prelude-loot-001",
        ActorId = "kalev",
        VerbId = "economy.loot.resolve",
        Tick = 21,
        EventStream = stream,
        SourceEventId = sourceEventId,
        LootTables = new SortedDictionary<string, LootTableDef>(StringComparer.Ordinal)
        {
            ["loot.architecture_prelude.material"] = new LootTableDef
            {
                TableId = "loot.architecture_prelude.material",
                RollStreamId = "loot_architecture_prelude",
                Entries =
                [
                    new LootTableEntry
                    {
                        EntryId = "wolf_pelt_architecture",
                        ItemId = "wolf_pelt",
                        MinimumRoll = 1,
                        Quantity = 1,
                        Quality = LootQuality.Standard,
                        Rarity = LootRarity.Common,
                        Tags = ["architecture_prelude", "wolf"]
                    }
                ]
            }
        },
        ScriptedEntryId = "wolf_pelt_architecture",
        ScriptedFixtureId = "architecture_prelude_runtime_fixture"
    };

    private static SimEvent RecoverableDeathEvent() => new()
    {
        Tick = 10,
        ActorId = "wolf_fixture",
        TargetId = "kalev",
        VerbId = "combat.fixture.resolve",
        Domain = SimDomain.Combat,
        SourceSystem = DeathFrictionSystem.SourceSystemId,
        EventType = DeathFrictionSystem.DiedEventType,
        Fields = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["actor"] = "wolf_fixture",
            ["body_eligible"] = "true",
            ["body_eligibility"] = "recoverable_body",
            ["body_eligibility_reason"] = "architecture_fixture_body",
            ["cause"] = "combat.fixture.resolve",
            ["consequence_tags"] = "architecture_prelude,body_recoverable",
            ["death_friction_request_id"] = "architecture-death-001",
            ["death_kind"] = "biological_death",
            ["friction_rule_id"] = "friction.architecture.fixture.v1",
            ["loot_hook"] = "loot.architecture_prelude.material",
            ["recoverable"] = "false",
            ["target"] = "kalev",
            ["witness_hook"] = ""
        }),
        Results = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["body_eligible"] = "true",
            ["mortality_state"] = "dead",
            ["recoverable"] = "false"
        }),
        Tags = SimEvent.StableTags(["architecture_prelude", "biological_death", "body_recoverable", "combat", "death_friction"])
    };
}
