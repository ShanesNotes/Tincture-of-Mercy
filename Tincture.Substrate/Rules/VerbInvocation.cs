using System.Globalization;
using Tincture.Substrate.Actors;
using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Data;
using Tincture.Substrate.Events;
using Tincture.Substrate.Sim;
using Tincture.Substrate.Sim.Timers;

namespace Tincture.Substrate.Rules;

public sealed class VerbInvocation
{
    public const string SourceSystemId = "verb_invocation.v1";
    public const string CompletedEventType = "verb_invocation_completed";
    public const string RejectedEventType = "verb_invocation_rejected";

    private readonly CostLedger costLedger;
    private readonly TimerSystem timerSystem;
    private readonly CooldownSystem cooldownSystem;
    private readonly AuraSystem auraSystem;
    private readonly ModifierAssembler modifierAssembler;
    private readonly OutcomeResolver outcomeResolver;
    private readonly ConsequenceApplier consequenceApplier;

    public VerbInvocation(
        CostLedger? costLedger = null,
        TimerSystem? timerSystem = null,
        CooldownSystem? cooldownSystem = null,
        AuraSystem? auraSystem = null,
        ModifierAssembler? modifierAssembler = null,
        OutcomeResolver? outcomeResolver = null,
        ConsequenceApplier? consequenceApplier = null)
    {
        this.costLedger = costLedger ?? new CostLedger();
        this.timerSystem = timerSystem ?? new TimerSystem();
        this.cooldownSystem = cooldownSystem ?? new CooldownSystem(this.costLedger);
        this.auraSystem = auraSystem ?? new AuraSystem();
        this.modifierAssembler = modifierAssembler ?? new ModifierAssembler();
        this.outcomeResolver = outcomeResolver ?? new OutcomeResolver(this.modifierAssembler);
        this.consequenceApplier = consequenceApplier ?? new ConsequenceApplier();
    }

    public VerbInvocationResult Invoke(VerbInvocationRequest request)
    {
        request.Validate();
        var verb = request.Verb.Validate();
        var timerDefinition = RequiredTimerDefinition(request, verb.TimerId);
        var cooldownDefinition = OptionalCooldownDefinition(request, verb.CooldownId);
        ValidateCostOwnership(verb, cooldownDefinition);

        var currentActor = request.Actor.Apply(request.EventStream.Events);
        if (TryRejectForMissingItems(request, verb, out var missingItems))
        {
            return AppendRejection(request, currentActor, verb, "missing_items", new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["missing_item_ids"] = string.Join(",", missingItems)
            });
        }

        if (TryRejectForCooldown(request, currentActor, verb, cooldownDefinition, out var cooldownFields))
        {
            return AppendRejection(request, currentActor, verb, "cooldown_unavailable", cooldownFields);
        }

        var primaryEvents = new List<SimEvent>();
        var costResult = costLedger.ApplyCosts(currentActor, new CostRequest
        {
            RequestId = $"{request.InvocationId}.cost",
            ActorId = currentActor.ActorId,
            VerbId = verb.VerbId,
            Domain = verb.Domain,
            Tick = request.Tick,
            Cause = verb.VerbId,
            ResourceCosts = verb.ResourceCosts
        });

        if (!costResult.Succeeded)
        {
            var appended = request.EventStream.AppendBatch(costResult.Events);
            return FailureResult(request, appended);
        }

        primaryEvents.AddRange(costResult.Events);
        var actorAfterVerbCost = currentActor.Apply(primaryEvents);

        if (cooldownDefinition is not null)
        {
            var cooldownResult = cooldownSystem.Start(actorAfterVerbCost, cooldownDefinition, new CooldownRequest
            {
                RequestId = $"{request.InvocationId}.cooldown",
                VerbId = verb.VerbId,
                Domain = verb.Domain,
                Tick = request.Tick
            });

            if (!cooldownResult.Succeeded)
            {
                var appended = request.EventStream.AppendBatch(cooldownResult.Events);
                return FailureResult(request, appended);
            }

            primaryEvents.AddRange(cooldownResult.Events);
        }

        var resolveTick = AddTimerEvents(primaryEvents, request, currentActor.ActorId, verb, timerDefinition);
        var actorForModifiers = currentActor.Apply(primaryEvents);
        var assembledModifiers = modifierAssembler.Assemble(
            auraSystem.AssembleModifiers(actorForModifiers, resolveTick),
            request.Modifiers);
        var outcome = outcomeResolver.Resolve(new OutcomeRequest
        {
            RequestId = request.InvocationId,
            ActorId = currentActor.ActorId,
            TargetId = request.TargetId,
            VerbId = verb.VerbId,
            Domain = verb.Domain,
            Tick = resolveTick,
            Table = verb.OutcomeTable,
            Modifiers = assembledModifiers,
            Rng = request.Rng?.Fork(verb.OutcomeTable.RollStreamId),
            ScriptedRollValue = request.ScriptedRollValue,
            ScriptedFixtureId = request.ScriptedFixtureId,
            ScriptedEntryId = request.ScriptedEntryId
        });

        primaryEvents.AddRange(outcome.Events);
        var appendedPrimary = request.EventStream.AppendBatch(primaryEvents);
        var consequenceResult = consequenceApplier.Apply(new ConsequenceApplierRequest
        {
            InvocationId = request.InvocationId,
            SourceEvents = appendedPrimary
        });
        var appendedConsequences = consequenceResult.Events.Count == 0
            ? []
            : request.EventStream.AppendBatch(consequenceResult.Events);
        var appendedCompletion = request.EventStream.AppendBatch([CompletedEvent(request, verb, outcome, appendedPrimary, appendedConsequences)]);

        var appendedEvents = appendedPrimary
            .Concat(appendedConsequences)
            .Concat(appendedCompletion)
            .ToList()
            .AsReadOnly();

        return new VerbInvocationResult(
            Succeeded: true,
            InvocationId: request.InvocationId,
            Outcome: outcome,
            AppendedEvents: appendedEvents,
            ProjectionHooks: ProjectionHooks(request));
    }

    private long AddTimerEvents(
        ICollection<SimEvent> primaryEvents,
        VerbInvocationRequest request,
        string actorId,
        VerbDef verb,
        TimerDefinition timerDefinition)
    {
        var timerStarted = timerSystem.Start(timerDefinition, new TimerRequest
        {
            RequestId = request.InvocationId,
            ActorId = actorId,
            TargetId = request.TargetId,
            VerbId = verb.VerbId,
            Domain = verb.Domain,
            StartedTick = request.Tick,
            CompletionKey = "verb_invocation.resolve",
            CompletionConsumer = "verb_invocation",
            ContextFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["invocation_id"] = request.InvocationId,
                ["presenter_key"] = verb.PresenterKey
            }
        });
        primaryEvents.Add(timerStarted);

        var timerState = TimerState.FromStartedEvent(timerStarted);
        var advanced = timerSystem.Advance(timerState, timerState.CompletesAtTick);
        foreach (var simEvent in advanced)
        {
            primaryEvents.Add(simEvent);
        }

        return advanced.LastOrDefault(simEvent => simEvent.EventType == TimerSystem.CompletedEventType)?.Tick
            ?? request.Tick;
    }

    private VerbProjectionHooks ProjectionHooks(VerbInvocationRequest request)
    {
        return new VerbProjectionHooks(
            Actor: request.Actor.Apply(request.EventStream.Events),
            DeathFrictionStates: consequenceApplier.ProjectDeathFriction(request.EventStream.Events));
    }

    private VerbInvocationResult AppendRejection(
        VerbInvocationRequest request,
        ActorState currentActor,
        VerbDef verb,
        string reason,
        SortedDictionary<string, string> fields)
    {
        fields["invocation_id"] = request.InvocationId;
        fields["presenter_key"] = verb.PresenterKey;
        fields["reason"] = reason;
        fields["verb_id"] = verb.VerbId;

        var rejected = new SimEvent
        {
            Tick = request.Tick,
            ActorId = currentActor.ActorId,
            TargetId = request.TargetId,
            VerbId = verb.VerbId,
            Domain = verb.Domain,
            SourceSystem = SourceSystemId,
            EventType = RejectedEventType,
            Fields = SimEvent.StableDictionary(fields),
            Tags = SimEvent.StableTags([.. verb.Tags, "verb_invocation", "rejected", verb.Domain.ToId()])
        };
        var appended = request.EventStream.AppendBatch([rejected]);
        return FailureResult(request, appended);
    }

    private VerbInvocationResult FailureResult(VerbInvocationRequest request, IReadOnlyList<SimEvent> appended)
    {
        return new VerbInvocationResult(
            Succeeded: false,
            InvocationId: request.InvocationId,
            Outcome: null,
            AppendedEvents: appended,
            ProjectionHooks: ProjectionHooks(request));
    }

    private static SimEvent CompletedEvent(
        VerbInvocationRequest request,
        VerbDef verb,
        ResolvedOutcome outcome,
        IReadOnlyList<SimEvent> primaryEvents,
        IReadOnlyList<SimEvent> consequenceEvents)
    {
        var outcomeEventId = primaryEvents
            .Last(simEvent => simEvent.SourceSystem == OutcomeResolver.ResolverId && simEvent.EventType == OutcomeResolver.ResolvedEventType)
            .Id;
        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["consequence_event_count"] = consequenceEvents.Count.ToString(CultureInfo.InvariantCulture),
            ["cooldown_id"] = verb.CooldownId ?? string.Empty,
            ["invocation_id"] = request.InvocationId,
            ["outcome_event_id"] = outcomeEventId,
            ["outcome_key"] = outcome.OutcomeKey,
            ["presenter_key"] = verb.PresenterKey,
            ["primary_event_count"] = primaryEvents.Count.ToString(CultureInfo.InvariantCulture),
            ["resolver_id"] = outcome.ResolverId,
            ["table_id"] = outcome.TableId,
            ["timer_id"] = verb.TimerId
        };

        return new SimEvent
        {
            Tick = primaryEvents.Max(simEvent => simEvent.Tick),
            ActorId = request.Actor.ActorId,
            TargetId = request.TargetId,
            VerbId = verb.VerbId,
            Domain = verb.Domain,
            SourceSystem = SourceSystemId,
            EventType = CompletedEventType,
            Fields = SimEvent.StableDictionary(fields),
            Tags = SimEvent.StableTags([.. verb.Tags, "verb_invocation", "completed", verb.Domain.ToId()])
        };
    }

    private static TimerDefinition RequiredTimerDefinition(VerbInvocationRequest request, string timerId)
    {
        if (!request.TimerDefinitions.TryGetValue(timerId, out var definition))
        {
            throw new InvalidOperationException($"VerbInvocation is missing timer definition '{timerId}'.");
        }

        return definition.Validate();
    }

    private static CooldownDefinition? OptionalCooldownDefinition(VerbInvocationRequest request, string? cooldownId)
    {
        if (cooldownId is null)
        {
            return null;
        }

        if (!request.CooldownDefinitions.TryGetValue(cooldownId, out var definition))
        {
            throw new InvalidOperationException($"VerbInvocation is missing cooldown definition '{cooldownId}'.");
        }

        return definition.Validate();
    }

    private static void ValidateCostOwnership(VerbDef verb, CooldownDefinition? cooldownDefinition)
    {
        var verbSpends = verb.ResourceCosts.Any(pair => pair.Value > 0);
        var cooldownSpends = cooldownDefinition?.ResourceCosts.Any(pair => pair.Value > 0) == true;
        if (verbSpends && cooldownSpends)
        {
            throw new InvalidOperationException("VerbInvocation cost rows must live on either VerbDef or CooldownDefinition for one invocation, not both.");
        }
    }

    private static bool TryRejectForMissingItems(
        VerbInvocationRequest request,
        VerbDef verb,
        out IReadOnlyList<string> missingItems)
    {
        var available = request.AvailableItemIds.ToHashSet(StringComparer.Ordinal);
        missingItems = verb.RequiredItemIds
            .Where(itemId => !available.Contains(itemId))
            .Order(StringComparer.Ordinal)
            .ToList()
            .AsReadOnly();
        return missingItems.Count > 0;
    }

    private static bool TryRejectForCooldown(
        VerbInvocationRequest request,
        ActorState actor,
        VerbDef verb,
        CooldownDefinition? cooldownDefinition,
        out SortedDictionary<string, string> fields)
    {
        fields = new SortedDictionary<string, string>(StringComparer.Ordinal);
        if (cooldownDefinition is null)
        {
            return false;
        }

        if (!actor.Cooldowns.TryGetValue(cooldownDefinition.CooldownId, out var active) || active.IsReadyAt(request.Tick))
        {
            return false;
        }

        fields["cooldown_id"] = cooldownDefinition.CooldownId;
        fields["ready_tick"] = active.ReadyTick.ToString(CultureInfo.InvariantCulture);
        fields["remaining_ticks"] = Math.Max(0, active.ReadyTick - request.Tick).ToString(CultureInfo.InvariantCulture);
        fields["verb_cooldown_id"] = verb.CooldownId ?? string.Empty;
        return true;
    }
}

public sealed record VerbInvocationRequest
{
    public string InvocationId { get; init; } = string.Empty;

    public ActorState Actor { get; init; } = null!;

    public string? TargetId { get; init; }

    public VerbDef Verb { get; init; } = new();

    public SimEventStream EventStream { get; init; } = new();

    public long Tick { get; init; }

    public IReadOnlyDictionary<string, TimerDefinition> TimerDefinitions { get; init; } =
        new SortedDictionary<string, TimerDefinition>(StringComparer.Ordinal);

    public IReadOnlyDictionary<string, CooldownDefinition> CooldownDefinitions { get; init; } =
        new SortedDictionary<string, CooldownDefinition>(StringComparer.Ordinal);

    public IReadOnlyList<OutcomeModifier> Modifiers { get; init; } = [];

    public IReadOnlyList<string> AvailableItemIds { get; init; } = [];

    public SeededRng? Rng { get; init; }

    public int? ScriptedRollValue { get; init; }

    public string? ScriptedFixtureId { get; init; }

    public string? ScriptedEntryId { get; init; }

    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(InvocationId))
        {
            throw new InvalidOperationException("VerbInvocationRequest.InvocationId must be non-blank.");
        }

        ArgumentNullException.ThrowIfNull(Actor);
        ArgumentNullException.ThrowIfNull(Verb);
        ArgumentNullException.ThrowIfNull(EventStream);
        ArgumentNullException.ThrowIfNull(TimerDefinitions);
        ArgumentNullException.ThrowIfNull(CooldownDefinitions);
        ArgumentNullException.ThrowIfNull(Modifiers);
        ArgumentNullException.ThrowIfNull(AvailableItemIds);

        if (Tick < 0)
        {
            throw new InvalidOperationException("VerbInvocationRequest.Tick must be non-negative.");
        }
    }
}

public sealed record VerbProjectionHooks(
    ActorState Actor,
    IReadOnlyDictionary<string, DeathFrictionState> DeathFrictionStates);

public sealed record VerbInvocationResult(
    bool Succeeded,
    string InvocationId,
    ResolvedOutcome? Outcome,
    IReadOnlyList<SimEvent> AppendedEvents,
    VerbProjectionHooks ProjectionHooks);
