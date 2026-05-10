using System.Text.Json.Serialization;

namespace Tincture.Substrate.Events;

public sealed record SimEvent
{
    [JsonPropertyOrder(0)]
    public string Id { get; init; } = string.Empty;

    [JsonPropertyOrder(1)]
    public long Sequence { get; init; }

    [JsonPropertyOrder(2)]
    public long Tick { get; init; }

    [JsonPropertyOrder(3)]
    public string ActorId { get; init; } = string.Empty;

    [JsonPropertyOrder(4)]
    public string? TargetId { get; init; }

    [JsonPropertyOrder(5)]
    public SimEventLocation? Location { get; init; }

    [JsonPropertyOrder(6)]
    public string VerbId { get; init; } = string.Empty;

    [JsonPropertyOrder(7)]
    public SimDomain Domain { get; init; }

    [JsonPropertyOrder(8)]
    public string SourceSystem { get; init; } = string.Empty;

    [JsonPropertyOrder(9)]
    public string EventType { get; init; } = string.Empty;

    [JsonPropertyOrder(10)]
    public SortedDictionary<string, string> Fields { get; init; } = new(StringComparer.Ordinal);

    [JsonPropertyOrder(11)]
    public SortedDictionary<string, string> Costs { get; init; } = new(StringComparer.Ordinal);

    [JsonPropertyOrder(12)]
    public SortedDictionary<string, string> Results { get; init; } = new(StringComparer.Ordinal);

    [JsonPropertyOrder(13)]
    public List<string> Tags { get; init; } = [];

    public SimEvent WithStreamIdentity(long sequence)
    {
        if (sequence <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(sequence), "Event sequence must be positive.");
        }

        // Blank ids opt into stream-owned deterministic ids. Authored ids are preserved for fixtures or imported logs.
        var id = string.IsNullOrWhiteSpace(Id) ? $"evt-{sequence:D8}" : Id;
        return this with
        {
            Id = id,
            Sequence = sequence,
            Fields = StableDictionary(Fields),
            Costs = StableDictionary(Costs),
            Results = StableDictionary(Results),
            Tags = StableTags(Tags)
        };
    }

    public void ValidateForAppend()
    {
        if (Tick < 0)
        {
            throw new InvalidOperationException("SimEvent.Tick must be non-negative.");
        }

        RequireNonBlank(ActorId, nameof(ActorId));
        RequireNonBlank(VerbId, nameof(VerbId));
        RequireNonBlank(SourceSystem, nameof(SourceSystem));
        RequireNonBlank(EventType, nameof(EventType));
    }

    public static SortedDictionary<string, string> StableDictionary(IEnumerable<KeyValuePair<string, string>> values)
    {
        var stable = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var (key, value) in values.OrderBy(pair => pair.Key, StringComparer.Ordinal))
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                throw new InvalidOperationException("SimEvent metadata keys must be non-blank.");
            }

            stable[key] = value;
        }

        return stable;
    }

    public static List<string> StableTags(IEnumerable<string> tags) => tags
        .Where(tag => !string.IsNullOrWhiteSpace(tag))
        .Select(tag => tag.Trim())
        .Distinct(StringComparer.Ordinal)
        .OrderBy(tag => tag, StringComparer.Ordinal)
        .ToList();

    private static void RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"SimEvent.{name} must be non-blank.");
        }
    }
}
