using System.Collections.Immutable;

namespace Tincture.Substrate.Economy;

public sealed record InventorySnapshot
{
    private InventorySnapshot(
        IReadOnlyDictionary<string, InventoryEntry> Entries,
        IReadOnlyList<InventoryAdjustment> Adjustments)
    {
        this.Entries = Entries;
        this.Adjustments = Adjustments;
    }

    public IReadOnlyDictionary<string, InventoryEntry> Entries { get; }

    public IReadOnlyList<InventoryAdjustment> Adjustments { get; }

    public int QuantityOf(string itemId)
    {
        if (string.IsNullOrWhiteSpace(itemId))
        {
            throw new ArgumentException("Item id must be non-blank.", nameof(itemId));
        }

        return Entries.TryGetValue(itemId, out var entry) ? entry.Quantity : 0;
    }

    public static InventorySnapshot Create(IEnumerable<InventoryAdjustment> adjustments)
    {
        ArgumentNullException.ThrowIfNull(adjustments);
        var stableAdjustments = adjustments
            .OrderBy(adjustment => adjustment.Sequence)
            .ThenBy(adjustment => adjustment.EventId, StringComparer.Ordinal)
            .ToList()
            .AsReadOnly();
        var entries = stableAdjustments
            .GroupBy(adjustment => adjustment.ItemId, StringComparer.Ordinal)
            .ToImmutableSortedDictionary(
                group => group.Key,
                group => new InventoryEntry(
                    group.Key,
                    group.Last().QuantityAfter,
                    group.Select(adjustment => adjustment.EventId).Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal).ToList().AsReadOnly(),
                    group.Select(adjustment => adjustment.UpstreamSourceEventId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal).ToList().AsReadOnly()).Validate(),
                StringComparer.Ordinal);

        return new InventorySnapshot(entries, stableAdjustments);
    }
}
