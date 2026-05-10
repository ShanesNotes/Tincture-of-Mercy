using System.Globalization;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;

namespace Tincture.Substrate.Economy;

public sealed class ItemLedger
{
    public const string SourceSystemId = "item_ledger_projection.v1";
    public const string LootMaterialRuleId = "item_ledger.loot_material.v1";
    public const string ExplicitDeltaRuleId = "item_ledger.explicit_delta.v1";

    public InventorySnapshot Project(IEnumerable<SimEvent> events)
    {
        ArgumentNullException.ThrowIfNull(events);
        var quantities = new SortedDictionary<string, int>(StringComparer.Ordinal);
        var adjustments = new List<InventoryAdjustment>();

        foreach (var simEvent in events.OrderBy(simEvent => simEvent.Sequence))
        {
            if (!TryCreateAdjustment(simEvent, quantities, out var adjustment))
            {
                continue;
            }

            adjustments.Add(adjustment);
        }

        return InventorySnapshot.Create(adjustments);
    }

    private static bool TryCreateAdjustment(
        SimEvent simEvent,
        IDictionary<string, int> quantities,
        out InventoryAdjustment adjustment)
    {
        adjustment = null!;
        if (IsLootMaterialOutcome(simEvent))
        {
            var itemId = RequiredValue(simEvent.Results, simEvent.Fields, "item_id", simEvent.EventType);
            var quantity = RequiredInt(simEvent.Results, simEvent.Fields, "quantity", simEvent.EventType);
            adjustment = BuildAdjustment(simEvent, quantities, itemId, quantity, LootMaterialRuleId);
            return true;
        }

        if (simEvent.Fields.TryGetValue("inventory_delta", out var rawDelta) && !string.IsNullOrWhiteSpace(rawDelta))
        {
            var itemId = RequiredValue(simEvent.Fields, simEvent.Results, "item_id", simEvent.EventType);
            if (!int.TryParse(rawDelta, NumberStyles.Integer, CultureInfo.InvariantCulture, out var delta) || delta == 0)
            {
                throw new InvalidOperationException("inventory_delta must be a non-zero integer.");
            }

            adjustment = BuildAdjustment(simEvent, quantities, itemId, delta, FieldOrDefault(simEvent, "ledger_rule_id", ExplicitDeltaRuleId));
            return true;
        }

        return false;
    }

    private static bool IsLootMaterialOutcome(SimEvent simEvent)
    {
        return string.Equals(simEvent.SourceSystem, LootSystem.SourceSystemId, StringComparison.Ordinal)
            && string.Equals(simEvent.EventType, LootSystem.MaterialOutcomeEventType, StringComparison.Ordinal);
    }

    private static InventoryAdjustment BuildAdjustment(
        SimEvent simEvent,
        IDictionary<string, int> quantities,
        string itemId,
        int delta,
        string ruleId)
    {
        if (string.IsNullOrWhiteSpace(itemId))
        {
            throw new InvalidOperationException("ItemLedger item_id must be non-blank.");
        }

        if (string.IsNullOrWhiteSpace(ruleId))
        {
            throw new InvalidOperationException("ItemLedger rule id must be non-blank.");
        }

        var current = quantities.TryGetValue(itemId, out var quantity) ? quantity : 0;
        var next = current + delta;
        if (next < 0)
        {
            throw new InvalidOperationException($"ItemLedger cannot project negative inventory for '{itemId}'.");
        }

        quantities[itemId] = next;
        var metadata = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["actor_id"] = simEvent.ActorId,
            ["event_domain"] = simEvent.Domain.ToId(),
            ["event_source_system"] = simEvent.SourceSystem,
            ["event_type"] = simEvent.EventType,
            ["verb_id"] = simEvent.VerbId
        };

        foreach (var (key, value) in simEvent.Fields)
        {
            metadata.TryAdd(key, value);
        }

        foreach (var (key, value) in simEvent.Results)
        {
            metadata.TryAdd($"result_{key}", value);
        }

        return new InventoryAdjustment(
            EventId: simEvent.Id,
            UpstreamSourceEventId: FieldOrDefault(simEvent, "source_event_id", simEvent.Id),
            Sequence: simEvent.Sequence,
            Tick: simEvent.Tick,
            ActorId: simEvent.ActorId,
            ItemId: itemId,
            Delta: delta,
            QuantityAfter: next,
            RuleId: ruleId,
            SourceSystem: simEvent.SourceSystem,
            EventType: simEvent.EventType,
            Metadata: metadata);
    }

    private static string RequiredValue(
        IReadOnlyDictionary<string, string> primary,
        IReadOnlyDictionary<string, string> secondary,
        string key,
        string eventType)
    {
        var value = primary.TryGetValue(key, out var primaryValue) && !string.IsNullOrWhiteSpace(primaryValue)
            ? primaryValue
            : secondary.TryGetValue(key, out var secondaryValue) && !string.IsNullOrWhiteSpace(secondaryValue)
                ? secondaryValue
                : string.Empty;

        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"ItemLedger requires {key} on {eventType}.");
        }

        return value;
    }

    private static int RequiredInt(
        IReadOnlyDictionary<string, string> primary,
        IReadOnlyDictionary<string, string> secondary,
        string key,
        string eventType)
    {
        var raw = RequiredValue(primary, secondary, key, eventType);
        if (!int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var value) || value <= 0)
        {
            throw new InvalidOperationException($"ItemLedger requires positive integer {key} on {eventType}.");
        }

        return value;
    }

    private static string FieldOrDefault(SimEvent simEvent, string key, string fallback)
    {
        return simEvent.Fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value) ? value : fallback;
    }
}
