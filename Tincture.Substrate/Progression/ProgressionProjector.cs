using System.Globalization;
using Tincture.Substrate.Data;
using Tincture.Substrate.Events;

namespace Tincture.Substrate.Progression;

public sealed class ProgressionProjector
{
    public ProgressionSnapshot Project(IEnumerable<SimEvent> events)
    {
        ArgumentNullException.ThrowIfNull(events);

        var entries = new List<ProgressionEntry>();
        var duplicates = new List<ProgressionDuplicateSource>();
        var firstBySourceAndKey = new SortedDictionary<string, ProgressionEntry>(StringComparer.Ordinal);

        foreach (var simEvent in events.OrderBy(simEvent => simEvent.Sequence))
        {
            foreach (var entry in EntriesFor(simEvent))
            {
                var guardKey = $"{entry.SourceEventId}|{entry.ProgressionKey}";
                if (firstBySourceAndKey.TryGetValue(guardKey, out var first))
                {
                    duplicates.Add(new ProgressionDuplicateSource(
                        entry.SourceEventId,
                        entry.ProgressionKey,
                        first.EventId,
                        entry.EventId));
                    continue;
                }

                firstBySourceAndKey[guardKey] = entry;
                entries.Add(entry);
            }
        }

        return ProgressionSnapshot.FromEntries(entries, duplicates);
    }

    private static IEnumerable<ProgressionEntry> EntriesFor(SimEvent simEvent)
    {
        var sourceEventId = SourceEventId(simEvent);
        var ruleId = FieldOrDefault(simEvent, "progression_rule_id", RuleIdFor(simEvent));
        var metadata = SharedMetadata(simEvent);

        if (TryInt(simEvent, "witness_delta", out var witnessDelta))
        {
            yield return Entry(simEvent, sourceEventId, ProgressionTrack.Witness, null, witnessDelta, ruleId, metadata);
        }
        else if (IsWitnessEvent(simEvent))
        {
            yield return Entry(simEvent, sourceEventId, ProgressionTrack.Witness, null, 1, "progression.witness.event.v1", metadata);
        }

        if (TryInt(simEvent, "recollection_delta", out var recollectionDelta))
        {
            yield return Entry(simEvent, sourceEventId, ProgressionTrack.Recollection, null, recollectionDelta, ruleId, metadata);
        }
        else if (HasNonBlankField(simEvent, "recollection_seed"))
        {
            yield return Entry(simEvent, sourceEventId, ProgressionTrack.Recollection, null, 1, "progression.recollection.seed.v1", metadata);
        }

        if (TryInt(simEvent, "vocation_delta", out var vocationDelta))
        {
            yield return Entry(simEvent, sourceEventId, ProgressionTrack.Vocation, null, vocationDelta, ruleId, metadata);
        }

        if (TryInt(simEvent, "debug_xp_delta", out var debugXpDelta))
        {
            yield return Entry(simEvent, sourceEventId, ProgressionTrack.DebugXp, null, debugXpDelta, ruleId, metadata);
        }

        if (TryPath(simEvent, out var path) && TryInt(simEvent, "path_delta", out var pathDelta))
        {
            yield return Entry(simEvent, sourceEventId, ProgressionTrack.Vocation, path, pathDelta, ruleId, metadata);
        }
    }

    private static ProgressionEntry Entry(
        SimEvent simEvent,
        string sourceEventId,
        ProgressionTrack track,
        LatentPath? path,
        int delta,
        string ruleId,
        IReadOnlyDictionary<string, string> metadata)
    {
        return ProgressionEntry.Create(
            sourceEventId,
            simEvent.Id,
            simEvent.Sequence,
            simEvent.Tick,
            track,
            path,
            delta,
            simEvent.Domain,
            simEvent.SourceSystem,
            simEvent.EventType,
            ruleId,
            metadata);
    }

    private static IReadOnlyDictionary<string, string> SharedMetadata(SimEvent simEvent)
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

    private static string RuleIdFor(SimEvent simEvent)
    {
        if (IsWitnessEvent(simEvent))
        {
            return "progression.witness.event.v1";
        }

        if (HasNonBlankField(simEvent, "recollection_seed"))
        {
            return "progression.recollection.seed.v1";
        }

        return "progression.explicit_delta.v1";
    }

    private static bool IsWitnessEvent(SimEvent simEvent)
    {
        return simEvent.Domain == SimDomain.Witness
            || string.Equals(simEvent.EventType, "witness_hook_recorded", StringComparison.Ordinal)
            || simEvent.Tags.Contains("witness", StringComparer.Ordinal)
            || simEvent.Tags.Contains("witnessed", StringComparer.Ordinal);
    }

    private static bool TryPath(SimEvent simEvent, out LatentPath path)
    {
        path = default;
        var pathId = FieldOrDefault(simEvent, "path_id", FieldOrDefault(simEvent, "path", string.Empty));
        if (string.IsNullOrWhiteSpace(pathId))
        {
            return false;
        }

        path = pathId switch
        {
            "apothecary" => LatentPath.Apothecary,
            "hesychasm" => LatentPath.Hesychasm,
            "iconographic" => LatentPath.Iconographic,
            _ => throw new ArgumentOutOfRangeException(nameof(pathId), pathId, "Unknown latent path id.")
        };
        return true;
    }

    private static bool TryInt(SimEvent simEvent, string key, out int value)
    {
        value = 0;
        return simEvent.Fields.TryGetValue(key, out var raw)
            && !string.IsNullOrWhiteSpace(raw)
            && int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value)
            && value != 0;
    }

    private static bool HasNonBlankField(SimEvent simEvent, string key)
    {
        return simEvent.Fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value);
    }

    private static string SourceEventId(SimEvent simEvent)
    {
        return FieldOrDefault(simEvent, "source_event_id", simEvent.Id);
    }

    private static string FieldOrDefault(SimEvent simEvent, string key, string fallback)
    {
        return simEvent.Fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value) ? value : fallback;
    }
}
