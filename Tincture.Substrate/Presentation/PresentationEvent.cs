using Tincture.Substrate.Events;

namespace Tincture.Substrate.Presentation;

public sealed record PresentationEvent
{
    private PresentationEvent(
        string id,
        long sequence,
        long tick,
        string actorId,
        string? targetId,
        SimEventLocation? location,
        string verbId,
        SimDomain domain,
        string sourceSystem,
        string eventType,
        IReadOnlyDictionary<string, string> fields,
        IReadOnlyDictionary<string, string> costs,
        IReadOnlyDictionary<string, string> results,
        IReadOnlyList<string> tags)
    {
        Id = id;
        Sequence = sequence;
        Tick = tick;
        ActorId = actorId;
        TargetId = targetId;
        Location = location;
        VerbId = verbId;
        Domain = domain;
        SourceSystem = sourceSystem;
        EventType = eventType;
        Fields = fields;
        Costs = costs;
        Results = results;
        Tags = tags;
    }

    public string Id { get; }

    public long Sequence { get; }

    public long Tick { get; }

    public string ActorId { get; }

    public string? TargetId { get; }

    public SimEventLocation? Location { get; }

    public string VerbId { get; }

    public SimDomain Domain { get; }

    public string SourceSystem { get; }

    public string EventType { get; }

    public IReadOnlyDictionary<string, string> Fields { get; }

    public IReadOnlyDictionary<string, string> Costs { get; }

    public IReadOnlyDictionary<string, string> Results { get; }

    public IReadOnlyList<string> Tags { get; }

    public static PresentationEvent From(SimEvent simEvent)
    {
        ArgumentNullException.ThrowIfNull(simEvent);

        return new PresentationEvent(
            simEvent.Id,
            simEvent.Sequence,
            simEvent.Tick,
            simEvent.ActorId,
            simEvent.TargetId,
            simEvent.Location is null ? null : simEvent.Location with { },
            simEvent.VerbId,
            simEvent.Domain,
            simEvent.SourceSystem,
            simEvent.EventType,
            PresentationCopies.Dictionary(simEvent.Fields),
            PresentationCopies.Dictionary(simEvent.Costs),
            PresentationCopies.Dictionary(simEvent.Results),
            PresentationCopies.List(simEvent.Tags));
    }

    public static IReadOnlyList<PresentationEvent> Snapshot(IEnumerable<SimEvent> events)
    {
        ArgumentNullException.ThrowIfNull(events);

        return PresentationCopies.List(events.Select(From));
    }
}
