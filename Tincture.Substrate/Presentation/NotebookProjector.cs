using System.Globalization;
using Tincture.Substrate.Events;

namespace Tincture.Substrate.Presentation;

public sealed class NotebookProjector : IPresenter<NotebookProjectionRequest, PresentationSurface>
{
    public PresentationSurface Present(NotebookProjectionRequest input)
    {
        input.Validate();

        var rows = input.Events
            .Where(IsNotebookSource)
            .Select((presentationEvent, index) => PresentationRow.Create(
                presentationEvent.Id,
                index + 1,
                LabelFor(presentationEvent),
                MetadataFor(presentationEvent)))
            .ToList();

        return PresentationSurface.Create(
            PresentationSurfaceKeys.Notebook,
            SimDomain.Notebook,
            rows.Select(row => row.SourceEventId),
            rows,
            new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["projector_id"] = "notebook_projector.v1",
                ["row_count"] = rows.Count.ToString(CultureInfo.InvariantCulture),
                ["surface"] = PresentationSurfaceKeys.Notebook
            });
    }

    private static bool IsNotebookSource(PresentationEvent presentationEvent)
    {
        return presentationEvent.Domain == SimDomain.Notebook
            || presentationEvent.VerbId.StartsWith("notebook.", StringComparison.Ordinal)
            || HasNonBlankField(presentationEvent, "notebook_entry_id")
            || HasNonBlankField(presentationEvent, "copy_key")
            || HasNonBlankField(presentationEvent, "name");
    }

    private static string LabelFor(PresentationEvent presentationEvent)
    {
        return FieldOrDefault(
            presentationEvent,
            "copy_key",
            FieldOrDefault(
                presentationEvent,
                "name",
                FieldOrDefault(
                    presentationEvent,
                    "notebook_entry_id",
                    FieldOrDefault(presentationEvent, "presenter_key", presentationEvent.VerbId))));
    }

    private static IReadOnlyDictionary<string, string> MetadataFor(PresentationEvent presentationEvent)
    {
        var metadata = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["actor_id"] = presentationEvent.ActorId,
            ["entry_kind"] = EntryKindFor(presentationEvent),
            ["event_domain"] = presentationEvent.Domain.ToId(),
            ["event_source_system"] = presentationEvent.SourceSystem,
            ["event_type"] = presentationEvent.EventType,
            ["sequence"] = presentationEvent.Sequence.ToString(CultureInfo.InvariantCulture),
            ["tick"] = presentationEvent.Tick.ToString(CultureInfo.InvariantCulture),
            ["verb_id"] = presentationEvent.VerbId
        };

        if (!string.IsNullOrWhiteSpace(presentationEvent.TargetId))
        {
            metadata["target_id"] = presentationEvent.TargetId;
        }

        foreach (var (key, value) in presentationEvent.Fields)
        {
            metadata.TryAdd(key, value);
        }

        return metadata;
    }

    private static string EntryKindFor(PresentationEvent presentationEvent)
    {
        if (HasNonBlankField(presentationEvent, "person_id") || HasNonBlankField(presentationEvent, "name"))
        {
            return "person_record";
        }

        return "named_event";
    }

    private static bool HasNonBlankField(PresentationEvent presentationEvent, string key)
    {
        return presentationEvent.Fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value);
    }

    private static string FieldOrDefault(PresentationEvent presentationEvent, string key, string fallback)
    {
        return presentationEvent.Fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value) ? value : fallback;
    }
}

public sealed record NotebookProjectionRequest(IReadOnlyList<PresentationEvent> Events)
{
    public void Validate()
    {
        ArgumentNullException.ThrowIfNull(Events);
    }
}
