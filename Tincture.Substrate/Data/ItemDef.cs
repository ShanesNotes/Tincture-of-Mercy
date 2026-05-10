using Tincture.Substrate.Events;

namespace Tincture.Substrate.Data;

public sealed record ItemDef
{
    public string ItemId { get; init; } = string.Empty;

    public string PresenterKey { get; init; } = string.Empty;

    public List<string> VerbIds { get; init; } = [];

    public List<string> Tags { get; init; } = [];

    public ItemDef Validate()
    {
        RequireNonBlank(ItemId, nameof(ItemId));
        RequireNonBlank(PresenterKey, nameof(PresenterKey));

        foreach (var verbId in VerbIds)
        {
            RequireNonBlank(verbId, nameof(VerbIds));
        }

        return this with
        {
            VerbIds = SimEvent.StableTags(VerbIds),
            Tags = SimEvent.StableTags(Tags)
        };
    }

    private static void RequireNonBlank(string? value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"ItemDef.{name} must be non-blank.");
        }
    }
}
