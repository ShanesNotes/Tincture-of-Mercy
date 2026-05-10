namespace Tincture.Substrate.Rules;

public sealed record OutcomeTable
{
    public string TableId { get; init; } = string.Empty;

    public List<OutcomeTableEntry> Entries { get; init; } = [];

    public string RollStreamId { get; init; } = "outcome";
}

public sealed record OutcomeTableEntry
{
    public string EntryId { get; init; } = string.Empty;

    public string OutcomeKey { get; init; } = string.Empty;

    public int MinimumTotal { get; init; }

    public bool Succeeded { get; init; }

    public SortedDictionary<string, string> ResultFields { get; init; } = new(StringComparer.Ordinal);

    public List<string> Tags { get; init; } = [];
}
