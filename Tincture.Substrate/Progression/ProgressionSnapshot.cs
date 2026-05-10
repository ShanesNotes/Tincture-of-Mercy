using System.Collections.Immutable;
using Tincture.Substrate.Data;

namespace Tincture.Substrate.Progression;

public sealed record ProgressionSnapshot
{
    private ProgressionSnapshot(
        int witness,
        int recollection,
        int vocation,
        int debugXp,
        IReadOnlyDictionary<LatentPath, int> pathPoints,
        IReadOnlyList<ProgressionEntry> entries,
        IReadOnlyList<ProgressionDuplicateSource> duplicates)
    {
        Witness = witness;
        Recollection = recollection;
        Vocation = vocation;
        DebugXp = debugXp;
        PathPoints = pathPoints;
        Entries = entries;
        Duplicates = duplicates;
    }

    public int Witness { get; }

    public int Recollection { get; }

    public int Vocation { get; }

    public int DebugXp { get; }

    public IReadOnlyDictionary<LatentPath, int> PathPoints { get; }

    public IReadOnlyList<ProgressionEntry> Entries { get; }

    public IReadOnlyList<ProgressionDuplicateSource> Duplicates { get; }

    public static ProgressionSnapshot FromEntries(
        IEnumerable<ProgressionEntry> entries,
        IEnumerable<ProgressionDuplicateSource> duplicates)
    {
        ArgumentNullException.ThrowIfNull(entries);
        ArgumentNullException.ThrowIfNull(duplicates);

        var stableEntries = entries
            .OrderBy(entry => entry.Sequence)
            .ThenBy(entry => entry.ProgressionKey, StringComparer.Ordinal)
            .ThenBy(entry => entry.EventId, StringComparer.Ordinal)
            .ToList()
            .AsReadOnly();
        var stableDuplicates = duplicates
            .OrderBy(duplicate => duplicate.SourceEventId, StringComparer.Ordinal)
            .ThenBy(duplicate => duplicate.ProgressionKey, StringComparer.Ordinal)
            .ThenBy(duplicate => duplicate.DuplicateEventId, StringComparer.Ordinal)
            .ToList()
            .AsReadOnly();

        var pathPoints = new SortedDictionary<LatentPath, int>();
        foreach (var entry in stableEntries.Where(entry => entry.Path is not null))
        {
            var path = entry.Path!.Value;
            pathPoints[path] = pathPoints.TryGetValue(path, out var current) ? current + entry.Delta : entry.Delta;
        }

        return new ProgressionSnapshot(
            witness: stableEntries.Where(entry => entry.Track == ProgressionTrack.Witness).Sum(entry => entry.Delta),
            recollection: stableEntries.Where(entry => entry.Track == ProgressionTrack.Recollection).Sum(entry => entry.Delta),
            vocation: stableEntries.Where(entry => entry.Track == ProgressionTrack.Vocation).Sum(entry => entry.Delta),
            debugXp: stableEntries.Where(entry => entry.Track == ProgressionTrack.DebugXp).Sum(entry => entry.Delta),
            pathPoints: pathPoints.ToImmutableSortedDictionary(pair => pair.Key, pair => pair.Value),
            entries: stableEntries,
            duplicates: stableDuplicates);
    }
}
