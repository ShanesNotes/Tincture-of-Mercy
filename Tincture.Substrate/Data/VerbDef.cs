using Tincture.Substrate.Actors;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;

namespace Tincture.Substrate.Data;

public sealed record VerbDef
{
    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public OutcomeTable OutcomeTable { get; init; } = new();

    public SortedDictionary<ResourceKey, int> ResourceCosts { get; init; } = new();

    public string TimerId { get; init; } = string.Empty;

    public string? CooldownId { get; init; }

    public string PresenterKey { get; init; } = string.Empty;

    public List<string> RequiredItemIds { get; init; } = [];

    public List<string> Tags { get; init; } = [];

    public VerbDef Validate()
    {
        RequireNonBlank(VerbId, nameof(VerbId));
        _ = Domain.ToId();
        ValidateOutcomeTable(OutcomeTable);
        if (ResourceCosts.Count == 0)
        {
            throw new InvalidOperationException("VerbDef.ResourceCosts must declare at least one cost row.");
        }

        foreach (var (key, amount) in ResourceCosts)
        {
            _ = key.ToId();
            if (amount < 0)
            {
                throw new InvalidOperationException("VerbDef.ResourceCosts must be non-negative.");
            }
        }

        RequireNonBlank(TimerId, nameof(TimerId));
        if (CooldownId is not null)
        {
            RequireNonBlank(CooldownId, nameof(CooldownId));
        }

        RequireNonBlank(PresenterKey, nameof(PresenterKey));
        foreach (var itemId in RequiredItemIds)
        {
            RequireNonBlank(itemId, nameof(RequiredItemIds));
        }

        return this with
        {
            ResourceCosts = new SortedDictionary<ResourceKey, int>(ResourceCosts),
            RequiredItemIds = SimEvent.StableTags(RequiredItemIds),
            Tags = SimEvent.StableTags(Tags)
        };
    }

    private static void ValidateOutcomeTable(OutcomeTable table)
    {
        RequireNonBlank(table.TableId, "OutcomeTable.TableId");
        RequireNonBlank(table.RollStreamId, "OutcomeTable.RollStreamId");
        if (table.Entries.Count == 0)
        {
            throw new InvalidOperationException("VerbDef.OutcomeTable must have at least one entry.");
        }

        foreach (var entry in table.Entries)
        {
            RequireNonBlank(entry.EntryId, "OutcomeTableEntry.EntryId");
            RequireNonBlank(entry.OutcomeKey, "OutcomeTableEntry.OutcomeKey");
            _ = SimEvent.StableDictionary(entry.ResultFields);
            _ = SimEvent.StableTags(entry.Tags);
        }
    }

    private static void RequireNonBlank(string? value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"VerbDef.{name} must be non-blank.");
        }
    }
}
