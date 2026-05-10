namespace Tincture.Substrate.Actors;

public enum ResourceKey
{
    Health,
    Spirit,
    Steady,
    Burden,
    Pressure,
    Numbness
}

public static class ResourceKeyExtensions
{
    public static string ToId(this ResourceKey key)
    {
        return key switch
        {
            ResourceKey.Health => "health",
            ResourceKey.Spirit => "spirit",
            ResourceKey.Steady => "steady",
            ResourceKey.Burden => "burden",
            ResourceKey.Pressure => "pressure",
            ResourceKey.Numbness => "numbness",
            _ => throw new ArgumentOutOfRangeException(nameof(key), key, "Unsupported resource key.")
        };
    }

    public static ResourceKey FromId(string id)
    {
        return id switch
        {
            "health" => ResourceKey.Health,
            "spirit" => ResourceKey.Spirit,
            "steady" => ResourceKey.Steady,
            "burden" => ResourceKey.Burden,
            "pressure" => ResourceKey.Pressure,
            "numbness" => ResourceKey.Numbness,
            _ => throw new ArgumentOutOfRangeException(nameof(id), id, "Unsupported resource id.")
        };
    }
}
