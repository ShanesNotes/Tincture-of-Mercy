using Tincture.Substrate.Events;

namespace Tincture.Substrate.Presentation;

public sealed record PresentationSurface
{
    private PresentationSurface(
        string surface,
        SimDomain domain,
        IReadOnlyList<string> sourceEventIds,
        IReadOnlyList<PresentationRow> rows,
        IReadOnlyDictionary<string, string> metadata)
    {
        Surface = surface;
        Domain = domain;
        SourceEventIds = sourceEventIds;
        Rows = rows;
        Metadata = metadata;
    }

    public string Surface { get; }

    public SimDomain Domain { get; }

    public IReadOnlyList<string> SourceEventIds { get; }

    public IReadOnlyList<PresentationRow> Rows { get; }

    public IReadOnlyDictionary<string, string> Metadata { get; }

    public static PresentationSurface Create(
        string surface,
        SimDomain domain,
        IEnumerable<string> sourceEventIds,
        IEnumerable<PresentationRow> rows,
        IReadOnlyDictionary<string, string>? metadata = null)
    {
        if (string.IsNullOrWhiteSpace(surface))
        {
            throw new InvalidOperationException("PresentationSurface.surface must be non-blank.");
        }

        ArgumentNullException.ThrowIfNull(sourceEventIds);
        ArgumentNullException.ThrowIfNull(rows);

        return new PresentationSurface(
            surface,
            domain,
            PresentationCopies.List(sourceEventIds),
            PresentationCopies.List(rows),
            PresentationCopies.Dictionary(metadata ?? new SortedDictionary<string, string>(StringComparer.Ordinal)));
    }
}
