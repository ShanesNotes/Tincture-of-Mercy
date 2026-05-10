namespace Tincture.Substrate.Economy;

public sealed record InventoryEntry(
    string ItemId,
    int Quantity,
    IReadOnlyList<string> EventIds,
    IReadOnlyList<string> UpstreamSourceEventIds)
{
    public InventoryEntry Validate()
    {
        if (string.IsNullOrWhiteSpace(ItemId))
        {
            throw new InvalidOperationException("InventoryEntry.ItemId must be non-blank.");
        }

        if (Quantity < 0)
        {
            throw new InvalidOperationException("InventoryEntry.Quantity must be non-negative.");
        }

        ArgumentNullException.ThrowIfNull(EventIds);
        ArgumentNullException.ThrowIfNull(UpstreamSourceEventIds);
        return this;
    }
}

public sealed record InventoryAdjustment(
    string EventId,
    string UpstreamSourceEventId,
    long Sequence,
    long Tick,
    string ActorId,
    string ItemId,
    int Delta,
    int QuantityAfter,
    string RuleId,
    string SourceSystem,
    string EventType,
    IReadOnlyDictionary<string, string> Metadata);
