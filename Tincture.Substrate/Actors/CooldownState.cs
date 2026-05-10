using System.Globalization;
using Tincture.Substrate.Events;

namespace Tincture.Substrate.Actors;

public sealed record CooldownState
{
    public string CooldownId { get; init; } = string.Empty;

    public long StartedTick { get; init; }

    public long ReadyTick { get; init; }

    public bool ReadyEmitted { get; init; }

    public bool IsReadyAt(long tick) => tick >= ReadyTick;

    public static CooldownState FromStartedEvent(SimEvent simEvent)
    {
        return new CooldownState
        {
            CooldownId = Required(simEvent.Fields, "cooldown_id"),
            StartedTick = long.Parse(Required(simEvent.Fields, "started_tick"), CultureInfo.InvariantCulture),
            ReadyTick = long.Parse(Required(simEvent.Fields, "ready_tick"), CultureInfo.InvariantCulture),
            ReadyEmitted = false
        };
    }

    private static string Required(IReadOnlyDictionary<string, string> fields, string key)
    {
        return fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : throw new InvalidOperationException($"Cooldown event is missing {key}.");
    }
}
