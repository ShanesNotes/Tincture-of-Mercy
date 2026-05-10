using Tincture.Substrate.Events;

namespace Tincture.Substrate.Sim.Timers;

public sealed record TimerDefinition
{
    public string TimerId { get; init; } = string.Empty;

    public TimerKind Kind { get; init; }

    public long DurationTicks { get; init; }

    public long TickIntervalTicks { get; init; } = 1;

    public SortedDictionary<string, string> CompletionFields { get; init; } = new(StringComparer.Ordinal);

    public List<string> Tags { get; init; } = [];

    public TimerDefinition Validate()
    {
        if (string.IsNullOrWhiteSpace(TimerId))
        {
            throw new InvalidOperationException("TimerDefinition.TimerId must be non-blank.");
        }

        _ = Kind.ToId();

        if (DurationTicks <= 0)
        {
            throw new InvalidOperationException("TimerDefinition.DurationTicks must be positive.");
        }

        if (TickIntervalTicks <= 0)
        {
            throw new InvalidOperationException("TimerDefinition.TickIntervalTicks must be positive.");
        }

        if (TickIntervalTicks > DurationTicks)
        {
            throw new InvalidOperationException("TimerDefinition.TickIntervalTicks cannot exceed DurationTicks.");
        }

        return this with
        {
            CompletionFields = SimEvent.StableDictionary(CompletionFields),
            Tags = SimEvent.StableTags(Tags)
        };
    }

    public static IReadOnlyDictionary<string, TimerDefinition> EpicBDefaults()
    {
        var definitions = new[]
        {
            new TimerDefinition
            {
                TimerId = "timer.gcd.default",
                Kind = TimerKind.GlobalCooldown,
                DurationTicks = 30,
                TickIntervalTicks = 30,
                Tags = ["gcd"]
            },
            new TimerDefinition
            {
                TimerId = "timer.work.default",
                Kind = TimerKind.Work,
                DurationTicks = 120,
                TickIntervalTicks = 30,
                Tags = ["work"]
            },
            new TimerDefinition
            {
                TimerId = "timer.cast.default",
                Kind = TimerKind.Cast,
                DurationTicks = 60,
                TickIntervalTicks = 15,
                Tags = ["cast"]
            },
            new TimerDefinition
            {
                TimerId = "timer.channel.default",
                Kind = TimerKind.Channel,
                DurationTicks = 90,
                TickIntervalTicks = 30,
                Tags = ["channel"]
            },
            new TimerDefinition
            {
                TimerId = "timer.swing.default",
                Kind = TimerKind.Swing,
                DurationTicks = 45,
                TickIntervalTicks = 15,
                Tags = ["swing"]
            },
            new TimerDefinition
            {
                TimerId = "timer.rite_pulse.default",
                Kind = TimerKind.RitePulse,
                DurationTicks = 180,
                TickIntervalTicks = 60,
                Tags = ["rite_pulse"]
            }
        };

        return definitions
            .Select(definition => definition.Validate())
            .ToDictionary(definition => definition.TimerId, StringComparer.Ordinal);
    }
}
