using Tincture.Substrate.Events;

namespace Tincture.Substrate.Progression;

public sealed record RecognitionSeed
{
    private RecognitionSeed(
        string seedId,
        RecognitionSeedKind kind,
        string sourceEventId,
        string eventId,
        long sequence,
        long tick,
        string actorId,
        string? targetId,
        string personId,
        string label,
        SimDomain sourceDomain,
        string sourceSystem,
        string sourceEventType,
        IReadOnlyDictionary<string, string> metadata)
    {
        SeedId = seedId;
        Kind = kind;
        SourceEventId = sourceEventId;
        EventId = eventId;
        Sequence = sequence;
        Tick = tick;
        ActorId = actorId;
        TargetId = targetId;
        PersonId = personId;
        Label = label;
        SourceDomain = sourceDomain;
        SourceSystem = sourceSystem;
        SourceEventType = sourceEventType;
        Metadata = metadata;
    }

    public string SeedId { get; }

    public RecognitionSeedKind Kind { get; }

    public string SourceEventId { get; }

    public string EventId { get; }

    public long Sequence { get; }

    public long Tick { get; }

    public string ActorId { get; }

    public string? TargetId { get; }

    public string PersonId { get; }

    public string Label { get; }

    public SimDomain SourceDomain { get; }

    public string SourceSystem { get; }

    public string SourceEventType { get; }

    public IReadOnlyDictionary<string, string> Metadata { get; }

    public static RecognitionSeed Create(
        string seedId,
        RecognitionSeedKind kind,
        string sourceEventId,
        string eventId,
        long sequence,
        long tick,
        string actorId,
        string? targetId,
        string personId,
        string label,
        SimDomain sourceDomain,
        string sourceSystem,
        string sourceEventType,
        IReadOnlyDictionary<string, string>? metadata = null)
    {
        RequireNonBlank(seedId, nameof(seedId));
        RequireNonBlank(sourceEventId, nameof(sourceEventId));
        RequireNonBlank(eventId, nameof(eventId));
        RequireNonBlank(actorId, nameof(actorId));
        RequireNonBlank(personId, nameof(personId));
        RequireNonBlank(label, nameof(label));
        RequireNonBlank(sourceSystem, nameof(sourceSystem));
        RequireNonBlank(sourceEventType, nameof(sourceEventType));
        if (sequence <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(sequence), "RecognitionSeed sequence must be positive.");
        }

        if (tick < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(tick), "RecognitionSeed tick must be non-negative.");
        }

        return new RecognitionSeed(
            seedId,
            kind,
            sourceEventId,
            eventId,
            sequence,
            tick,
            actorId,
            targetId,
            personId,
            label,
            sourceDomain,
            sourceSystem,
            sourceEventType,
            ProgressionEntry.StableDictionary(metadata ?? new SortedDictionary<string, string>(StringComparer.Ordinal)));
    }

    private static void RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"RecognitionSeed.{name} must be non-blank.");
        }
    }
}

public sealed record RecognitionSeedDuplicate(
    string SourceEventId,
    RecognitionSeedKind Kind,
    string PersonId,
    string FirstEventId,
    string DuplicateEventId);

public sealed record RecognitionSeedSnapshot(
    IReadOnlyList<RecognitionSeed> Seeds,
    IReadOnlyList<RecognitionSeedDuplicate> Duplicates)
{
    public static RecognitionSeedSnapshot Create(
        IEnumerable<RecognitionSeed> seeds,
        IEnumerable<RecognitionSeedDuplicate> duplicates)
    {
        ArgumentNullException.ThrowIfNull(seeds);
        ArgumentNullException.ThrowIfNull(duplicates);

        return new RecognitionSeedSnapshot(
            seeds.OrderBy(seed => seed.Sequence)
                .ThenBy(seed => seed.Kind.ToId(), StringComparer.Ordinal)
                .ThenBy(seed => seed.PersonId, StringComparer.Ordinal)
                .ToList()
                .AsReadOnly(),
            duplicates.OrderBy(duplicate => duplicate.SourceEventId, StringComparer.Ordinal)
                .ThenBy(duplicate => duplicate.Kind.ToId(), StringComparer.Ordinal)
                .ThenBy(duplicate => duplicate.PersonId, StringComparer.Ordinal)
                .ToList()
                .AsReadOnly());
    }
}
