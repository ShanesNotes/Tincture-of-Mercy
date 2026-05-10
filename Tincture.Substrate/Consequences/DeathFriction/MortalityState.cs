namespace Tincture.Substrate.Consequences.DeathFriction;

public enum MortalityState
{
    Alive,
    Downed,
    Dead,
    MoralDeath
}

public static class MortalityStateExtensions
{
    public static string ToId(this MortalityState state) => state switch
    {
        MortalityState.Alive => "alive",
        MortalityState.Downed => "downed",
        MortalityState.Dead => "dead",
        MortalityState.MoralDeath => "moral_death",
        _ => throw new ArgumentOutOfRangeException(nameof(state), state, "Unknown mortality state.")
    };

    public static MortalityState FromId(string id) => id switch
    {
        "alive" => MortalityState.Alive,
        "downed" => MortalityState.Downed,
        "dead" => MortalityState.Dead,
        "moral_death" => MortalityState.MoralDeath,
        _ => throw new ArgumentOutOfRangeException(nameof(id), id, "Unknown mortality state id.")
    };
}
