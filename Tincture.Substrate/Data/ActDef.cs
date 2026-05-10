using Tincture.Substrate.Events;

namespace Tincture.Substrate.Data;

public sealed record ActDef
{
    public string ActId { get; init; } = string.Empty;

    public string TitleKey { get; init; } = string.Empty;

    public List<ActBeatDef> Beats { get; init; } = [];

    public SortedDictionary<string, string> Metadata { get; init; } = new(StringComparer.Ordinal);

    public List<string> Tags { get; init; } = [];

    public ActDef Validate()
    {
        RequireNonBlank(ActId, nameof(ActId));
        RequireNonBlank(TitleKey, nameof(TitleKey));
        if (Beats.Count == 0)
        {
            throw new InvalidOperationException("ActDef.Beats must contain at least one beat.");
        }

        var normalizedBeats = Beats
            .Select(beat => beat.Validate())
            .OrderBy(beat => beat.SortOrder)
            .ThenBy(beat => beat.BeatId, StringComparer.Ordinal)
            .ToList();
        if (normalizedBeats.Select(beat => beat.BeatId).Distinct(StringComparer.Ordinal).Count() != normalizedBeats.Count)
        {
            throw new InvalidOperationException("ActDef.Beats must have unique beat ids.");
        }

        return this with
        {
            Beats = normalizedBeats,
            Metadata = SimEvent.StableDictionary(Metadata),
            Tags = SimEvent.StableTags(Tags)
        };
    }

    private static void RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"ActDef.{name} must be non-blank.");
        }
    }
}
