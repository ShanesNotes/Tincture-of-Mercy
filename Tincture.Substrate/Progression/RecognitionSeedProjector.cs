using Tincture.Substrate.Events;

namespace Tincture.Substrate.Progression;

public sealed class RecognitionSeedProjector
{
    public RecognitionSeedSnapshot Project(IEnumerable<SimEvent> events)
    {
        ArgumentNullException.ThrowIfNull(events);

        var seeds = new List<RecognitionSeed>();
        var duplicates = new List<RecognitionSeedDuplicate>();
        var firstBySourceKindPerson = new SortedDictionary<string, RecognitionSeed>(StringComparer.Ordinal);

        foreach (var simEvent in events.OrderBy(simEvent => simEvent.Sequence))
        {
            foreach (var seed in SeedsFor(simEvent))
            {
                var guardKey = $"{seed.SourceEventId}|{seed.Kind.ToId()}|{seed.PersonId}";
                if (firstBySourceKindPerson.TryGetValue(guardKey, out var first))
                {
                    duplicates.Add(new RecognitionSeedDuplicate(
                        seed.SourceEventId,
                        seed.Kind,
                        seed.PersonId,
                        first.EventId,
                        seed.EventId));
                    continue;
                }

                firstBySourceKindPerson[guardKey] = seed;
                seeds.Add(seed);
            }
        }

        return RecognitionSeedSnapshot.Create(seeds, duplicates);
    }

    private static IEnumerable<RecognitionSeed> SeedsFor(SimEvent simEvent)
    {
        var kinds = new SortedSet<RecognitionSeedKind>();
        if (HasBreadSignal(simEvent))
        {
            kinds.Add(RecognitionSeedKind.Bread);
        }

        if (HasNameSignal(simEvent))
        {
            kinds.Add(RecognitionSeedKind.Name);
        }

        if (HasPresenceSignal(simEvent))
        {
            kinds.Add(RecognitionSeedKind.Presence);
        }

        if (HasWitnessSignal(simEvent))
        {
            kinds.Add(RecognitionSeedKind.Witness);
        }

        if (HasProtectionSignal(simEvent))
        {
            kinds.Add(RecognitionSeedKind.Protection);
        }

        if (HasNotebookPersonRecordSignal(simEvent))
        {
            kinds.Add(RecognitionSeedKind.NotebookPersonRecord);
        }

        if (HasIconographicSignal(simEvent))
        {
            kinds.Add(RecognitionSeedKind.Iconographic);
        }

        if (simEvent.Fields.TryGetValue("recognition_seed_kind", out var explicitKind) && !string.IsNullOrWhiteSpace(explicitKind))
        {
            kinds.Add(RecognitionSeedKindExtensions.FromId(explicitKind));
        }

        foreach (var kind in kinds)
        {
            yield return BuildSeed(simEvent, kind);
        }
    }

    private static RecognitionSeed BuildSeed(SimEvent simEvent, RecognitionSeedKind kind)
    {
        var sourceEventId = FieldOrDefault(simEvent, "source_event_id", simEvent.Id);
        var personId = PersonIdFor(simEvent);
        var label = LabelFor(simEvent, kind);
        var seedId = FieldOrDefault(simEvent, "recognition_seed", $"{kind.ToId()}:{personId}:{sourceEventId}");

        return RecognitionSeed.Create(
            seedId,
            kind,
            sourceEventId,
            simEvent.Id,
            simEvent.Sequence,
            simEvent.Tick,
            simEvent.ActorId,
            simEvent.TargetId,
            personId,
            label,
            simEvent.Domain,
            simEvent.SourceSystem,
            simEvent.EventType,
            MetadataFor(simEvent));
    }

    private static IReadOnlyDictionary<string, string> MetadataFor(SimEvent simEvent)
    {
        var metadata = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["actor_id"] = simEvent.ActorId,
            ["event_domain"] = simEvent.Domain.ToId(),
            ["event_source_system"] = simEvent.SourceSystem,
            ["event_type"] = simEvent.EventType,
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

    private static string PersonIdFor(SimEvent simEvent)
    {
        return FieldOrDefault(simEvent, "person_id", simEvent.TargetId ?? simEvent.ActorId);
    }

    private static string LabelFor(SimEvent simEvent, RecognitionSeedKind kind)
    {
        return FieldOrDefault(
            simEvent,
            "recognition_label",
            FieldOrDefault(
                simEvent,
                "name",
                FieldOrDefault(
                    simEvent,
                    "copy_key",
                    FieldOrDefault(
                        simEvent,
                        "item_id",
                        FieldOrDefault(simEvent, "witness_hook", kind.ToId())))));
    }

    private static bool HasBreadSignal(SimEvent simEvent)
    {
        return ContainsToken(simEvent.VerbId, "bread")
            || ContainsToken(simEvent.EventType, "bread")
            || TagsContain(simEvent, "bread")
            || FieldContains(simEvent, "item_id", "bread")
            || FieldContains(simEvent, "recognition_seed", "bread");
    }

    private static bool HasNameSignal(SimEvent simEvent)
    {
        return string.Equals(simEvent.VerbId, "notebook.write_name", StringComparison.Ordinal)
            || HasNonBlankField(simEvent, "name")
            || FieldContains(simEvent, "recognition_seed", "name");
    }

    private static bool HasPresenceSignal(SimEvent simEvent)
    {
        return ContainsToken(simEvent.VerbId, "presence")
            || ContainsToken(simEvent.EventType, "presence")
            || TagsContain(simEvent, "presence")
            || HasNonBlankField(simEvent, "presence")
            || FieldContains(simEvent, "recognition_seed", "presence");
    }

    private static bool HasWitnessSignal(SimEvent simEvent)
    {
        return simEvent.Domain == SimDomain.Witness
            || string.Equals(simEvent.EventType, "witness_hook_recorded", StringComparison.Ordinal)
            || TagsContain(simEvent, "witness")
            || TagsContain(simEvent, "witnessed")
            || FieldContains(simEvent, "recognition_seed", "witness");
    }

    private static bool HasProtectionSignal(SimEvent simEvent)
    {
        return ContainsToken(simEvent.VerbId, "protect")
            || ContainsToken(simEvent.EventType, "protect")
            || TagsContain(simEvent, "protection")
            || TagsContain(simEvent, "protected")
            || FieldContains(simEvent, "recognition_seed", "protect");
    }

    private static bool HasNotebookPersonRecordSignal(SimEvent simEvent)
    {
        return simEvent.Domain == SimDomain.Notebook
            || simEvent.VerbId.StartsWith("notebook.", StringComparison.Ordinal)
            || HasNonBlankField(simEvent, "notebook_entry_id");
    }

    private static bool HasIconographicSignal(SimEvent simEvent)
    {
        return ContainsToken(simEvent.VerbId, "iconographic")
            || ContainsToken(simEvent.EventType, "iconographic")
            || TagsContain(simEvent, "iconographic")
            || FieldContains(simEvent, "recognition_seed", "iconographic")
            || FieldContains(simEvent, "path_id", "iconographic");
    }

    private static bool HasNonBlankField(SimEvent simEvent, string key)
    {
        return simEvent.Fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value);
    }

    private static bool FieldContains(SimEvent simEvent, string key, string token)
    {
        return simEvent.Fields.TryGetValue(key, out var value) && ContainsToken(value, token);
    }

    private static bool TagsContain(SimEvent simEvent, string tag)
    {
        return simEvent.Tags.Contains(tag, StringComparer.Ordinal);
    }

    private static bool ContainsToken(string value, string token)
    {
        return value.Contains(token, StringComparison.Ordinal);
    }

    private static string FieldOrDefault(SimEvent simEvent, string key, string fallback)
    {
        return simEvent.Fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value) ? value : fallback;
    }
}
