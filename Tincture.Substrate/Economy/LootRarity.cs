namespace Tincture.Substrate.Economy;

public enum LootRarity
{
    Common,
    Uncommon,
    Rare,
    Unique
}

public static class LootRarityExtensions
{
    public static string ToId(this LootRarity rarity) => rarity switch
    {
        LootRarity.Common => "common",
        LootRarity.Uncommon => "uncommon",
        LootRarity.Rare => "rare",
        LootRarity.Unique => "unique",
        _ => throw new ArgumentOutOfRangeException(nameof(rarity), rarity, "Unknown loot rarity.")
    };

    public static LootRarity FromId(string id) => id switch
    {
        "common" => LootRarity.Common,
        "uncommon" => LootRarity.Uncommon,
        "rare" => LootRarity.Rare,
        "unique" => LootRarity.Unique,
        _ => throw new ArgumentOutOfRangeException(nameof(id), id, "Unknown loot rarity id.")
    };
}
