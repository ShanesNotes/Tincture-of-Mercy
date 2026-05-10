namespace Tincture.Substrate.Presentation;

public sealed record PresentationRow
{
    private PresentationRow(
        string sourceEventId,
        long order,
        string label,
        IReadOnlyDictionary<string, string> metadata)
    {
        SourceEventId = sourceEventId;
        Order = order;
        Label = label;
        Metadata = metadata;
    }

    public string SourceEventId { get; }

    public long Order { get; }

    public string Label { get; }

    public IReadOnlyDictionary<string, string> Metadata { get; }

    public static PresentationRow Create(
        string sourceEventId,
        long order,
        string label,
        IReadOnlyDictionary<string, string> metadata)
    {
        RequireNonBlank(sourceEventId, nameof(sourceEventId));
        RequireNonBlank(label, nameof(label));
        ArgumentNullException.ThrowIfNull(metadata);

        return new PresentationRow(sourceEventId, order, label, PresentationCopies.Dictionary(metadata));
    }

    private static void RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"PresentationRow.{name} must be non-blank.");
        }
    }
}
