using Tincture.Substrate.Events;
using Tincture.Substrate.ReadModels;

namespace Tincture.Tests.ReadModels;

public sealed class OpeningActVisualStateProjectorTests
{
    [Fact]
    public void VisualState_ProjectsOnlyRealSnapshotSignals()
    {
        var stream = new SimEventStream();
        stream.AppendBatch([new SimEvent
        {
            Tick = 7,
            ActorId = "kalev",
            TargetId = "anna",
            VerbId = "care.observe_breath",
            Domain = SimDomain.Care,
            SourceSystem = "fixture",
            EventType = "presentation_state_recorded",
            Fields = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["hearth_state"] = "banked",
                ["anna_breath_state"] = "labored",
                ["iiro_posture"] = "sitting",
                ["notebook_state"] = "open",
                ["notebook_focus_page"] = "66",
                ["camera_focus_target"] = "anna",
                ["audio_cue"] = "long_morning_start"
            }),
            Tags = SimEvent.StableTags(["verb_invocation", "presence"])
        }]);
        var snapshot = new OpeningActSnapshotProjector().Project(stream.Events, tick: 8);

        var visual = new OpeningActVisualStateProjector().Project(snapshot);

        Assert.Equal("banked", visual.HearthLightState);
        Assert.Equal("labored", visual.AnnaAnimationRow);
        Assert.Equal("sit", visual.IiroAnimationRow);
        Assert.Equal("open", visual.NotebookDisplayState);
        Assert.Equal("66", visual.NotebookFocusPage);
        Assert.Equal("anna", visual.CameraFocusTarget);
        Assert.Equal("long_morning_start", visual.ActiveAudioCue);
        Assert.True(visual.HasFirstVerbBoundary);
        Assert.Equal(7, visual.FirstVerbInvokedTick);
    }

    [Fact]
    public void VisualState_DoesNotInventUnsetSnapshotSignals()
    {
        var snapshot = new OpeningActSnapshotProjector().Project(new SimEventStream().Events, tick: 3);

        var visual = new OpeningActVisualStateProjector().Project(snapshot);

        Assert.Equal(string.Empty, visual.HearthLightState);
        Assert.Equal("resting", visual.AnnaAnimationRow);
        Assert.Equal("idle", visual.IiroAnimationRow);
        Assert.Equal(string.Empty, visual.NotebookDisplayState);
        Assert.Equal(string.Empty, visual.NotebookFocusPage);
        Assert.Equal(string.Empty, visual.CameraFocusTarget);
        Assert.Equal(string.Empty, visual.ActiveAudioCue);
        Assert.False(visual.HasFirstVerbBoundary);
        Assert.Null(visual.FirstVerbInvokedTick);
    }
}
