namespace Tincture.Substrate.Economy;

public enum LootQuality
{
    Poor,
    Standard,
    Fine,
    Pristine
}

public static class LootQualityExtensions
{
    public static string ToId(this LootQuality quality) => quality switch
    {
        LootQuality.Poor => "poor",
        LootQuality.Standard => "standard",
        LootQuality.Fine => "fine",
        LootQuality.Pristine => "pristine",
        _ => throw new ArgumentOutOfRangeException(nameof(quality), quality, "Unknown loot quality.")
    };

    public static LootQuality FromId(string id) => id switch
    {
        "poor" => LootQuality.Poor,
        "standard" => LootQuality.Standard,
        "fine" => LootQuality.Fine,
        "pristine" => LootQuality.Pristine,
        _ => throw new ArgumentOutOfRangeException(nameof(id), id, "Unknown loot quality id.")
    };
}
