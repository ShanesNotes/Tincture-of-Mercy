using System.Globalization;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;

namespace Tincture.Substrate.Actors;

public sealed record ActiveAura
{
    public string AuraId { get; init; } = string.Empty;

    public string SourceEventId { get; init; } = string.Empty;

    public long StartedTick { get; init; }

    public long ExpiresAtTick { get; init; }

    public int StackCount { get; init; }

    public int MaxStacks { get; init; }

    public string ModifierId { get; init; } = string.Empty;

    public OutcomeModifierKind ModifierKind { get; init; } = OutcomeModifierKind.Aura;

    public int ModifierAmount { get; init; }

    public DerivedStatKey? DerivedStatKey { get; init; }

    public int DerivedStatDelta { get; init; }

    public bool IsExpiredAt(long tick) => tick >= ExpiresAtTick;

    public OutcomeModifier ToOutcomeModifier()
    {
        var metadata = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["aura_id"] = AuraId,
            ["expires_tick"] = ExpiresAtTick.ToString(CultureInfo.InvariantCulture),
            ["stack_count"] = StackCount.ToString(CultureInfo.InvariantCulture)
        };

        if (DerivedStatKey is { } key)
        {
            metadata["derived_stat_key"] = key.ToId();
            metadata["derived_stat_delta"] = DerivedStatDelta.ToString(CultureInfo.InvariantCulture);
        }

        return new OutcomeModifier
        {
            ModifierId = ModifierId,
            SourceId = AuraSystem.SourceSystemId,
            SourceEventId = SourceEventId,
            Kind = ModifierKind,
            Amount = ModifierAmount * StackCount,
            Metadata = metadata
        }.Normalize();
    }

    public static ActiveAura FromEvent(SimEvent simEvent)
    {
        var fields = simEvent.Fields;
        var derivedStatKey = fields.TryGetValue("derived_stat_key", out var statKey) && !string.IsNullOrWhiteSpace(statKey)
            ? DerivedStatKeyExtensions.FromId(statKey)
            : (DerivedStatKey?)null;

        return new ActiveAura
        {
            AuraId = Required(fields, "aura_id"),
            SourceEventId = simEvent.Id,
            StartedTick = long.Parse(Required(fields, "started_tick"), CultureInfo.InvariantCulture),
            ExpiresAtTick = long.Parse(Required(fields, "expires_tick"), CultureInfo.InvariantCulture),
            StackCount = int.Parse(Required(fields, "stack_count"), CultureInfo.InvariantCulture),
            MaxStacks = int.Parse(Required(fields, "max_stacks"), CultureInfo.InvariantCulture),
            ModifierId = Required(fields, "modifier_id"),
            ModifierKind = Enum.Parse<OutcomeModifierKind>(Required(fields, "modifier_kind")),
            ModifierAmount = int.Parse(Required(fields, "modifier_amount"), CultureInfo.InvariantCulture),
            DerivedStatKey = derivedStatKey,
            DerivedStatDelta = fields.TryGetValue("derived_stat_delta", out var delta)
                ? int.Parse(delta, CultureInfo.InvariantCulture)
                : 0
        };
    }

    private static string Required(IReadOnlyDictionary<string, string> fields, string key)
    {
        return fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : throw new InvalidOperationException($"Aura event is missing {key}.");
    }
}
