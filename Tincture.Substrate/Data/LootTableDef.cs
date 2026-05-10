using Tincture.Substrate.Economy;
using Tincture.Substrate.Events;

namespace Tincture.Substrate.Data;

public sealed record LootTableDef
{
    public string TableId { get; init; } = string.Empty;

    public string RollStreamId { get; init; } = "loot";

    public List<LootTableEntry> Entries { get; init; } = [];

    public List<string> Tags { get; init; } = [];

    public LootTableDef Validate()
    {
        RequireNonBlank(TableId, nameof(TableId));
        RequireNonBlank(RollStreamId, nameof(RollStreamId));
        if (Entries.Count == 0)
        {
            throw new InvalidOperationException("LootTableDef.Entries must contain at least one row.");
        }

        var normalizedEntries = Entries
            .Select(entry => entry.Validate())
            .OrderBy(entry => entry.MinimumRoll)
            .ThenBy(entry => entry.EntryId, StringComparer.Ordinal)
            .ToList();

        if (normalizedEntries.Select(entry => entry.EntryId).Distinct(StringComparer.Ordinal).Count() != normalizedEntries.Count)
        {
            throw new InvalidOperationException("LootTableDef.Entries must have unique entry ids.");
        }

        return this with
        {
            Entries = normalizedEntries,
            Tags = SimEvent.StableTags(Tags)
        };
    }

    private static void RequireNonBlank(string? value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"LootTableDef.{name} must be non-blank.");
        }
    }
}

public sealed record LootTableEntry
{
    public string EntryId { get; init; } = string.Empty;

    public string ItemId { get; init; } = string.Empty;

    public int MinimumRoll { get; init; } = 1;

    public int Quantity { get; init; } = 1;

    public LootQuality Quality { get; init; } = LootQuality.Standard;

    public LootRarity Rarity { get; init; } = LootRarity.Common;


    public SortedDictionary<string, string> ResultFields { get; init; } = new(StringComparer.Ordinal);

    public List<string> Tags { get; init; } = [];

    public LootTableEntry Validate()
    {
        RequireNonBlank(EntryId, nameof(EntryId));
        RequireNonBlank(ItemId, nameof(ItemId));
        _ = Quality.ToId();
        _ = Rarity.ToId();
        if (MinimumRoll is < 1 or > 100)
        {
            throw new InvalidOperationException("LootTableEntry.MinimumRoll must be between 1 and 100.");
        }

        if (Quantity <= 0)
        {
            throw new InvalidOperationException("LootTableEntry.Quantity must be positive.");
        }

        return this with
        {
            ResultFields = SimEvent.StableDictionary(ResultFields),
            Tags = SimEvent.StableTags(Tags)
        };
    }

    private static void RequireNonBlank(string? value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"LootTableEntry.{name} must be non-blank.");
        }
    }
}
