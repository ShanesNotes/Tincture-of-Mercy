namespace Tincture.Substrate.Actors;

public sealed record ResourceProfile
{
    public ResourceKey Key { get; init; }

    public int Min { get; init; }

    public int Max { get; init; }

    public int StartingValue { get; init; }

    public ResourceProfile Validate()
    {
        if (Min > Max)
        {
            throw new InvalidOperationException($"ResourceProfile {Key} min cannot exceed max.");
        }

        if (StartingValue < Min || StartingValue > Max)
        {
            throw new InvalidOperationException($"ResourceProfile {Key} starting value must be inside min/max.");
        }

        return this;
    }

    public int Clamp(int value) => Math.Clamp(value, Min, Max);

    public static IReadOnlyDictionary<ResourceKey, ResourceProfile> OpeningDefaults()
    {
        return new[]
        {
            new ResourceProfile { Key = ResourceKey.Health, Min = 0, Max = 100, StartingValue = 20 },
            new ResourceProfile { Key = ResourceKey.Spirit, Min = 0, Max = 100, StartingValue = 20 },
            new ResourceProfile { Key = ResourceKey.Steady, Min = 0, Max = 100, StartingValue = 20 },
            new ResourceProfile { Key = ResourceKey.Burden, Min = 0, Max = 100, StartingValue = 0 },
            new ResourceProfile { Key = ResourceKey.Pressure, Min = 0, Max = 100, StartingValue = 0 },
            new ResourceProfile { Key = ResourceKey.Numbness, Min = 0, Max = 100, StartingValue = 0 }
        }.ToDictionary(profile => profile.Key, profile => profile.Validate());
    }
}
