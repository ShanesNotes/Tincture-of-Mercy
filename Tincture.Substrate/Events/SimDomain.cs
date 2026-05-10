namespace Tincture.Substrate.Events;

public enum SimDomain
{
    Care,
    Craft,
    Combat,
    Witness,
    Economy,
    Progression,
    Notebook,
    Debug
}

public static class SimDomainExtensions
{
    public static string ToId(this SimDomain domain) => domain switch
    {
        SimDomain.Care => "care",
        SimDomain.Craft => "craft",
        SimDomain.Combat => "combat",
        SimDomain.Witness => "witness",
        SimDomain.Economy => "economy",
        SimDomain.Progression => "progression",
        SimDomain.Notebook => "notebook",
        SimDomain.Debug => "debug",
        _ => throw new ArgumentOutOfRangeException(nameof(domain), domain, "Unknown simulation domain.")
    };

    public static SimDomain FromId(string id) => id switch
    {
        "care" => SimDomain.Care,
        "craft" => SimDomain.Craft,
        "combat" => SimDomain.Combat,
        "witness" => SimDomain.Witness,
        "economy" => SimDomain.Economy,
        "progression" => SimDomain.Progression,
        "notebook" => SimDomain.Notebook,
        "debug" => SimDomain.Debug,
        _ => throw new ArgumentOutOfRangeException(nameof(id), id, "Unknown simulation domain id.")
    };
}
