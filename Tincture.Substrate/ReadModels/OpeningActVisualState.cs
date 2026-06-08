namespace Tincture.Substrate.ReadModels;

public sealed record OpeningActVisualState(
    string HearthLightState,
    string AnnaAnimationRow,
    string IiroAnimationRow,
    string NotebookDisplayState,
    string NotebookFocusPage,
    string CameraFocusTarget,
    string ActiveAudioCue,
    bool HasFirstVerbBoundary,
    long? FirstVerbInvokedTick)
{
    public static OpeningActVisualState Empty { get; } = new(
        HearthLightState: string.Empty,
        AnnaAnimationRow: "resting",
        IiroAnimationRow: "idle",
        NotebookDisplayState: string.Empty,
        NotebookFocusPage: string.Empty,
        CameraFocusTarget: string.Empty,
        ActiveAudioCue: string.Empty,
        HasFirstVerbBoundary: false,
        FirstVerbInvokedTick: null);
}

public sealed class OpeningActVisualStateProjector
{
    public OpeningActVisualState Project(OpeningActSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        snapshot.Metadata.TryGetValue("active_audio_cue", out var activeAudioCue);

        return new OpeningActVisualState(
            HearthLightState: snapshot.HearthState,
            AnnaAnimationRow: AnnaRow(snapshot.AnnaBreathState),
            IiroAnimationRow: IiroRow(snapshot.IiroPosture),
            NotebookDisplayState: snapshot.NotebookState,
            NotebookFocusPage: snapshot.NotebookFocusPage,
            CameraFocusTarget: snapshot.CameraFocusTarget,
            ActiveAudioCue: activeAudioCue ?? string.Empty,
            HasFirstVerbBoundary: snapshot.FirstVerbInvokedTick.HasValue,
            FirstVerbInvokedTick: snapshot.FirstVerbInvokedTick);
    }

    private static string AnnaRow(string breathState) => breathState switch
    {
        "labored" or "thin" => "labored",
        "crisis" or "stopped" => "crisis",
        _ => "resting"
    };

    private static string IiroRow(string posture) => posture switch
    {
        "sitting" or "seated" or "sit" => "sit",
        "sleeping" or "sleep" => "sleep",
        _ => "idle"
    };
}
