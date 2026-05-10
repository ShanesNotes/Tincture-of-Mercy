using Tincture.Substrate.Events;

namespace Tincture.Substrate.Actors;

public sealed record CooldownDefinition
{
    public string CooldownId { get; init; } = string.Empty;

    public long DurationTicks { get; init; }

    public SortedDictionary<ResourceKey, int> ResourceCosts { get; init; } = new();

    public SortedDictionary<string, string> ConsequenceFields { get; init; } = new(StringComparer.Ordinal);

    public List<string> Tags { get; init; } = [];

    public CooldownDefinition Validate()
    {
        if (string.IsNullOrWhiteSpace(CooldownId))
        {
            throw new InvalidOperationException("CooldownDefinition.CooldownId must be non-blank.");
        }

        if (DurationTicks <= 0)
        {
            throw new InvalidOperationException("CooldownDefinition.DurationTicks must be positive.");
        }

        foreach (var (key, amount) in ResourceCosts)
        {
            _ = key.ToId();
            if (amount < 0)
            {
                throw new InvalidOperationException("CooldownDefinition costs must be non-negative.");
            }
        }

        return this with
        {
            ConsequenceFields = SimEvent.StableDictionary(ConsequenceFields),
            Tags = SimEvent.StableTags(Tags)
        };
    }
}
