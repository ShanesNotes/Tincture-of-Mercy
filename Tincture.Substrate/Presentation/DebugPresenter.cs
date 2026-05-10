using System.Globalization;
using Tincture.Substrate.Events;

namespace Tincture.Substrate.Presentation;

public sealed class DebugPresenter : IPresenter<IReadOnlyList<PresentationEvent>, DebugPresentation>
{
    public DebugPresentation Present(IReadOnlyList<PresentationEvent> input)
    {
        ArgumentNullException.ThrowIfNull(input);

        var rows = input
            .Select((simEvent, index) => DebugPresentationRow.Create(simEvent.Id, index + 1, EntriesFor(simEvent)))
            .ToList();

        return DebugPresentation.Create(rows);
    }

    private static IEnumerable<DebugPresentationEntry> EntriesFor(PresentationEvent simEvent)
    {
        foreach (var entry in IdentityEntries(simEvent))
        {
            yield return entry;
        }

        foreach (var (key, value) in simEvent.Fields)
        {
            yield return new DebugPresentationEntry("fields", key, value);
        }

        foreach (var (key, value) in simEvent.Costs)
        {
            yield return new DebugPresentationEntry("costs", key, value);
        }

        foreach (var (key, value) in simEvent.Results)
        {
            yield return new DebugPresentationEntry("results", key, value);
        }

        for (var index = 0; index < simEvent.Tags.Count; index++)
        {
            yield return new DebugPresentationEntry("tags", index.ToString(CultureInfo.InvariantCulture), simEvent.Tags[index]);
        }
    }

    private static IEnumerable<DebugPresentationEntry> IdentityEntries(PresentationEvent simEvent)
    {
        yield return new DebugPresentationEntry("identity", "id", simEvent.Id);
        yield return new DebugPresentationEntry("identity", "sequence", simEvent.Sequence.ToString(CultureInfo.InvariantCulture));
        yield return new DebugPresentationEntry("identity", "tick", simEvent.Tick.ToString(CultureInfo.InvariantCulture));
        yield return new DebugPresentationEntry("identity", "actor_id", simEvent.ActorId);
        yield return new DebugPresentationEntry("identity", "target_id", simEvent.TargetId ?? string.Empty);
        yield return new DebugPresentationEntry("identity", "verb_id", simEvent.VerbId);
        yield return new DebugPresentationEntry("identity", "domain", simEvent.Domain.ToId());
        yield return new DebugPresentationEntry("identity", "source_system", simEvent.SourceSystem);
        yield return new DebugPresentationEntry("identity", "event_type", simEvent.EventType);
    }
}
