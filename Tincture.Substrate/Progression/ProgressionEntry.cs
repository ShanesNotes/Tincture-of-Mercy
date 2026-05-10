using System.Collections.Immutable;
using Tincture.Substrate.Data;
using Tincture.Substrate.Events;

namespace Tincture.Substrate.Progression;

public sealed record ProgressionEntry
{
    private ProgressionEntry(
        string sourceEventId,
        string eventId,
        long sequence,
        long tick,
        ProgressionTrack track,
        LatentPath? path,
        int delta,
        SimDomain sourceDomain,
        string sourceSystem,
        string sourceEventType,
        string ruleId,
        IReadOnlyDictionary<string, string> metadata)
    {
        SourceEventId = sourceEventId;
        EventId = eventId;
        Sequence = sequence;
        Tick = tick;
        Track = track;
        Path = path;
        Delta = delta;
        SourceDomain = sourceDomain;
        SourceSystem = sourceSystem;
        SourceEventType = sourceEventType;
        RuleId = ruleId;
        Metadata = metadata;
    }

    public string SourceEventId { get; }

    public string EventId { get; }

    public long Sequence { get; }

    public long Tick { get; }

    public ProgressionTrack Track { get; }

    public LatentPath? Path { get; }

    public int Delta { get; }

    public SimDomain SourceDomain { get; }

    public string SourceSystem { get; }

    public string SourceEventType { get; }

    public string RuleId { get; }

    public IReadOnlyDictionary<string, string> Metadata { get; }

    public string ProgressionKey => Path is { } path
        ? $"{Track.ToId()}:{path.ToId()}"
        : Track.ToId();

    public static ProgressionEntry Create(
        string sourceEventId,
        string eventId,
        long sequence,
        long tick,
        ProgressionTrack track,
        LatentPath? path,
        int delta,
        SimDomain sourceDomain,
        string sourceSystem,
        string sourceEventType,
        string ruleId,
        IReadOnlyDictionary<string, string>? metadata = null)
    {
        RequireNonBlank(sourceEventId, nameof(sourceEventId));
        RequireNonBlank(eventId, nameof(eventId));
        RequireNonBlank(sourceSystem, nameof(sourceSystem));
        RequireNonBlank(sourceEventType, nameof(sourceEventType));
        RequireNonBlank(ruleId, nameof(ruleId));
        if (sequence <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(sequence), "ProgressionEntry sequence must be positive.");
        }

        if (tick < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(tick), "ProgressionEntry tick must be non-negative.");
        }

        if (delta == 0)
        {
            throw new InvalidOperationException("ProgressionEntry delta must be non-zero.");
        }

        return new ProgressionEntry(
            sourceEventId,
            eventId,
            sequence,
            tick,
            track,
            path,
            delta,
            sourceDomain,
            sourceSystem,
            sourceEventType,
            ruleId,
            StableDictionary(metadata ?? new SortedDictionary<string, string>(StringComparer.Ordinal)));
    }

    internal static IReadOnlyDictionary<string, string> StableDictionary(IReadOnlyDictionary<string, string> source)
    {
        return source
            .OrderBy(pair => pair.Key, StringComparer.Ordinal)
            .ToImmutableSortedDictionary(pair => pair.Key, pair => pair.Value, StringComparer.Ordinal);
    }

    private static void RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"ProgressionEntry.{name} must be non-blank.");
        }
    }
}

public sealed record ProgressionDuplicateSource(
    string SourceEventId,
    string ProgressionKey,
    string FirstEventId,
    string DuplicateEventId);
