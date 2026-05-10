using System.Collections.Immutable;

namespace Tincture.Substrate.Presentation;

internal static class PresentationCopies
{
    public static IReadOnlyDictionary<string, string> Dictionary(IReadOnlyDictionary<string, string> source)
    {
        return source
            .OrderBy(pair => pair.Key, StringComparer.Ordinal)
            .ToImmutableSortedDictionary(pair => pair.Key, pair => pair.Value, StringComparer.Ordinal);
    }

    public static IReadOnlyList<string> List(IEnumerable<string> source)
    {
        return source.ToImmutableArray();
    }

    public static IReadOnlyList<T> List<T>(IEnumerable<T> source)
    {
        return source.ToImmutableArray();
    }
}
