using System.Globalization;
using Tincture.Substrate.Events;

namespace Tincture.Substrate.Sim.Timers;

public sealed record TimerState
{
    public string TimerRequestId { get; init; } = string.Empty;

    public string TimerId { get; init; } = string.Empty;

    public TimerKind Kind { get; init; }

    public string ActorId { get; init; } = string.Empty;

    public string? TargetId { get; init; }

    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public long StartedTick { get; init; }

    public long CompletesAtTick { get; init; }

    public long DurationTicks { get; init; }

    public long TickIntervalTicks { get; init; }

    public string CompletionKey { get; init; } = string.Empty;

    public string CompletionConsumer { get; init; } = string.Empty;

    public SortedDictionary<string, string> PersistentFields { get; init; } = new(StringComparer.Ordinal);

    public long? LastTickAt { get; init; }

    public long? CompletedAtTick { get; init; }

    public long? InterruptedAtTick { get; init; }

    public string? InterruptReason { get; init; }

    public bool IsComplete => CompletedAtTick is not null;

    public bool IsInterrupted => InterruptedAtTick is not null;

    public bool IsActive => !IsComplete && !IsInterrupted;

    public bool IsDueAt(long tick) => IsActive && tick >= CompletesAtTick;

    public static TimerState FromStartedEvent(SimEvent simEvent)
    {
        if (!string.Equals(simEvent.SourceSystem, TimerSystem.SourceSystemId, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("TimerState can only project timer system events.");
        }

        if (!string.Equals(simEvent.EventType, TimerSystem.StartedEventType, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("TimerState requires a timer_started event.");
        }

        return new TimerState
        {
            TimerRequestId = Required(simEvent.Fields, "timer_request_id"),
            TimerId = Required(simEvent.Fields, "timer_id"),
            Kind = TimerKindExtensions.FromId(Required(simEvent.Fields, "timer_kind")),
            ActorId = simEvent.ActorId,
            TargetId = simEvent.TargetId,
            VerbId = simEvent.VerbId,
            Domain = simEvent.Domain,
            StartedTick = long.Parse(Required(simEvent.Fields, "started_tick"), CultureInfo.InvariantCulture),
            CompletesAtTick = long.Parse(Required(simEvent.Fields, "completes_at_tick"), CultureInfo.InvariantCulture),
            DurationTicks = long.Parse(Required(simEvent.Fields, "duration_ticks"), CultureInfo.InvariantCulture),
            TickIntervalTicks = long.Parse(Required(simEvent.Fields, "tick_interval_ticks"), CultureInfo.InvariantCulture),
            CompletionKey = Required(simEvent.Fields, "completion_key"),
            CompletionConsumer = Required(simEvent.Fields, "completion_consumer"),
            PersistentFields = SimEvent.StableDictionary(simEvent.Fields.Where(pair => !ReservedFieldKeys.Contains(pair.Key)))
        };
    }

    public TimerState Apply(SimEvent simEvent)
    {
        if (!string.Equals(simEvent.SourceSystem, TimerSystem.SourceSystemId, StringComparison.Ordinal))
        {
            return this;
        }

        if (!string.Equals(Required(simEvent.Fields, "timer_request_id"), TimerRequestId, StringComparison.Ordinal))
        {
            return this;
        }

        return simEvent.EventType switch
        {
            TimerSystem.TickEventType => this with
            {
                LastTickAt = long.Parse(Required(simEvent.Fields, "tick_at"), CultureInfo.InvariantCulture)
            },
            TimerSystem.CompletedEventType => this with
            {
                CompletedAtTick = long.Parse(Required(simEvent.Fields, "completed_tick"), CultureInfo.InvariantCulture)
            },
            TimerSystem.InterruptedEventType => this with
            {
                InterruptedAtTick = long.Parse(Required(simEvent.Fields, "interrupted_tick"), CultureInfo.InvariantCulture),
                InterruptReason = Required(simEvent.Fields, "interrupt_reason")
            },
            _ => this
        };
    }

    private static string Required(IReadOnlyDictionary<string, string> fields, string key)
    {
        return fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : throw new InvalidOperationException($"Timer event is missing {key}.");
    }

    private static readonly HashSet<string> ReservedFieldKeys = new(StringComparer.Ordinal)
    {
        "completed_tick",
        "completion_consumer",
        "completion_key",
        "completes_at_tick",
        "duration_ticks",
        "elapsed_ticks",
        "interrupt_id",
        "interrupt_reason",
        "interrupted_tick",
        "remaining_ticks",
        "started_tick",
        "tick_at",
        "tick_interval_ticks",
        "timer_id",
        "timer_kind",
        "timer_request_id"
    };
}
