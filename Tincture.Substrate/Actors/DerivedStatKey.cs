namespace Tincture.Substrate.Actors;

public enum DerivedStatKey
{
    MaxHealth,
    MaxSpirit,
    MaxSteady,
    ActionStability,
    BurdenLimit,
    PressureLimit
}

public static class DerivedStatKeyExtensions
{
    public static string ToId(this DerivedStatKey key)
    {
        return key switch
        {
            DerivedStatKey.MaxHealth => "max_health",
            DerivedStatKey.MaxSpirit => "max_spirit",
            DerivedStatKey.MaxSteady => "max_steady",
            DerivedStatKey.ActionStability => "action_stability",
            DerivedStatKey.BurdenLimit => "burden_limit",
            DerivedStatKey.PressureLimit => "pressure_limit",
            _ => throw new ArgumentOutOfRangeException(nameof(key), key, "Unsupported derived stat key.")
        };
    }

    public static DerivedStatKey FromId(string id)
    {
        return id switch
        {
            "max_health" => DerivedStatKey.MaxHealth,
            "max_spirit" => DerivedStatKey.MaxSpirit,
            "max_steady" => DerivedStatKey.MaxSteady,
            "action_stability" => DerivedStatKey.ActionStability,
            "burden_limit" => DerivedStatKey.BurdenLimit,
            "pressure_limit" => DerivedStatKey.PressureLimit,
            _ => throw new ArgumentOutOfRangeException(nameof(id), id, "Unsupported derived stat id.")
        };
    }
}
