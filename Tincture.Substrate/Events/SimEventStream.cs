namespace Tincture.Substrate.Events;

public sealed class SimEventStream
{
    private readonly List<SimEvent> events = [];
    private long nextSequence = 1;

    public SimEventStream(int? capacity = null)
    {
        if (capacity is <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(capacity), "Capacity must be positive when provided.");
        }

        Capacity = capacity;
    }

    public int? Capacity { get; }

    public IReadOnlyList<SimEvent> Events => events.AsReadOnly();

    public IReadOnlyList<SimEvent> AppendBatch(IEnumerable<SimEvent> batch)
    {
        ArgumentNullException.ThrowIfNull(batch);

        var incoming = batch.ToList();
        foreach (var simEvent in incoming)
        {
            simEvent.ValidateForAppend();
        }

        var assigned = new List<SimEvent>(incoming.Count);
        var sequence = nextSequence;
        foreach (var simEvent in incoming)
        {
            assigned.Add(simEvent.WithStreamIdentity(sequence++));
        }

        var incomingIds = assigned.Select(simEvent => simEvent.Id).ToHashSet(StringComparer.Ordinal);
        if (incomingIds.Count != assigned.Count)
        {
            throw new InvalidOperationException("AppendBatch cannot append duplicate event ids in the same batch.");
        }

        if (events.Any(existing => incomingIds.Contains(existing.Id)))
        {
            throw new InvalidOperationException("AppendBatch cannot append an event id that already exists in the stream.");
        }

        events.AddRange(assigned);
        nextSequence = sequence;
        TrimToCapacity();
        return assigned.AsReadOnly();
    }

    public string ToStableJson() => SimEventJson.SerializeEvents(events);

    // When capacity is provided, replay loading applies the same ring-buffer trim as live appends.
    public static SimEventStream FromStableJson(string json, int? capacity = null)
    {
        var stream = new SimEventStream(capacity);
        var replayEvents = SimEventJson.DeserializeEvents(json)
            .OrderBy(simEvent => simEvent.Sequence)
            .ToList();

        stream.events.AddRange(replayEvents);
        stream.nextSequence = replayEvents.Count == 0 ? 1 : replayEvents.Max(simEvent => simEvent.Sequence) + 1;
        stream.TrimToCapacity();
        return stream;
    }

    private void TrimToCapacity()
    {
        if (Capacity is not { } capacity)
        {
            return;
        }

        while (events.Count > capacity)
        {
            events.RemoveAt(0);
        }
    }
}
