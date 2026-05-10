namespace Tincture.Substrate.Actors;

public sealed record DerivedStats
{
    public int MaxHealth { get; init; }

    public int MaxSpirit { get; init; }

    public int MaxSteady { get; init; }

    public int ActionStability { get; init; }

    public int BurdenLimit { get; init; }

    public int PressureLimit { get; init; }

    public static DerivedStats From(StatBlock baseStats, IEnumerable<ActiveAura> activeAuras)
    {
        var stats = new DerivedStats
        {
            MaxHealth = 20 + (baseStats.Body * 5),
            MaxSpirit = 20 + (baseStats.Spirit * 5),
            MaxSteady = 20 + (baseStats.Nerve * 4) + (baseStats.Care * 2),
            ActionStability = baseStats.Nerve + baseStats.Attention + baseStats.Care,
            BurdenLimit = 10 + baseStats.Spirit + baseStats.Care,
            PressureLimit = 10 + baseStats.Nerve + baseStats.Attention
        };

        foreach (var aura in activeAuras.OrderBy(aura => aura.SourceEventId, StringComparer.Ordinal))
        {
            if (aura.DerivedStatKey is { } key)
            {
                stats = stats.Adjust(key, aura.DerivedStatDelta * aura.StackCount);
            }
        }

        return stats;
    }

    private DerivedStats Adjust(DerivedStatKey key, int delta)
    {
        return key switch
        {
            DerivedStatKey.MaxHealth => this with { MaxHealth = MaxHealth + delta },
            DerivedStatKey.MaxSpirit => this with { MaxSpirit = MaxSpirit + delta },
            DerivedStatKey.MaxSteady => this with { MaxSteady = MaxSteady + delta },
            DerivedStatKey.ActionStability => this with { ActionStability = ActionStability + delta },
            DerivedStatKey.BurdenLimit => this with { BurdenLimit = BurdenLimit + delta },
            DerivedStatKey.PressureLimit => this with { PressureLimit = PressureLimit + delta },
            _ => throw new ArgumentOutOfRangeException(nameof(key), key, "Unsupported derived stat key.")
        };
    }
}
