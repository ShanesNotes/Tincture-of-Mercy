using Tincture.Substrate.Events;

namespace Tincture.Substrate.Data;

public sealed record AbilityDef
{
    public string AbilityId { get; init; } = string.Empty;

    public VerbDef Verb { get; init; } = new();

    public string PresenterKey { get; init; } = string.Empty;

    public List<string> Tags { get; init; } = [];

    public AbilityDef Validate()
    {
        RequireNonBlank(AbilityId, nameof(AbilityId));
        RequireNonBlank(PresenterKey, nameof(PresenterKey));

        return this with
        {
            Verb = Verb.Validate(),
            Tags = SimEvent.StableTags(Tags)
        };
    }

    private static void RequireNonBlank(string? value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"AbilityDef.{name} must be non-blank.");
        }
    }
}
