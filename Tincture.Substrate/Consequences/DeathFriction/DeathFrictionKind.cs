namespace Tincture.Substrate.Consequences.DeathFriction;

public enum DeathFrictionKind
{
    FixedDeath,
    BiologicalDeath,
    Downed,
    Recovery,
    MoralDeath
}

public static class DeathFrictionKindExtensions
{
    public static string ToId(this DeathFrictionKind kind) => kind switch
    {
        DeathFrictionKind.FixedDeath => "fixed_death",
        DeathFrictionKind.BiologicalDeath => "biological_death",
        DeathFrictionKind.Downed => "downed",
        DeathFrictionKind.Recovery => "recovery",
        DeathFrictionKind.MoralDeath => "moral_death",
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown death/friction kind.")
    };

    public static DeathFrictionKind FromId(string id) => id switch
    {
        "fixed_death" => DeathFrictionKind.FixedDeath,
        "biological_death" => DeathFrictionKind.BiologicalDeath,
        "downed" => DeathFrictionKind.Downed,
        "recovery" => DeathFrictionKind.Recovery,
        "moral_death" => DeathFrictionKind.MoralDeath,
        _ => throw new ArgumentOutOfRangeException(nameof(id), id, "Unknown death/friction kind id.")
    };
}
