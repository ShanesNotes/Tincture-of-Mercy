using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;
using Tincture.Substrate.World;

namespace Tincture.Substrate.Combat;

public sealed class EncounterAiSystem
{
    public const string SourceSystemId = "encounter_ai.v1";
    public const string SpatialBandChangedEventType = "spatial_band_changed";
    public const string ThreatTargetChangedEventType = "threat_target_changed";
    public const string AggroEnteredEventType = "aggro_entered";
    public const string AggroExitedEventType = "aggro_exited";
    public const string PackCallEmittedEventType = "pack_call_emitted";
    public const string FleeInitiatedEventType = "flee_initiated";
    public const string LeashTriggeredEventType = "leash_triggered";
    public const string RouteNodeReachedEventType = "route_node_reached";
    public const string EncounterFrictionRequestedEventType = "encounter_friction_requested";
    public const string EncounterRespawnResetEventType = "encounter_respawn_reset";

    private readonly AttentionThreatTable threatTable;
    private readonly AggroCallFleeRadius aggroCallFleeRadius;
    private readonly EncounterRouteState routeState;
    private readonly LeashRespawnState leashRespawnState;
    private readonly DeathFrictionSystem deathFrictionSystem;

    public EncounterAiSystem(
        AttentionThreatTable? threatTable = null,
        AggroCallFleeRadius? aggroCallFleeRadius = null,
        EncounterRouteState? routeState = null,
        LeashRespawnState? leashRespawnState = null,
        DeathFrictionSystem? deathFrictionSystem = null)
    {
        this.threatTable = threatTable ?? new AttentionThreatTable();
        this.aggroCallFleeRadius = aggroCallFleeRadius ?? new AggroCallFleeRadius();
        this.routeState = routeState ?? new EncounterRouteState();
        this.leashRespawnState = leashRespawnState ?? new LeashRespawnState();
        this.deathFrictionSystem = deathFrictionSystem ?? new DeathFrictionSystem();
    }

    public EncounterAiResult EvaluateAndAppend(EncounterAiRequest request)
    {
        request.Validate();
        var deathStates = deathFrictionSystem.Project(request.EventStream.Events);
        var candidates = new List<EncounterEventCandidate>();

        AddSpatialBandCandidate(request, candidates);
        AddThreatCandidate(request, candidates);

        if (request.AggroCallFleeRequest is not null)
        {
            candidates.AddRange(aggroCallFleeRadius.Evaluate(request.AggroCallFleeRequest));
        }

        if (request.RouteRequest is not null)
        {
            candidates.AddRange(routeState.Evaluate(request.RouteRequest));
        }

        if (request.LeashRespawnRequest is not null)
        {
            candidates.AddRange(leashRespawnState.Evaluate(request.LeashRespawnRequest with
            {
                DeathFrictionStates = deathStates
            }));
        }

        candidates.AddRange(request.AdditionalCandidates.Select(candidate => candidate.Validate()));
        var orderedCandidates = candidates
            .OrderBy(candidate => candidate.Tick)
            .ThenBy(candidate => candidate.Kind)
            .ThenBy(candidate => candidate.ActorId, StringComparer.Ordinal)
            .ThenBy(candidate => candidate.TargetId, StringComparer.Ordinal)
            .ToList();

        var events = orderedCandidates.Select(BuildEvent).ToList();
        var appended = events.Count == 0 ? [] : request.EventStream.AppendBatch(events);
        return new EncounterAiResult(
            AppendedEvents: appended,
            AttackIntents: request.AttackIntents,
            DeathFrictionStates: deathStates);
    }

    private static void AddSpatialBandCandidate(EncounterAiRequest request, ICollection<EncounterEventCandidate> candidates)
    {
        if (request.SpatialBandPair is null)
        {
            return;
        }

        var pair = request.SpatialBandPair;
        var band = request.SpatialContext.BandBetween(pair.ActorId, pair.TargetId);
        if (request.PreviousSpatialBand == band)
        {
            return;
        }

        candidates.Add(new EncounterEventCandidate
        {
            Kind = EncounterEventKind.SpatialBandChanged,
            Tick = request.Tick,
            ActorId = pair.ActorId,
            TargetId = pair.TargetId,
            VerbId = request.VerbId,
            Domain = request.Domain,
            Fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["actor_id"] = pair.ActorId,
                ["encounter_id"] = request.EncounterId,
                ["previous_spatial_band"] = request.PreviousSpatialBand?.ToId() ?? string.Empty,
                ["spatial_band"] = band.ToId(),
                ["target_id"] = pair.TargetId
            },
            Tags = ["encounter_ai", "spatial", request.Domain.ToId()]
        }.Validate());
    }

    private void AddThreatCandidate(EncounterAiRequest request, ICollection<EncounterEventCandidate> candidates)
    {
        if (request.ThreatTargetRequest is null)
        {
            return;
        }

        var candidate = threatTable.TargetChangedCandidate(request.ThreatTargetRequest);
        if (candidate is not null)
        {
            candidates.Add(candidate);
        }
    }

    private static SimEvent BuildEvent(EncounterEventCandidate candidate)
    {
        var normalized = candidate.Validate();
        ValidateDeathSource(normalized);
        return new SimEvent
        {
            Tick = normalized.Tick,
            ActorId = normalized.ActorId,
            TargetId = normalized.TargetId,
            VerbId = normalized.VerbId,
            Domain = normalized.Domain,
            SourceSystem = SourceSystemId,
            EventType = EventTypeFor(normalized.Kind),
            Fields = normalized.Fields,
            Tags = SimEvent.StableTags([.. normalized.Tags, "encounter_ai", normalized.Domain.ToId()])
        };
    }

    private static void ValidateDeathSource(EncounterEventCandidate candidate)
    {
        if (candidate.Kind is not (EncounterEventKind.EncounterFrictionRequested or EncounterEventKind.EncounterRespawnReset))
        {
            return;
        }

        if (candidate.Fields.TryGetValue("death_triggered", out var deathTriggered)
            && string.Equals(deathTriggered, "true", StringComparison.Ordinal)
            && (!candidate.Fields.TryGetValue("source_death_event_id", out var sourceDeathEventId) || string.IsNullOrWhiteSpace(sourceDeathEventId)))
        {
            throw new InvalidOperationException("Death-driven encounter friction/respawn events require source_death_event_id.");
        }
    }

    private static string EventTypeFor(EncounterEventKind kind) => kind switch
    {
        EncounterEventKind.SpatialBandChanged => SpatialBandChangedEventType,
        EncounterEventKind.ThreatTargetChanged => ThreatTargetChangedEventType,
        EncounterEventKind.AggroEntered => AggroEnteredEventType,
        EncounterEventKind.AggroExited => AggroExitedEventType,
        EncounterEventKind.PackCallEmitted => PackCallEmittedEventType,
        EncounterEventKind.FleeInitiated => FleeInitiatedEventType,
        EncounterEventKind.LeashTriggered => LeashTriggeredEventType,
        EncounterEventKind.RouteNodeReached => RouteNodeReachedEventType,
        EncounterEventKind.EncounterFrictionRequested => EncounterFrictionRequestedEventType,
        EncounterEventKind.EncounterRespawnReset => EncounterRespawnResetEventType,
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown encounter event kind.")
    };
}

public sealed record EncounterAiRequest
{
    public string EncounterId { get; init; } = string.Empty;

    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public long Tick { get; init; }

    public SimEventStream EventStream { get; init; } = new();

    public SpatialContext SpatialContext { get; init; } = null!;

    public SpatialBandPair? SpatialBandPair { get; init; }

    public SpatialBand? PreviousSpatialBand { get; init; }

    public ThreatTargetRequest? ThreatTargetRequest { get; init; }

    public AggroCallFleeRequest? AggroCallFleeRequest { get; init; }

    public EncounterRouteRequest? RouteRequest { get; init; }

    public LeashRespawnRequest? LeashRespawnRequest { get; init; }

    public IReadOnlyList<EncounterEventCandidate> AdditionalCandidates { get; init; } = [];

    public IReadOnlyList<VerbInvocationRequest> AttackIntents { get; init; } = [];

    public void Validate()
    {
        RequireNonBlank(EncounterId, nameof(EncounterId));
        RequireNonBlank(VerbId, nameof(VerbId));
        _ = Domain.ToId();
        if (Tick < 0)
        {
            throw new InvalidOperationException("EncounterAiRequest.Tick must be non-negative.");
        }

        ArgumentNullException.ThrowIfNull(EventStream);
        ArgumentNullException.ThrowIfNull(SpatialContext);
        ArgumentNullException.ThrowIfNull(AdditionalCandidates);
        ArgumentNullException.ThrowIfNull(AttackIntents);
    }

    private static void RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{name} must be non-blank.");
        }
    }
}

public sealed record SpatialBandPair(string ActorId, string TargetId);

public sealed record EncounterAiResult(
    IReadOnlyList<SimEvent> AppendedEvents,
    IReadOnlyList<VerbInvocationRequest> AttackIntents,
    IReadOnlyDictionary<string, DeathFrictionState> DeathFrictionStates);
