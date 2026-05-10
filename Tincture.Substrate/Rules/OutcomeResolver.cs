using System.Globalization;
using Tincture.Substrate.Events;

namespace Tincture.Substrate.Rules;

public sealed class OutcomeResolver : IOutcomeResolver
{
    public const string ResolverId = "outcome_resolver.v1";

    private readonly ModifierAssembler modifierAssembler;
    private readonly ModifierComposer modifierComposer;

    public OutcomeResolver(ModifierAssembler? modifierAssembler = null, ModifierComposer? modifierComposer = null)
    {
        this.modifierAssembler = modifierAssembler ?? new ModifierAssembler();
        this.modifierComposer = modifierComposer ?? new ModifierComposer();
    }

    public ResolvedOutcome Resolve(OutcomeRequest request)
    {
        ValidateRequest(request);

        var modifiers = modifierAssembler.Assemble(request.Modifiers).ToList();
        var composition = modifierComposer.Compose(modifiers);
        var roll = Roll(request, composition.Total);
        var entry = SelectEntry(request.Table, request.ScriptedEntryId, roll.Total);
        var metadata = BuildMetadata(request, composition, roll, entry);
        var simEvent = BuildEvent(request, metadata, entry);

        return new ResolvedOutcome
        {
            RequestId = request.RequestId,
            ResolverId = ResolverId,
            TableId = request.Table.TableId,
            OutcomeKey = entry.OutcomeKey,
            Succeeded = entry.Succeeded,
            TotalModifier = composition.Total,
            Roll = roll,
            AppliedModifiers = composition.Modifiers,
            Events = new[] { simEvent },
            Metadata = metadata
        };
    }

    private static void ValidateRequest(OutcomeRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        RequireNonBlank(request.RequestId, nameof(request.RequestId));
        RequireNonBlank(request.ActorId, nameof(request.ActorId));
        RequireNonBlank(request.VerbId, nameof(request.VerbId));
        RequireNonBlank(request.Table.TableId, nameof(request.Table.TableId));
        if (request.Tick < 0)
        {
            throw new InvalidOperationException("OutcomeRequest.Tick must be non-negative.");
        }

        if (request.Table.Entries.Count == 0)
        {
            throw new InvalidOperationException("OutcomeRequest.Table must have at least one entry.");
        }

        if (request.ScriptedRollValue is null && request.ScriptedEntryId is null && request.Rng is null)
        {
            throw new InvalidOperationException("OutcomeRequest requires a seeded RNG or a scripted roll/entry.");
        }
    }

    private static ResolverRoll Roll(OutcomeRequest request, int totalModifier)
    {
        if (request.ScriptedEntryId is not null && request.ScriptedRollValue is null)
        {
            var scriptedEntry = request.Table.Entries.Single(entry => entry.EntryId == request.ScriptedEntryId);
            var scriptedValue = scriptedEntry.MinimumTotal;
            return new ResolverRoll("scripted", scriptedValue, scriptedValue + totalModifier, request.ScriptedFixtureId, null);
        }

        if (request.ScriptedRollValue is { } scriptedRoll)
        {
            return new ResolverRoll("scripted", scriptedRoll, scriptedRoll + totalModifier, request.ScriptedFixtureId, null);
        }

        var seededRoll = request.Rng!.RollInclusive(request.RequestId, 1, 100);
        return new ResolverRoll("seeded", seededRoll.Value, seededRoll.Value + totalModifier, null, seededRoll);
    }

    private static OutcomeTableEntry SelectEntry(OutcomeTable table, string? scriptedEntryId, int total)
    {
        if (scriptedEntryId is not null)
        {
            return table.Entries.Single(entry => entry.EntryId == scriptedEntryId);
        }

        return table.Entries
            .OrderByDescending(entry => entry.MinimumTotal)
            .FirstOrDefault(entry => total >= entry.MinimumTotal)
            ?? table.Entries.OrderBy(entry => entry.MinimumTotal).First();
    }

    private static SortedDictionary<string, string> BuildMetadata(
        OutcomeRequest request,
        ModifierComposition composition,
        ResolverRoll roll,
        OutcomeTableEntry entry)
    {
        var metadata = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["request_id"] = request.RequestId,
            ["resolver_id"] = ResolverId,
            ["table_id"] = request.Table.TableId,
            ["outcome"] = entry.OutcomeKey,
            ["roll_kind"] = roll.RollKind,
            ["roll_value"] = roll.Value.ToString(CultureInfo.InvariantCulture),
            ["roll_total"] = roll.Total.ToString(CultureInfo.InvariantCulture),
            ["total_modifier"] = composition.Total.ToString(CultureInfo.InvariantCulture),
            ["modifier_composition"] = composition.RuleId,
            ["modifier_ids"] = string.Join(",", composition.Modifiers.Select(modifier => modifier.ModifierId))
        };

        if (roll.FixtureId is not null)
        {
            metadata["scripted_fixture_id"] = roll.FixtureId;
        }

        if (roll.SeededRoll is { } seededRoll)
        {
            metadata["root_seed"] = seededRoll.RootSeed.ToString(CultureInfo.InvariantCulture);
            metadata["roll_stream_id"] = seededRoll.StreamId;
            metadata["roll_stream_seed"] = seededRoll.StreamSeed.ToString(CultureInfo.InvariantCulture);
            metadata["roll_step"] = seededRoll.Step.ToString(CultureInfo.InvariantCulture);
        }

        foreach (var modifier in composition.Modifiers)
        {
            foreach (var (key, value) in modifier.Metadata)
            {
                metadata.TryAdd(key, value);
            }
        }

        return metadata;
    }

    private static SimEvent BuildEvent(
        OutcomeRequest request,
        SortedDictionary<string, string> metadata,
        OutcomeTableEntry entry)
    {
        var tags = entry.Tags
            .Concat(new[] { request.Domain.ToString().ToLowerInvariant(), "resolved_outcome" })
            .ToList();

        return new SimEvent
        {
            Tick = request.Tick,
            ActorId = request.ActorId,
            TargetId = request.TargetId,
            VerbId = request.VerbId,
            Domain = request.Domain,
            SourceSystem = ResolverId,
            EventType = "outcome_resolved",
            Fields = metadata,
            Results = SimEvent.StableDictionary(entry.ResultFields),
            Tags = SimEvent.StableTags(tags)
        };
    }

    private static void RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{name} must be non-blank.");
        }
    }
}
