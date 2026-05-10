using System.Globalization;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;

namespace Tincture.Substrate.Actors;

public sealed class CooldownSystem
{
    public const string SourceSystemId = "cooldown_state.v1";
    public const string ReadyEventType = "cooldown_ready";
    public const string StartedEventType = "cooldown_started";
    public const string UnavailableEventType = "cooldown_unavailable";

    private readonly CostLedger costLedger;

    public CooldownSystem(CostLedger? costLedger = null)
    {
        this.costLedger = costLedger ?? new CostLedger();
    }

    public CooldownResult Start(ActorState actor, CooldownDefinition definition, CooldownRequest request)
    {
        definition = definition.Validate();
        request.Validate(actor.ActorId);

        if (actor.Cooldowns.TryGetValue(definition.CooldownId, out var active) && !active.IsReadyAt(request.Tick))
        {
            return new CooldownResult(false, [UnavailableEvent(actor.ActorId, definition.CooldownId, active.ReadyTick, request)]);
        }

        var costResult = costLedger.ApplyCosts(actor, new CostRequest
        {
            RequestId = request.RequestId,
            ActorId = actor.ActorId,
            VerbId = request.VerbId,
            Domain = request.Domain,
            Tick = request.Tick,
            Cause = definition.CooldownId,
            ResourceCosts = definition.ResourceCosts
        });

        if (!costResult.Succeeded)
        {
            return new CooldownResult(false, costResult.Events);
        }

        var events = costResult.Events.ToList();
        events.Add(StartEvent(actor.ActorId, definition, request));
        return new CooldownResult(true, events.AsReadOnly());
    }

    public IReadOnlyList<SimEvent> ReadyEvents(ActorState actor, long tick, string verbId = "cooldown.ready")
    {
        return actor.Cooldowns.Values
            .Where(cooldown => cooldown.IsReadyAt(tick) && !cooldown.ReadyEmitted)
            .OrderBy(cooldown => cooldown.CooldownId, StringComparer.Ordinal)
            .Select(cooldown => new SimEvent
            {
                Tick = tick,
                ActorId = actor.ActorId,
                VerbId = verbId,
                Domain = cooldown.Domain,
                SourceSystem = SourceSystemId,
                EventType = ReadyEventType,
                Fields = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    ["cooldown_id"] = cooldown.CooldownId,
                    ["ready_tick"] = cooldown.ReadyTick.ToString(CultureInfo.InvariantCulture)
                }),
                Tags = SimEvent.StableTags(["cooldown", "ready", cooldown.Domain.ToId()])
            })
            .ToList()
            .AsReadOnly();
    }

    private static SimEvent StartEvent(string actorId, CooldownDefinition definition, CooldownRequest request)
    {
        var readyTick = request.Tick + definition.DurationTicks;
        var fields = new SortedDictionary<string, string>(definition.ConsequenceFields, StringComparer.Ordinal)
        {
            ["cooldown_id"] = definition.CooldownId,
            ["duration_ticks"] = definition.DurationTicks.ToString(CultureInfo.InvariantCulture),
            ["ready_tick"] = readyTick.ToString(CultureInfo.InvariantCulture),
            ["started_tick"] = request.Tick.ToString(CultureInfo.InvariantCulture)
        };

        var costs = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var (key, amount) in definition.ResourceCosts)
        {
            costs[key.ToId()] = amount.ToString(CultureInfo.InvariantCulture);
        }

        return new SimEvent
        {
            Tick = request.Tick,
            ActorId = actorId,
            VerbId = request.VerbId,
            Domain = request.Domain,
            SourceSystem = SourceSystemId,
            EventType = StartedEventType,
            Fields = SimEvent.StableDictionary(fields),
            Costs = SimEvent.StableDictionary(costs),
            Tags = SimEvent.StableTags(definition.Tags.Concat(["cooldown", "started"]))
        };
    }

    private static SimEvent UnavailableEvent(string actorId, string cooldownId, long readyTick, CooldownRequest request)
    {
        return new SimEvent
        {
            Tick = request.Tick,
            ActorId = actorId,
            VerbId = request.VerbId,
            Domain = request.Domain,
            SourceSystem = SourceSystemId,
            EventType = UnavailableEventType,
            Fields = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["cooldown_id"] = cooldownId,
                ["ready_tick"] = readyTick.ToString(CultureInfo.InvariantCulture),
                ["remaining_ticks"] = Math.Max(0, readyTick - request.Tick).ToString(CultureInfo.InvariantCulture)
            }),
            Tags = SimEvent.StableTags(["cooldown", "unavailable"])
        };
    }
}

public sealed record CooldownRequest
{
    public string RequestId { get; init; } = string.Empty;

    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public long Tick { get; init; }

    public void Validate(string actorId)
    {
        if (string.IsNullOrWhiteSpace(actorId))
        {
            throw new ArgumentException("Actor id must be non-blank.", nameof(actorId));
        }

        if (string.IsNullOrWhiteSpace(RequestId))
        {
            throw new InvalidOperationException("CooldownRequest.RequestId must be non-blank.");
        }

        if (string.IsNullOrWhiteSpace(VerbId))
        {
            throw new InvalidOperationException("CooldownRequest.VerbId must be non-blank.");
        }

        if (Tick < 0)
        {
            throw new InvalidOperationException("CooldownRequest.Tick must be non-negative.");
        }
    }
}

public sealed record CooldownResult(bool Succeeded, IReadOnlyList<SimEvent> Events);
