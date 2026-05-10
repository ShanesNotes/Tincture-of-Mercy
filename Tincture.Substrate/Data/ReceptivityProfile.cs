namespace Tincture.Substrate.Data;

public sealed record ReceptivityProfile
{
    public string ProfileId { get; init; } = string.Empty;

    public string ActorId { get; init; } = string.Empty;

    public List<string> NeedTags { get; init; } = [];

    public List<string> FearTags { get; init; } = [];

    public List<string> ComfortTags { get; init; } = [];

    public SortedDictionary<LatentPath, int> PathFit { get; init; } = new();

    public SortedDictionary<VoiceRegister, int> RegisterFit { get; init; } = new();

    public List<string> RefusalTriggers { get; init; } = [];

    public List<string> RecognitionHooks { get; init; } = [];

    public int PathFitFor(LatentPath path)
    {
        return PathFit.TryGetValue(path, out var fit) ? fit : 0;
    }

    public int RegisterFitFor(VoiceRegister voiceRegister)
    {
        return RegisterFit.TryGetValue(voiceRegister, out var fit) ? fit : 0;
    }
}
