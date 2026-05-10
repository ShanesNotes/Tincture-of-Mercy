namespace Tincture.Substrate.Sim.Timers;

public enum TimerKind
{
    GlobalCooldown,
    Work,
    Cast,
    Channel,
    Swing,
    RitePulse
}

public static class TimerKindExtensions
{
    public static string ToId(this TimerKind kind) => kind switch
    {
        TimerKind.GlobalCooldown => "gcd",
        TimerKind.Work => "work",
        TimerKind.Cast => "cast",
        TimerKind.Channel => "channel",
        TimerKind.Swing => "swing",
        TimerKind.RitePulse => "rite_pulse",
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown timer kind.")
    };

    public static TimerKind FromId(string id) => id switch
    {
        "gcd" => TimerKind.GlobalCooldown,
        "work" => TimerKind.Work,
        "cast" => TimerKind.Cast,
        "channel" => TimerKind.Channel,
        "swing" => TimerKind.Swing,
        "rite_pulse" => TimerKind.RitePulse,
        _ => throw new ArgumentOutOfRangeException(nameof(id), id, "Unknown timer kind id.")
    };
}
