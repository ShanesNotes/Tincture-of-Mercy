namespace Tincture.Substrate.Presentation;

public sealed record DebugPresentation
{
    private DebugPresentation(
        IReadOnlyList<string> sourceEventIds,
        IReadOnlyList<DebugPresentationRow> rows)
    {
        SourceEventIds = sourceEventIds;
        Rows = rows;
    }

    public IReadOnlyList<string> SourceEventIds { get; }

    public IReadOnlyList<DebugPresentationRow> Rows { get; }

    public static DebugPresentation Create(IEnumerable<DebugPresentationRow> rows)
    {
        ArgumentNullException.ThrowIfNull(rows);
        var rowList = rows.ToList();
        return new DebugPresentation(
            PresentationCopies.List(rowList.Select(row => row.SourceEventId)),
            PresentationCopies.List(rowList));
    }
}

public sealed record DebugPresentationRow
{
    private DebugPresentationRow(string sourceEventId, long order, IReadOnlyList<DebugPresentationEntry> entries)
    {
        SourceEventId = sourceEventId;
        Order = order;
        Entries = entries;
    }

    public string SourceEventId { get; }

    public long Order { get; }

    public IReadOnlyList<DebugPresentationEntry> Entries { get; }

    public static DebugPresentationRow Create(string sourceEventId, long order, IEnumerable<DebugPresentationEntry> entries)
    {
        if (string.IsNullOrWhiteSpace(sourceEventId))
        {
            throw new InvalidOperationException("DebugPresentationRow.SourceEventId must be non-blank.");
        }

        ArgumentNullException.ThrowIfNull(entries);
        return new DebugPresentationRow(sourceEventId, order, PresentationCopies.List(entries));
    }
}

public sealed record DebugPresentationEntry
{
    public DebugPresentationEntry(string section, string key, string value)
    {
        Section = RequireNonBlank(section, nameof(section));
        Key = RequireNonBlank(key, nameof(key));
        Value = value;
    }

    public string Section { get; }

    public string Key { get; }

    public string Value { get; }

    private static string RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"DebugPresentationEntry.{name} must be non-blank.");
        }

        return value;
    }
}
