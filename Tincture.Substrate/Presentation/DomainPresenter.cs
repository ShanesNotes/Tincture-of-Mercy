using System.Globalization;
using Tincture.Substrate.Events;

namespace Tincture.Substrate.Presentation;

public sealed class DomainPresenter : IPresenter<DomainPresentationRequest, PresentationSurface>
{
    public PresentationSurface Present(DomainPresentationRequest input)
    {
        input.Validate();

        var rows = input.Events
            .Where(simEvent => simEvent.Domain == input.Domain)
            .Select((simEvent, index) => PresentationRow.Create(
                simEvent.Id,
                index + 1,
                LabelFor(simEvent),
                MetadataFor(simEvent)))
            .ToList();

        return PresentationSurface.Create(
            input.Surface,
            input.Domain,
            rows.Select(row => row.SourceEventId),
            rows,
            new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["domain"] = input.Domain.ToId(),
                ["surface"] = input.Surface
            });
    }

    private static string LabelFor(PresentationEvent simEvent)
    {
        if (simEvent.Fields.TryGetValue("presenter_key", out var presenterKey) && !string.IsNullOrWhiteSpace(presenterKey))
        {
            return presenterKey;
        }

        return simEvent.EventType;
    }

    private static IReadOnlyDictionary<string, string> MetadataFor(PresentationEvent simEvent)
    {
        var metadata = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["actor_id"] = simEvent.ActorId,
            ["domain"] = simEvent.Domain.ToId(),
            ["event_type"] = simEvent.EventType,
            ["sequence"] = simEvent.Sequence.ToString(CultureInfo.InvariantCulture),
            ["source_system"] = simEvent.SourceSystem,
            ["tick"] = simEvent.Tick.ToString(CultureInfo.InvariantCulture),
            ["verb_id"] = simEvent.VerbId
        };

        if (!string.IsNullOrWhiteSpace(simEvent.TargetId))
        {
            metadata["target_id"] = simEvent.TargetId;
        }

        foreach (var (key, value) in simEvent.Fields)
        {
            metadata.TryAdd(key, value);
        }

        return metadata;
    }
}

public sealed record DomainPresentationRequest(
    string Surface,
    SimDomain Domain,
    IReadOnlyList<PresentationEvent> Events)
{
    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(Surface))
        {
            throw new InvalidOperationException("DomainPresentationRequest.Surface must be non-blank.");
        }

        ArgumentNullException.ThrowIfNull(Events);
    }
}
