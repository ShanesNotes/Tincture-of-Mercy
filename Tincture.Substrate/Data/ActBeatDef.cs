using Tincture.Substrate.Events;

namespace Tincture.Substrate.Data;

public sealed record ActBeatDef
{
    public string BeatId { get; init; } = string.Empty;

    public string RuntimeKey { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public long SortOrder { get; init; }

    public List<string> RequiredItemIds { get; init; } = [];

    public List<string> Tags { get; init; } = [];

    public ActBeatDef Validate()
    {
        RequireNonBlank(BeatId, nameof(BeatId));
        RequireNonBlank(RuntimeKey, nameof(RuntimeKey));
        _ = Domain.ToId();
        if (SortOrder < 0)
        {
            throw new InvalidOperationException("ActBeatDef.SortOrder must be non-negative.");
        }

        foreach (var itemId in RequiredItemIds)
        {
            RequireNonBlank(itemId, nameof(RequiredItemIds));
        }

        return this with
        {
            RequiredItemIds = SimEvent.StableTags(RequiredItemIds),
            Tags = SimEvent.StableTags(Tags)
        };
    }

    private static void RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"ActBeatDef.{name} must be non-blank.");
        }
    }
}
