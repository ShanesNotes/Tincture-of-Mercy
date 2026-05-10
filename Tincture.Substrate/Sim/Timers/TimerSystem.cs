using System.Collections.ObjectModel;
using System.Globalization;
using Tincture.Substrate.Events;

namespace Tincture.Substrate.Sim.Timers;

// ADR 0013: timers and cooldowns are sibling event systems; cooldown_ready stays owned by CooldownSystem.
public sealed class TimerSystem
{
    public const string SourceSystemId = "timer_system.v1";
    public const string StartedEventType = "timer_started";
    public const string TickEventType = "timer_tick";
    public const string CompletedEventType = "timer_completed";
    public const string InterruptedEventType = "timer_interrupted";

    public SimEvent Start(TimerDefinition definition, TimerRequest request)
    {
        definition = definition.Validate();
        request = request.Validate();

        var completesAtTick = request.StartedTick + definition.DurationTicks;
        var fields = BaseFields(definition, request, completesAtTick);

        return new SimEvent
        {
            Tick = request.StartedTick,
            ActorId = request.ActorId,
            TargetId = request.TargetId,
            VerbId = request.VerbId,
            Domain = request.Domain,
            SourceSystem = SourceSystemId,
            EventType = StartedEventType,
            Fields = SimEvent.StableDictionary(fields),
            Tags = Tags(definition, request.Domain, "started")
        };
    }

    public IReadOnlyList<SimEvent> Advance(TimerState timer, long tick)
    {
        if (tick < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(tick), "Timer advance tick must be non-negative.");
        }

        if (!timer.IsActive || tick <= timer.StartedTick)
        {
            return [];
        }

        var events = new List<SimEvent>();
        var nextTick = (timer.LastTickAt ?? timer.StartedTick) + timer.TickIntervalTicks;
        while (nextTick <= tick && nextTick < timer.CompletesAtTick)
        {
            events.Add(TickEvent(timer, nextTick));
            nextTick += timer.TickIntervalTicks;
        }

        if (tick >= timer.CompletesAtTick)
        {
            events.Add(CompletedEvent(timer));
        }

        return events.AsReadOnly();
    }

    public IReadOnlyList<SimEvent> Advance(IEnumerable<TimerState> timers, long tick)
    {
        ArgumentNullException.ThrowIfNull(timers);

        return timers
            .SelectMany(timer => Advance(timer, tick))
            .OrderBy(simEvent => simEvent.Tick)
            .ThenBy(simEvent => Required(simEvent.Fields, "timer_request_id"), StringComparer.Ordinal)
            .ThenBy(simEvent => simEvent.EventType, StringComparer.Ordinal)
            .ToList()
            .AsReadOnly();
    }

    public SimEvent Interrupt(TimerState timer, TimerInterruptRequest request)
    {
        request.Validate();

        if (!timer.IsActive)
        {
            throw new InvalidOperationException("Only an active timer can be interrupted.");
        }

        if (request.Tick < timer.StartedTick)
        {
            throw new InvalidOperationException("Timer interruption cannot happen before the timer starts.");
        }

        if (request.Tick >= timer.CompletesAtTick)
        {
            throw new InvalidOperationException("Timer interruption cannot replace a due completion event.");
        }

        var fields = StateFields(timer);
        fields["elapsed_ticks"] = (request.Tick - timer.StartedTick).ToString(CultureInfo.InvariantCulture);
        fields["interrupt_id"] = request.InterruptId;
        fields["interrupt_reason"] = request.Reason;
        fields["interrupted_tick"] = request.Tick.ToString(CultureInfo.InvariantCulture);
        fields["remaining_ticks"] = Math.Max(0, timer.CompletesAtTick - request.Tick).ToString(CultureInfo.InvariantCulture);

        return new SimEvent
        {
            Tick = request.Tick,
            ActorId = timer.ActorId,
            TargetId = timer.TargetId,
            VerbId = timer.VerbId,
            Domain = timer.Domain,
            SourceSystem = SourceSystemId,
            EventType = InterruptedEventType,
            Fields = SimEvent.StableDictionary(fields),
            Tags = SimEvent.StableTags(["timer", "interrupted", timer.Domain.ToId(), timer.Kind.ToId()])
        };
    }

    public IReadOnlyDictionary<string, TimerState> Project(IEnumerable<SimEvent> events)
    {
        ArgumentNullException.ThrowIfNull(events);

        var timers = new SortedDictionary<string, TimerState>(StringComparer.Ordinal);
        foreach (var simEvent in events.OrderBy(simEvent => simEvent.Sequence))
        {
            if (!string.Equals(simEvent.SourceSystem, SourceSystemId, StringComparison.Ordinal))
            {
                continue;
            }

            if (string.Equals(simEvent.EventType, StartedEventType, StringComparison.Ordinal))
            {
                var timer = TimerState.FromStartedEvent(simEvent);
                timers[timer.TimerRequestId] = timer;
                continue;
            }

            var requestId = Required(simEvent.Fields, "timer_request_id");
            if (timers.TryGetValue(requestId, out var existing))
            {
                timers[requestId] = existing.Apply(simEvent);
            }
        }

        return new ReadOnlyDictionary<string, TimerState>(timers);
    }

    private static SimEvent TickEvent(TimerState timer, long tick)
    {
        var fields = StateFields(timer);
        fields["elapsed_ticks"] = (tick - timer.StartedTick).ToString(CultureInfo.InvariantCulture);
        fields["remaining_ticks"] = Math.Max(0, timer.CompletesAtTick - tick).ToString(CultureInfo.InvariantCulture);
        fields["tick_at"] = tick.ToString(CultureInfo.InvariantCulture);

        return new SimEvent
        {
            Tick = tick,
            ActorId = timer.ActorId,
            TargetId = timer.TargetId,
            VerbId = timer.VerbId,
            Domain = timer.Domain,
            SourceSystem = SourceSystemId,
            EventType = TickEventType,
            Fields = SimEvent.StableDictionary(fields),
            Tags = SimEvent.StableTags(["timer", "tick", timer.Domain.ToId(), timer.Kind.ToId()])
        };
    }

    private static SimEvent CompletedEvent(TimerState timer)
    {
        var fields = StateFields(timer);
        fields["completed_tick"] = timer.CompletesAtTick.ToString(CultureInfo.InvariantCulture);
        fields["elapsed_ticks"] = timer.DurationTicks.ToString(CultureInfo.InvariantCulture);
        fields["remaining_ticks"] = "0";

        return new SimEvent
        {
            Tick = timer.CompletesAtTick,
            ActorId = timer.ActorId,
            TargetId = timer.TargetId,
            VerbId = timer.VerbId,
            Domain = timer.Domain,
            SourceSystem = SourceSystemId,
            EventType = CompletedEventType,
            Fields = SimEvent.StableDictionary(fields),
            Tags = SimEvent.StableTags(["timer", "completed", timer.Domain.ToId(), timer.Kind.ToId(), timer.CompletionConsumer])
        };
    }

    private static SortedDictionary<string, string> BaseFields(TimerDefinition definition, TimerRequest request, long completesAtTick)
    {
        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["completion_consumer"] = request.CompletionConsumer,
            ["completion_key"] = request.CompletionKey,
            ["completes_at_tick"] = completesAtTick.ToString(CultureInfo.InvariantCulture),
            ["duration_ticks"] = definition.DurationTicks.ToString(CultureInfo.InvariantCulture),
            ["started_tick"] = request.StartedTick.ToString(CultureInfo.InvariantCulture),
            ["tick_interval_ticks"] = definition.TickIntervalTicks.ToString(CultureInfo.InvariantCulture),
            ["timer_id"] = definition.TimerId,
            ["timer_kind"] = definition.Kind.ToId(),
            ["timer_request_id"] = request.RequestId
        };

        AddUserFields(fields, request.ContextFields);
        AddUserFields(fields, definition.CompletionFields);

        if (request.SourceEventId is not null)
        {
            fields["source_event_id"] = request.SourceEventId;
        }

        return fields;
    }

    private static SortedDictionary<string, string> StateFields(TimerState timer)
    {
        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["completion_consumer"] = timer.CompletionConsumer,
            ["completion_key"] = timer.CompletionKey,
            ["completes_at_tick"] = timer.CompletesAtTick.ToString(CultureInfo.InvariantCulture),
            ["duration_ticks"] = timer.DurationTicks.ToString(CultureInfo.InvariantCulture),
            ["started_tick"] = timer.StartedTick.ToString(CultureInfo.InvariantCulture),
            ["tick_interval_ticks"] = timer.TickIntervalTicks.ToString(CultureInfo.InvariantCulture),
            ["timer_id"] = timer.TimerId,
            ["timer_kind"] = timer.Kind.ToId(),
            ["timer_request_id"] = timer.TimerRequestId
        };

        AddUserFields(fields, timer.PersistentFields);
        return fields;
    }

    private static List<string> Tags(TimerDefinition definition, SimDomain domain, string lifecycleTag)
    {
        return SimEvent.StableTags(definition.Tags.Concat(["timer", lifecycleTag, domain.ToId(), definition.Kind.ToId()]));
    }

    private static void AddUserFields(SortedDictionary<string, string> fields, IReadOnlyDictionary<string, string> userFields)
    {
        foreach (var (key, value) in userFields)
        {
            if (fields.ContainsKey(key))
            {
                throw new InvalidOperationException($"Timer metadata field '{key}' is reserved.");
            }

            fields[key] = value;
        }
    }

    private static string Required(IReadOnlyDictionary<string, string> fields, string key)
    {
        return fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : throw new InvalidOperationException($"Timer event is missing {key}.");
    }
}
