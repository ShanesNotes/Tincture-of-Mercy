using Tincture.Substrate.Economy;
using Tincture.Substrate.Events;
using Tincture.Tests.Support;

namespace Tincture.Tests.Economy;

public sealed class ItemLedgerTests
{
    private static string FixturePath(string fixtureName) => Path.Combine(AppContext.BaseDirectory, "Fixtures", fixtureName);

    [Fact]
    public void ItemLedger_ProjectsBreadUseAndWolfMaterialFromEventTruth()
    {
        var stream = BreadWolfLedgerStream();
        var snapshot = new ItemLedger().Project(stream.Events);

        Assert.Equal(0, snapshot.QuantityOf("bread"));
        Assert.Equal(2, snapshot.QuantityOf("wolf_pelt"));
        Assert.Equal(3, snapshot.Adjustments.Count);
        Assert.Equal("item_ledger.explicit_delta.v1", snapshot.Adjustments.Single(adjustment => adjustment.ItemId == "bread" && adjustment.Delta == -1).RuleId);
        Assert.Equal("item_ledger.loot_material.v1", snapshot.Adjustments.Single(adjustment => adjustment.ItemId == "wolf_pelt").RuleId);
        Assert.Equal("evt-00000003", snapshot.Entries["wolf_pelt"].EventIds.Single());
        Assert.Equal("evt-death-0001", snapshot.Entries["wolf_pelt"].UpstreamSourceEventIds.Single());
        Assert.Equal(File.ReadAllText(FixturePath("item_ledger_bread_wolf_fixture.json")), stream.ToStableJson());
    }

    [Fact]
    public void ItemLedger_RejectsNegativeInventoryProjection()
    {
        var stream = new SimEventStream();
        stream.AppendBatch([InventoryDeltaEvent(10, "bread", -1, sourceEventId: "evt-use-missing")]);

        var error = Assert.Throws<InvalidOperationException>(() => new ItemLedger().Project(stream.Events));
        Assert.Contains("negative inventory", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void ItemLedgerStructure_NoPresentationInventoryTruth()
    {
        var presentationRoot = Path.Combine(StructureGuard.SubstrateRoot, "Presentation");
        var offenders = StructureGuard.FilesContainingAny(presentationRoot, ["InventorySnapshot", "InventoryEntry", "ItemLedger", "inventory_delta"]);

        Assert.Empty(offenders);
    }

    [Fact]
    public void ItemLedgerStructure_DoesNotAppendSpendResolveOrOwnDeathEncounter()
    {
        var sourceRoot = Path.Combine(StructureGuard.SubstrateRoot, "Economy");
        var allowed = new HashSet<string>(StringComparer.Ordinal)
        {
            "LootSystem.cs"
        };
        var offenders = StructureGuard.FilesMatching(sourceRoot, (relativePath, text) =>
            !allowed.Contains(relativePath)
            && (text.Contains("AppendBatch", StringComparison.Ordinal)
                || text.Contains("new OutcomeResolver", StringComparison.Ordinal)
                || text.Contains("CostLedger", StringComparison.Ordinal)
                || text.Contains("DeathFrictionSystem.", StringComparison.Ordinal)
                || text.Contains("EncounterAiSystem.", StringComparison.Ordinal)));

        Assert.Empty(offenders);
    }

    internal static SimEventStream BreadWolfLedgerStream()
    {
        var stream = new SimEventStream();
        stream.AppendBatch([
            InventoryDeltaEvent(5, "bread", 1, sourceEventId: "evt-bread-gift"),
            InventoryDeltaEvent(8, "bread", -1, sourceEventId: "evt-bread-use"),
            WolfMaterialEvent()
        ]);
        return stream;
    }

    internal static SimEvent InventoryDeltaEvent(long tick, string itemId, int delta, string sourceEventId) => new()
    {
        Tick = tick,
        ActorId = "kalev",
        TargetId = "traveler",
        VerbId = delta > 0 ? "economy.item.receive" : "care.share_bread",
        Domain = delta > 0 ? SimDomain.Economy : SimDomain.Care,
        SourceSystem = delta > 0 ? "fixture.item_source" : "verb_invocation.v1",
        EventType = delta > 0 ? "item_received" : "verb_invocation_completed",
        Fields = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["inventory_delta"] = delta.ToString(System.Globalization.CultureInfo.InvariantCulture),
            ["item_id"] = itemId,
            ["ledger_rule_id"] = ItemLedger.ExplicitDeltaRuleId,
            ["source_event_id"] = sourceEventId
        }),
        Tags = SimEvent.StableTags(["inventory", itemId])
    };

    internal static SimEvent WolfMaterialEvent() => new()
    {
        Tick = 12,
        ActorId = "kalev",
        TargetId = "wolf_fixture",
        VerbId = "economy.loot.resolve",
        Domain = SimDomain.Economy,
        SourceSystem = LootSystem.SourceSystemId,
        EventType = LootSystem.MaterialOutcomeEventType,
        Fields = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["entry_id"] = "wolf_pelt_fine",
            ["item_id"] = "wolf_pelt",
            ["quality"] = "fine",
            ["quantity"] = "2",
            ["rarity"] = "uncommon",
            ["source_event_id"] = "evt-death-0001",
            ["source_event_type"] = "actor_died",
            ["source_system"] = "death_friction.v1"
        }),
        Results = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["item_id"] = "wolf_pelt",
            ["quality"] = "fine",
            ["quantity"] = "2",
            ["rarity"] = "uncommon"
        }),
        Tags = SimEvent.StableTags(["economy", "loot", "material", "wolf"])
    };
}
