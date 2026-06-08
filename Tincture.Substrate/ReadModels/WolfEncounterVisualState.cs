using System.Globalization;
using Tincture.Substrate.Combat;
using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Economy;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;

namespace Tincture.Substrate.ReadModels;

public sealed record WolfEncounterVisualState(
    string EncounterId,
    string ObjectiveState,
    string ActiveAudioCue,
    string IiroRouteState,
    string IiroRouteNode,
    string IiroAnimationRow,
    bool IiroSafe,
    bool KalevDowned,
    bool KalevRecoverable,
    bool KalevRecovered,
    int KalevRecoveryTicksRemaining,
    IReadOnlyDictionary<string, WolfActorVisualState> Wolves,
    IReadOnlyList<WolfLootVisualState> Loot,
    IReadOnlyList<string> SourceEventIds)
{
    public static WolfEncounterVisualState Empty { get; } = new(
        EncounterId: string.Empty,
        ObjectiveState: string.Empty,
        ActiveAudioCue: string.Empty,
        IiroRouteState: string.Empty,
        IiroRouteNode: string.Empty,
        IiroAnimationRow: "idle",
        IiroSafe: false,
        KalevDowned: false,
        KalevRecoverable: false,
        KalevRecovered: false,
        KalevRecoveryTicksRemaining: 0,
        Wolves: new SortedDictionary<string, WolfActorVisualState>(StringComparer.Ordinal),
        Loot: [],
        SourceEventIds: []);

    public bool HasWolfLoot => Loot.Any(loot => loot.Quantity > 0);

    public bool HasWithheldLoot => Wolves.Values.Any(wolf => wolf.LootWithheld);
}

public sealed record WolfActorVisualState(
    string ActorId,
    string AnimationRow,
    string ThreatState,
    string CurrentTargetId,
    string PreviousTargetId,
    string ThreatReason,
    int DamageTaken,
    int ThreatDelta,
    bool IsDead,
    bool BodyRecoverable,
    bool IsLeashed,
    bool LootReady,
    bool LootWithheld,
    string LootWithheldReason,
    string LootItemId,
    int LootQuantity,
    string LastSourceEventId)
{
    public static WolfActorVisualState Empty(string actorId) => new(
        ActorId: actorId,
        AnimationRow: "idle",
        ThreatState: string.Empty,
        CurrentTargetId: string.Empty,
        PreviousTargetId: string.Empty,
        ThreatReason: string.Empty,
        DamageTaken: 0,
        ThreatDelta: 0,
        IsDead: false,
        BodyRecoverable: false,
        IsLeashed: false,
        LootReady: false,
        LootWithheld: false,
        LootWithheldReason: string.Empty,
        LootItemId: string.Empty,
        LootQuantity: 0,
        LastSourceEventId: string.Empty);
}

public sealed record WolfLootVisualState(
    string SourceActorId,
    string ItemId,
    int Quantity,
    string Quality,
    string Rarity,
    string SourceEventId);

public sealed class WolfEncounterVisualStateProjector
{
    public WolfEncounterVisualState Project(IEnumerable<SimEvent> events)
    {
        ArgumentNullException.ThrowIfNull(events);

        var ordered = events.OrderBy(simEvent => simEvent.Sequence).ToList();
        if (ordered.Count == 0)
        {
            return WolfEncounterVisualState.Empty;
        }

        var state = new MutableWolfEncounterVisualState();
        foreach (var simEvent in ordered)
        {
            state.RememberSource(simEvent);
            AssignIfPresent(simEvent.Fields, "encounter_id", value => state.EncounterId = value);
            AssignIfPresent(simEvent.Fields, "audio_cue", value => state.ActiveAudioCue = value);

            ProjectEncounterAi(simEvent, state);
            ProjectDamage(simEvent, state);
            ProjectDeathFriction(simEvent, state);
            ProjectLoot(simEvent, state);
        }

        if (string.IsNullOrWhiteSpace(state.ObjectiveState) && !string.IsNullOrWhiteSpace(state.EncounterId))
        {
            state.ObjectiveState = "in_progress";
        }

        return state.ToSnapshot();
    }

    private static void ProjectEncounterAi(SimEvent simEvent, MutableWolfEncounterVisualState state)
    {
        switch (simEvent.EventType)
        {
            case EncounterAiSystem.AggroEnteredEventType:
                ProjectAggroEntered(simEvent, state);
                break;
            case EncounterAiSystem.SpatialBandChangedEventType:
                ProjectSpatialBand(simEvent, state);
                break;
            case EncounterAiSystem.ThreatTargetChangedEventType:
                ProjectThreat(simEvent, state);
                break;
            case EncounterAiSystem.FleeInitiatedEventType:
                ProjectFlee(simEvent, state);
                break;
            case EncounterAiSystem.LeashTriggeredEventType:
                ProjectLeash(simEvent, state);
                break;
            case EncounterAiSystem.RouteNodeReachedEventType:
                ProjectRoute(simEvent, state);
                break;
        }
    }

    private static void ProjectAggroEntered(SimEvent simEvent, MutableWolfEncounterVisualState state)
    {
        if (!IsWolfId(simEvent.ActorId))
        {
            return;
        }

        var wolf = state.Wolf(simEvent.ActorId);
        wolf.ThreatState = "aggro";
        wolf.CurrentTargetId = TargetId(simEvent);
        wolf.AnimationRow = "alert";
        wolf.LastSourceEventId = simEvent.Id;
        AssignIfPresent(simEvent.Fields, "iiro_posture", value => state.IiroAnimationRow = IiroRow(value));
    }

    private static void ProjectSpatialBand(SimEvent simEvent, MutableWolfEncounterVisualState state)
    {
        if (!IsWolfId(simEvent.ActorId))
        {
            return;
        }

        var wolf = state.Wolf(simEvent.ActorId);
        var band = Field(simEvent.Fields, "spatial_band");
        wolf.ThreatState = string.IsNullOrWhiteSpace(band) ? "spatial" : $"spatial:{band}";
        wolf.CurrentTargetId = TargetId(simEvent);
        wolf.AnimationRow = band is "near" or "aggro" ? "approach" : "idle";
        wolf.LastSourceEventId = simEvent.Id;
    }

    private static void ProjectThreat(SimEvent simEvent, MutableWolfEncounterVisualState state)
    {
        if (!IsWolfId(simEvent.ActorId))
        {
            return;
        }

        var target = FirstNonBlank(
            Field(simEvent.Fields, "new_target_id"),
            Field(simEvent.Fields, "target_id"),
            simEvent.TargetId ?? string.Empty);
        var wolf = state.Wolf(simEvent.ActorId);
        wolf.ThreatState = "targeting";
        wolf.CurrentTargetId = target;
        wolf.PreviousTargetId = Field(simEvent.Fields, "previous_target_id");
        wolf.ThreatReason = Field(simEvent.Fields, "threat_reason");
        wolf.AnimationRow = target == "kalev" ? "attack" : "approach";
        wolf.LastSourceEventId = simEvent.Id;
    }

    private static void ProjectFlee(SimEvent simEvent, MutableWolfEncounterVisualState state)
    {
        if (!IsWolfId(simEvent.ActorId))
        {
            return;
        }

        var wolf = state.Wolf(simEvent.ActorId);
        wolf.ThreatState = "fleeing";
        wolf.CurrentTargetId = TargetId(simEvent);
        wolf.AnimationRow = "flee";
        wolf.LastSourceEventId = simEvent.Id;
    }

    private static void ProjectLeash(SimEvent simEvent, MutableWolfEncounterVisualState state)
    {
        var actorId = FirstNonBlank(Field(simEvent.Fields, "source_actor"), simEvent.ActorId);
        if (!IsWolfId(actorId))
        {
            return;
        }

        var wolf = state.Wolf(actorId);
        wolf.IsLeashed = true;
        wolf.ThreatState = "leashed";
        wolf.CurrentTargetId = TargetId(simEvent);
        wolf.AnimationRow = "flee";
        wolf.LastSourceEventId = simEvent.Id;
    }

    private static void ProjectRoute(SimEvent simEvent, MutableWolfEncounterVisualState state)
    {
        var routeId = Field(simEvent.Fields, "route_id");
        var personId = Field(simEvent.Fields, "person_id");
        if (routeId != "iiro.escape" && personId != "iiro" && simEvent.ActorId != "iiro")
        {
            return;
        }

        state.IiroRouteState = routeId;
        state.IiroRouteNode = Field(simEvent.Fields, "node_id");
        state.IiroAnimationRow = "safe";
        if (routeId == "iiro.escape")
        {
            state.IiroSafe = true;
            state.ObjectiveState = "iiro_safe";
        }
    }

    private static void ProjectDamage(SimEvent simEvent, MutableWolfEncounterVisualState state)
    {
        if (!string.Equals(simEvent.EventType, OutcomeResolver.ResolvedEventType, StringComparison.Ordinal) || !IsWolfId(simEvent.TargetId ?? string.Empty))
        {
            return;
        }

        var wolf = state.Wolf(simEvent.TargetId!);
        wolf.DamageTaken += IntField(simEvent.Results, "damage");
        wolf.ThreatDelta += IntField(simEvent.Fields, "threat_delta");
        if (!wolf.IsDead && !wolf.IsLeashed)
        {
            wolf.AnimationRow = "hurt";
        }

        wolf.LastSourceEventId = simEvent.Id;
    }

    private static void ProjectDeathFriction(SimEvent simEvent, MutableWolfEncounterVisualState state)
    {
        switch (simEvent.EventType)
        {
            case DeathFrictionSystem.DiedEventType:
                ProjectDeath(simEvent, state);
                break;
            case DeathFrictionSystem.DownedEventType:
                ProjectDowned(simEvent, state);
                break;
            case DeathFrictionSystem.RecoveredEventType:
                ProjectRecovery(simEvent, state);
                break;
        }
    }

    private static void ProjectDeath(SimEvent simEvent, MutableWolfEncounterVisualState state)
    {
        if (IsWolfId(simEvent.ActorId))
        {
            var wolf = state.Wolf(simEvent.ActorId);
            wolf.IsDead = true;
            wolf.ThreatState = "dead";
            wolf.AnimationRow = "dead";
            wolf.BodyRecoverable = BoolField(simEvent.Fields, "body_eligible");
            wolf.LastSourceEventId = simEvent.Id;
            return;
        }

        if (simEvent.ActorId != "kalev")
        {
            return;
        }

        state.KalevDowned = true;
        state.KalevRecoverable = false;
        state.KalevRecovered = false;
        state.ObjectiveState = "kalev_dead";
    }

    private static void ProjectDowned(SimEvent simEvent, MutableWolfEncounterVisualState state)
    {
        if (IsWolfId(simEvent.ActorId))
        {
            var wolf = state.Wolf(simEvent.ActorId);
            wolf.AnimationRow = "hurt";
            wolf.ThreatState = "downed";
            wolf.LastSourceEventId = simEvent.Id;
            return;
        }

        if (simEvent.ActorId != "kalev")
        {
            return;
        }

        state.KalevDowned = true;
        state.KalevRecoverable = BoolField(simEvent.Fields, "recoverable");
        state.KalevRecovered = false;
        state.KalevRecoveryTicksRemaining = IntField(simEvent.Fields, "remaining_recovery_ticks");
        if (!state.IiroSafe)
        {
            state.ObjectiveState = "kalev_fallen";
        }
    }

    private static void ProjectRecovery(SimEvent simEvent, MutableWolfEncounterVisualState state)
    {
        if (simEvent.ActorId != "kalev")
        {
            return;
        }

        state.KalevDowned = false;
        state.KalevRecoverable = false;
        state.KalevRecovered = true;
        state.KalevRecoveryTicksRemaining = 0;
        if (!state.IiroSafe)
        {
            state.ObjectiveState = "kalev_recovered";
        }
    }

    private static void ProjectLoot(SimEvent simEvent, MutableWolfEncounterVisualState state)
    {
        if (simEvent.EventType == LootSystem.EligibilityRecordedEventType)
        {
            var sourceActor = Field(simEvent.Fields, "source_actor");
            if (!IsWolfId(sourceActor))
            {
                return;
            }

            var eligibilityWolf = state.Wolf(sourceActor);
            if (BoolField(simEvent.Fields, "eligible"))
            {
                eligibilityWolf.BodyRecoverable = true;
            }
            else
            {
                eligibilityWolf.LootWithheld = true;
                eligibilityWolf.LootWithheldReason = Field(simEvent.Fields, "eligibility_reason");
                if (!eligibilityWolf.IsDead)
                {
                    eligibilityWolf.AnimationRow = "flee";
                }
            }

            eligibilityWolf.LastSourceEventId = simEvent.Id;
            return;
        }

        if (simEvent.EventType != LootSystem.MaterialOutcomeEventType)
        {
            return;
        }

        var materialSourceActor = Field(simEvent.Fields, "source_actor");
        if (!IsWolfId(materialSourceActor))
        {
            return;
        }

        var itemId = Field(simEvent.Fields, "item_id");
        var quantity = IntField(simEvent.Fields, "quantity");
        var sourceEventId = Field(simEvent.Fields, "source_event_id");
        var loot = new WolfLootVisualState(
            SourceActorId: materialSourceActor,
            ItemId: itemId,
            Quantity: quantity,
            Quality: Field(simEvent.Fields, "quality"),
            Rarity: Field(simEvent.Fields, "rarity"),
            SourceEventId: sourceEventId);

        state.Loot.Add(loot);
        var wolf = state.Wolf(materialSourceActor);
        wolf.LootReady = true;
        wolf.LootItemId = itemId;
        wolf.LootQuantity = quantity;
        wolf.LastSourceEventId = simEvent.Id;
    }

    private static string IiroRow(string posture) => posture switch
    {
        "fleeing" => "flee",
        "sitting" or "seated" or "sit" => "sit",
        "sleeping" or "sleep" => "sleep",
        _ => "idle"
    };

    private static bool IsWolfId(string actorId) => actorId.StartsWith("wolf", StringComparison.Ordinal);

    private static string TargetId(SimEvent simEvent) => FirstNonBlank(Field(simEvent.Fields, "target_id"), simEvent.TargetId ?? string.Empty);

    private static void AssignIfPresent(IReadOnlyDictionary<string, string> fields, string key, Action<string> assign)
    {
        if (fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value))
        {
            assign(value);
        }
    }

    private static string Field(IReadOnlyDictionary<string, string> fields, string key) => fields.TryGetValue(key, out var value) ? value : string.Empty;

    private static bool BoolField(IReadOnlyDictionary<string, string> fields, string key) => Field(fields, key) == "true";

    private static int IntField(IReadOnlyDictionary<string, string> fields, string key)
    {
        return int.TryParse(Field(fields, key), NumberStyles.Integer, CultureInfo.InvariantCulture, out var value) ? value : 0;
    }

    private static string FirstNonBlank(params string[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value)) ?? string.Empty;
    }
}

internal sealed class MutableWolfEncounterVisualState
{
    public string EncounterId { get; set; } = string.Empty;

    public string ObjectiveState { get; set; } = string.Empty;

    public string ActiveAudioCue { get; set; } = string.Empty;

    public string IiroRouteState { get; set; } = string.Empty;

    public string IiroRouteNode { get; set; } = string.Empty;

    public string IiroAnimationRow { get; set; } = "idle";

    public bool IiroSafe { get; set; }

    public bool KalevDowned { get; set; }

    public bool KalevRecoverable { get; set; }

    public bool KalevRecovered { get; set; }

    public int KalevRecoveryTicksRemaining { get; set; }

    public SortedDictionary<string, MutableWolfActorVisualState> Wolves { get; } = new(StringComparer.Ordinal);

    public List<WolfLootVisualState> Loot { get; } = [];

    public SortedSet<string> SourceEventIds { get; } = new(StringComparer.Ordinal);

    public MutableWolfActorVisualState Wolf(string actorId)
    {
        if (!Wolves.TryGetValue(actorId, out var wolf))
        {
            wolf = new MutableWolfActorVisualState(actorId);
            Wolves[actorId] = wolf;
        }

        return wolf;
    }

    public void RememberSource(SimEvent simEvent)
    {
        if (!string.IsNullOrWhiteSpace(simEvent.Id))
        {
            SourceEventIds.Add(simEvent.Id);
        }
    }

    public WolfEncounterVisualState ToSnapshot()
    {
        var wolves = Wolves.ToDictionary(pair => pair.Key, pair => pair.Value.ToSnapshot(), StringComparer.Ordinal);
        return new WolfEncounterVisualState(
            EncounterId,
            ObjectiveState,
            ActiveAudioCue,
            IiroRouteState,
            IiroRouteNode,
            IiroAnimationRow,
            IiroSafe,
            KalevDowned,
            KalevRecoverable,
            KalevRecovered,
            KalevRecoveryTicksRemaining,
            new SortedDictionary<string, WolfActorVisualState>(wolves, StringComparer.Ordinal),
            Loot.ToList().AsReadOnly(),
            SourceEventIds.ToList().AsReadOnly());
    }
}

internal sealed class MutableWolfActorVisualState
{
    public MutableWolfActorVisualState(string actorId)
    {
        ActorId = actorId;
    }

    public string ActorId { get; }

    public string AnimationRow { get; set; } = "idle";

    public string ThreatState { get; set; } = string.Empty;

    public string CurrentTargetId { get; set; } = string.Empty;

    public string PreviousTargetId { get; set; } = string.Empty;

    public string ThreatReason { get; set; } = string.Empty;

    public int DamageTaken { get; set; }

    public int ThreatDelta { get; set; }

    public bool IsDead { get; set; }

    public bool BodyRecoverable { get; set; }

    public bool IsLeashed { get; set; }

    public bool LootReady { get; set; }

    public bool LootWithheld { get; set; }

    public string LootWithheldReason { get; set; } = string.Empty;

    public string LootItemId { get; set; } = string.Empty;

    public int LootQuantity { get; set; }

    public string LastSourceEventId { get; set; } = string.Empty;

    public WolfActorVisualState ToSnapshot() => new(
        ActorId,
        AnimationRow,
        ThreatState,
        CurrentTargetId,
        PreviousTargetId,
        ThreatReason,
        DamageTaken,
        ThreatDelta,
        IsDead,
        BodyRecoverable,
        IsLeashed,
        LootReady,
        LootWithheld,
        LootWithheldReason,
        LootItemId,
        LootQuantity,
        LastSourceEventId);
}
