namespace Tincture.Substrate.Progression;

public enum ProgressionTrack
{
    Witness,
    Recollection,
    Vocation,
    DebugXp
}

public static class ProgressionTrackExtensions
{
    public static string ToId(this ProgressionTrack track) => track switch
    {
        ProgressionTrack.Witness => "witness",
        ProgressionTrack.Recollection => "recollection",
        ProgressionTrack.Vocation => "vocation",
        ProgressionTrack.DebugXp => "debug_xp",
        _ => throw new ArgumentOutOfRangeException(nameof(track), track, "Unknown progression track.")
    };

    public static ProgressionTrack FromId(string id) => id switch
    {
        "witness" => ProgressionTrack.Witness,
        "recollection" => ProgressionTrack.Recollection,
        "vocation" => ProgressionTrack.Vocation,
        "debug_xp" => ProgressionTrack.DebugXp,
        _ => throw new ArgumentOutOfRangeException(nameof(id), id, "Unknown progression track id.")
    };
}
