using System.Globalization;
using Tincture.Substrate.Combat;
using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Data;
using Tincture.Substrate.Events;
using Tincture.Substrate.Sim;

namespace Tincture.Substrate.Economy;

public sealed class LootSystem
{
    public const string SourceSystemId = "economy.v1";
    public const string EligibilityRecordedEventType = "loot_eligibility_recorded";
    public const string MaterialOutcomeEventType = "material_outcome_emitted";

    private static readonly HashSet<string> ReservedContextFieldKeys = new(StringComparer.Ordinal)
    {
        "eligible",
        "eligibility_reason",
        "encounter_id",
        "entry_id",
        "item_id",
        "loot_hook",
        "loot_table",
        "quality",
        "quantity",
        "rarity",
        "request_id",
        "roll_kind",
        "roll_step",
        "roll_stream_id",
        "roll_stream_seed",
        "roll_value",
        "root_seed",
        "scripted_entry_id",
        "scripted_fixture_id",
        "source_actor",
        "source_domain",
        "source_event_id",
        "source_event_type",
        "source_system",
        "source_tick"
    };

    private readonly DeathFrictionSystem deathFrictionSystem;

    public LootSystem(DeathFrictionSystem? deathFrictionSystem = null)
    {
        this.deathFrictionSystem = deathFrictionSystem ?? new DeathFrictionSystem();
    }

    public LootResult EvaluateAndAppend(LootRequest request)
    {
        request.Validate();
        var sourceEvent = SourceEvent(request);
        var tableId = ResolveLootTableId(request, sourceEvent);
        var table = RequireLootTable(request, tableId);
        var eligibility = EvaluateEligibility(request, sourceEvent, table.TableId);
        var events = new List<SimEvent> { BuildEligibilityEvent(request, eligibility) };

        LootMaterialOutcome? materialOutcome = null;
        if (eligibility.Eligible)
        {
            materialOutcome = RollMaterial(request, table, eligibility);
            events.Add(BuildMaterialEvent(request, eligibility, materialOutcome));
        }

        var appended = request.EventStream.AppendBatch(events);
        return new LootResult(eligibility, materialOutcome, appended);
    }

    private LootEligibilityDecision EvaluateEligibility(LootRequest request, SimEvent sourceEvent, string lootTableId)
    {
        if (IsDeathOrDownSource(sourceEvent))
        {
            var deathStates = deathFrictionSystem.Project(request.EventStream.Events);
            var reason = RecoverableBodyReason(sourceEvent);
            var isEligible = deathStates.TryGetValue(sourceEvent.ActorId, out var deathState)
                && string.Equals(deathState.LastEventId, sourceEvent.Id, StringComparison.Ordinal)
                && deathState.BodyEligible;

            return Decision(
                sourceEvent,
                lootTableId,
                eligible: isEligible,
                reason: isEligible ? reason : "body_not_recoverable");
        }

        if (IsEncounterWithholdingSource(sourceEvent, out var withheldReason))
        {
            return Decision(sourceEvent, lootTableId, eligible: false, reason: withheldReason);
        }

        return Decision(sourceEvent, lootTableId, eligible: false, reason: "source_event_not_material");
    }

    private static bool IsDeathOrDownSource(SimEvent sourceEvent)
    {
        return string.Equals(sourceEvent.SourceSystem, DeathFrictionSystem.SourceSystemId, StringComparison.Ordinal)
            && (string.Equals(sourceEvent.EventType, DeathFrictionSystem.DiedEventType, StringComparison.Ordinal)
                || string.Equals(sourceEvent.EventType, DeathFrictionSystem.DownedEventType, StringComparison.Ordinal));
    }

    private static bool IsEncounterWithholdingSource(SimEvent sourceEvent, out string reason)
    {
        reason = string.Empty;
        if (!string.Equals(sourceEvent.SourceSystem, EncounterAiSystem.SourceSystemId, StringComparison.Ordinal))
        {
            return false;
        }

        reason = sourceEvent.EventType switch
        {
            EncounterAiSystem.FleeInitiatedEventType => "source_actor_fled",
            EncounterAiSystem.LeashTriggeredEventType => "source_actor_leashed",
            EncounterAiSystem.EncounterFrictionRequestedEventType => "encounter_friction_pending",
            EncounterAiSystem.EncounterRespawnResetEventType => "encounter_respawn_reset",
            _ => string.Empty
        };

        return reason.Length > 0;
    }

    private static LootEligibilityDecision Decision(
        SimEvent sourceEvent,
        string lootTableId,
        bool eligible,
        string reason)
    {
        return new LootEligibilityDecision(
            Eligible: eligible,
            EligibilityReason: reason,
            LootTableId: lootTableId,
            LootHook: FieldOrEmpty(sourceEvent, "loot_hook"),
            SourceActorId: sourceEvent.ActorId,
            SourceEventId: sourceEvent.Id,
            SourceEventType: sourceEvent.EventType,
            SourceSystem: sourceEvent.SourceSystem,
            SourceDomain: sourceEvent.Domain,
            SourceTick: sourceEvent.Tick,
            EncounterId: FieldOrEmpty(sourceEvent, "encounter_id"));
    }

    private static string RecoverableBodyReason(SimEvent sourceEvent)
    {
        var reason = FieldOrEmpty(sourceEvent, "body_eligibility_reason");
        return string.IsNullOrWhiteSpace(reason) ? "recoverable_body" : reason;
    }

    private static LootMaterialOutcome RollMaterial(LootRequest request, LootTableDef table, LootEligibilityDecision eligibility)
    {
        var entry = SelectEntry(request, table, out var roll);
        return new LootMaterialOutcome(
            EntryId: entry.EntryId,
            ItemId: entry.ItemId,
            Quality: entry.Quality,
            Rarity: entry.Rarity,
            Quantity: entry.Quantity,
            LootTableId: table.TableId,
            EligibilityReason: eligibility.EligibilityReason,
            RollKind: roll.RollKind,
            RollValue: roll.Value,
            ScriptedFixtureId: roll.ScriptedFixtureId,
            SeededRoll: roll.SeededRoll,
            ResultFields: entry.ResultFields,
            Tags: entry.Tags);
    }

    private static LootTableEntry SelectEntry(LootRequest request, LootTableDef table, out LootRoll roll)
    {
        if (request.ScriptedEntryId is not null)
        {
            var scriptedEntry = table.Entries.Single(entry => string.Equals(entry.EntryId, request.ScriptedEntryId, StringComparison.Ordinal));
            roll = new LootRoll("scripted", scriptedEntry.MinimumRoll, request.ScriptedFixtureId, null);
            return scriptedEntry;
        }

        if (request.Rng is null)
        {
            throw new InvalidOperationException("LootRequest requires SeededRng or ScriptedEntryId when material outcome is eligible.");
        }

        var seededRoll = request.Rng.Fork(table.RollStreamId).RollInclusive(request.RequestId, 1, 100);
        roll = new LootRoll("seeded", seededRoll.Value, null, seededRoll);
        return table.Entries
            .OrderByDescending(entry => entry.MinimumRoll)
            .FirstOrDefault(entry => seededRoll.Value >= entry.MinimumRoll)
            ?? table.Entries.OrderBy(entry => entry.MinimumRoll).First();
    }

    private static SimEvent BuildEligibilityEvent(LootRequest request, LootEligibilityDecision eligibility)
    {
        var fields = SharedFields(request, eligibility);
        fields["eligible"] = BoolId(eligibility.Eligible);
        AddContextFields(fields, request.ContextFields);

        return new SimEvent
        {
            Tick = request.Tick,
            ActorId = request.ActorId,
            TargetId = eligibility.SourceActorId,
            VerbId = request.VerbId,
            Domain = SimDomain.Economy,
            SourceSystem = SourceSystemId,
            EventType = EligibilityRecordedEventType,
            Fields = SimEvent.StableDictionary(fields),
            Tags = SimEvent.StableTags(["economy", "loot", "eligibility", eligibility.SourceDomain.ToId(), eligibility.EligibilityReason])
        };
    }

    private static SimEvent BuildMaterialEvent(
        LootRequest request,
        LootEligibilityDecision eligibility,
        LootMaterialOutcome outcome)
    {
        var fields = SharedFields(request, eligibility);
        fields["entry_id"] = outcome.EntryId;
        fields["item_id"] = outcome.ItemId;
        fields["quality"] = outcome.Quality.ToId();
        fields["quantity"] = outcome.Quantity.ToString(CultureInfo.InvariantCulture);
        fields["rarity"] = outcome.Rarity.ToId();
        fields["roll_kind"] = outcome.RollKind;
        fields["roll_value"] = outcome.RollValue.ToString(CultureInfo.InvariantCulture);

        if (!string.IsNullOrWhiteSpace(outcome.ScriptedFixtureId))
        {
            fields["scripted_fixture_id"] = outcome.ScriptedFixtureId;
        }

        if (request.ScriptedEntryId is not null)
        {
            fields["scripted_entry_id"] = request.ScriptedEntryId;
        }

        if (outcome.SeededRoll is { } seededRoll)
        {
            fields["root_seed"] = seededRoll.RootSeed.ToString(CultureInfo.InvariantCulture);
            fields["roll_stream_id"] = seededRoll.StreamId;
            fields["roll_stream_seed"] = seededRoll.StreamSeed.ToString(CultureInfo.InvariantCulture);
            fields["roll_step"] = seededRoll.Step.ToString(CultureInfo.InvariantCulture);
        }

        foreach (var (key, value) in outcome.ResultFields)
        {
            fields.TryAdd(key, value);
        }

        AddContextFields(fields, request.ContextFields);

        return new SimEvent
        {
            Tick = request.Tick,
            ActorId = request.ActorId,
            TargetId = eligibility.SourceActorId,
            VerbId = request.VerbId,
            Domain = SimDomain.Economy,
            SourceSystem = SourceSystemId,
            EventType = MaterialOutcomeEventType,
            Fields = SimEvent.StableDictionary(fields),
            Results = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["item_id"] = outcome.ItemId,
                ["quality"] = outcome.Quality.ToId(),
                ["quantity"] = outcome.Quantity.ToString(CultureInfo.InvariantCulture),
                ["rarity"] = outcome.Rarity.ToId()
            }),
            Tags = SimEvent.StableTags([.. outcome.Tags, "economy", "loot", "material", eligibility.SourceDomain.ToId(), outcome.Rarity.ToId(), outcome.Quality.ToId()])
        };
    }

    private static SortedDictionary<string, string> SharedFields(LootRequest request, LootEligibilityDecision eligibility)
    {
        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["eligibility_reason"] = eligibility.EligibilityReason,
            ["loot_hook"] = eligibility.LootHook,
            ["loot_table"] = eligibility.LootTableId,
            ["request_id"] = request.RequestId,
            ["source_actor"] = eligibility.SourceActorId,
            ["source_domain"] = eligibility.SourceDomain.ToId(),
            ["source_event_id"] = eligibility.SourceEventId,
            ["source_event_type"] = eligibility.SourceEventType,
            ["source_system"] = eligibility.SourceSystem,
            ["source_tick"] = eligibility.SourceTick.ToString(CultureInfo.InvariantCulture)
        };

        if (!string.IsNullOrWhiteSpace(eligibility.EncounterId))
        {
            fields["encounter_id"] = eligibility.EncounterId;
        }

        return fields;
    }

    private static void AddContextFields(IDictionary<string, string> fields, IReadOnlyDictionary<string, string> contextFields)
    {
        foreach (var (key, value) in contextFields.OrderBy(pair => pair.Key, StringComparer.Ordinal))
        {
            if (ReservedContextFieldKeys.Contains(key) || fields.ContainsKey(key))
            {
                throw new InvalidOperationException($"Loot context field '{key}' is reserved.");
            }

            fields[key] = value;
        }
    }

    private static SimEvent SourceEvent(LootRequest request)
    {
        return request.EventStream.Events.SingleOrDefault(simEvent => string.Equals(simEvent.Id, request.SourceEventId, StringComparison.Ordinal))
            ?? throw new InvalidOperationException($"Loot source event '{request.SourceEventId}' was not found in the event stream.");
    }

    private static string ResolveLootTableId(LootRequest request, SimEvent sourceEvent)
    {
        var sourceHook = FieldOrEmpty(sourceEvent, "loot_hook");
        var tableId = string.IsNullOrWhiteSpace(sourceHook) ? request.LootTableId : sourceHook;
        if (string.IsNullOrWhiteSpace(tableId))
        {
            throw new InvalidOperationException("LootRequest requires LootTableId when the source event does not carry loot_hook.");
        }

        return tableId;
    }

    private static LootTableDef RequireLootTable(LootRequest request, string tableId)
    {
        if (!request.LootTables.TryGetValue(tableId, out var table))
        {
            throw new InvalidOperationException($"LootRequest is missing loot table '{tableId}'.");
        }

        return table.Validate();
    }

    private static string FieldOrEmpty(SimEvent simEvent, string key)
    {
        return simEvent.Fields.TryGetValue(key, out var value) ? value : string.Empty;
    }

    private static string BoolId(bool value) => value ? "true" : "false";
}

public sealed record LootRequest
{
    public string RequestId { get; init; } = string.Empty;

    public string ActorId { get; init; } = string.Empty;

    public string VerbId { get; init; } = string.Empty;

    public long Tick { get; init; }

    public SimEventStream EventStream { get; init; } = new();

    public string SourceEventId { get; init; } = string.Empty;

    public string? LootTableId { get; init; }

    public IReadOnlyDictionary<string, LootTableDef> LootTables { get; init; } =
        new SortedDictionary<string, LootTableDef>(StringComparer.Ordinal);

    public SeededRng? Rng { get; init; }

    public string? ScriptedEntryId { get; init; }

    public string? ScriptedFixtureId { get; init; }

    public IReadOnlyDictionary<string, string> ContextFields { get; init; } =
        new SortedDictionary<string, string>(StringComparer.Ordinal);

    public void Validate()
    {
        RequireNonBlank(RequestId, nameof(RequestId));
        RequireNonBlank(ActorId, nameof(ActorId));
        RequireNonBlank(VerbId, nameof(VerbId));
        RequireNonBlank(SourceEventId, nameof(SourceEventId));
        ArgumentNullException.ThrowIfNull(EventStream);
        ArgumentNullException.ThrowIfNull(LootTables);
        ArgumentNullException.ThrowIfNull(ContextFields);
        if (Tick < 0)
        {
            throw new InvalidOperationException("LootRequest.Tick must be non-negative.");
        }

        if (LootTableId is not null)
        {
            RequireNonBlank(LootTableId, nameof(LootTableId));
        }

        if (ScriptedEntryId is not null)
        {
            RequireNonBlank(ScriptedEntryId, nameof(ScriptedEntryId));
        }

        if (ScriptedFixtureId is not null)
        {
            RequireNonBlank(ScriptedFixtureId, nameof(ScriptedFixtureId));
        }
    }

    private static void RequireNonBlank(string? value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"LootRequest.{name} must be non-blank.");
        }
    }
}

public sealed record LootEligibilityDecision(
    bool Eligible,
    string EligibilityReason,
    string LootTableId,
    string LootHook,
    string SourceActorId,
    string SourceEventId,
    string SourceEventType,
    string SourceSystem,
    SimDomain SourceDomain,
    long SourceTick,
    string EncounterId);

public sealed record LootMaterialOutcome(
    string EntryId,
    string ItemId,
    LootQuality Quality,
    LootRarity Rarity,
    int Quantity,
    string LootTableId,
    string EligibilityReason,
    string RollKind,
    int RollValue,
    string? ScriptedFixtureId,
    RollResult? SeededRoll,
    IReadOnlyDictionary<string, string> ResultFields,
    IReadOnlyList<string> Tags);

public sealed record LootResult(
    LootEligibilityDecision Eligibility,
    LootMaterialOutcome? MaterialOutcome,
    IReadOnlyList<SimEvent> AppendedEvents);

internal sealed record LootRoll(string RollKind, int Value, string? ScriptedFixtureId, RollResult? SeededRoll);
