namespace Tincture.Substrate.Progression;

public enum RecognitionSeedKind
{
    Bread,
    Name,
    Presence,
    Witness,
    Protection,
    NotebookPersonRecord
}

public static class RecognitionSeedKindExtensions
{
    public static string ToId(this RecognitionSeedKind kind) => kind switch
    {
        RecognitionSeedKind.Bread => "bread",
        RecognitionSeedKind.Name => "name",
        RecognitionSeedKind.Presence => "presence",
        RecognitionSeedKind.Witness => "witness",
        RecognitionSeedKind.Protection => "protection",
        RecognitionSeedKind.NotebookPersonRecord => "notebook_person_record",
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown recognition seed kind.")
    };

    public static RecognitionSeedKind FromId(string id) => id switch
    {
        "bread" => RecognitionSeedKind.Bread,
        "name" => RecognitionSeedKind.Name,
        "presence" => RecognitionSeedKind.Presence,
        "witness" => RecognitionSeedKind.Witness,
        "protection" => RecognitionSeedKind.Protection,
        "notebook_person_record" => RecognitionSeedKind.NotebookPersonRecord,
        _ => throw new ArgumentOutOfRangeException(nameof(id), id, "Unknown recognition seed kind id.")
    };
}
