using System.Globalization;
using Tincture.Substrate.Economy;
using Tincture.Substrate.Events;
using Tincture.Substrate.Progression;
using Tincture.Substrate.Rules;

namespace Tincture.Substrate.ReadModels;

public sealed class OpeningActSnapshotProjector
{
    private readonly ItemLedger itemLedger;
    private readonly ProgressionProjector progressionProjector;
    private readonly RecognitionSeedProjector recognitionSeedProjector;

    public OpeningActSnapshotProjector(
        ItemLedger? itemLedger = null,
        ProgressionProjector? progressionProjector = null,
        RecognitionSeedProjector? recognitionSeedProjector = null)
    {
        this.itemLedger = itemLedger ?? new ItemLedger();
        this.progressionProjector = progressionProjector ?? new ProgressionProjector();
        this.recognitionSeedProjector = recognitionSeedProjector ?? new RecognitionSeedProjector();
    }

    public OpeningActSnapshot Project(IEnumerable<SimEvent> events, long tick)
    {
        ArgumentNullException.ThrowIfNull(events);
        if (tick < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(tick), "Opening Act snapshot tick must be non-negative.");
        }

        var ordered = events
            .OrderBy(simEvent => simEvent.Sequence)
            .ToList();
        var sourceEventIds = ordered
            .Select(simEvent => simEvent.Id)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .Order(StringComparer.Ordinal)
            .ToList()
            .AsReadOnly();
        var metadata = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["event_count"] = ordered.Count.ToString(CultureInfo.InvariantCulture),
            ["projector_id"] = "opening_act_snapshot_projector.v1",
            ["tick"] = tick.ToString(CultureInfo.InvariantCulture)
        };
        var sensory = ProjectSensoryState(ordered);
        if (!string.IsNullOrWhiteSpace(sensory.ActiveAudioCue))
        {
            metadata["active_audio_cue"] = sensory.ActiveAudioCue;
        }

        return new OpeningActSnapshot(
            Tick: tick,
            LastEventId: ordered.LastOrDefault()?.Id ?? string.Empty,
            EventCount: ordered.Count,
            HearthState: sensory.HearthState,
            AnnaBreathState: sensory.AnnaBreathState,
            IiroPosture: sensory.IiroPosture,
            NotebookState: sensory.NotebookState,
            NotebookFocusPage: sensory.NotebookFocusPage,
            CameraFocusTarget: sensory.CameraFocusTarget,
            FirstVerbInvokedTick: sensory.FirstVerbInvokedTick,
            Inventory: itemLedger.Project(ordered),
            Progression: progressionProjector.Project(ordered),
            RecognitionSeeds: recognitionSeedProjector.Project(ordered),
            SourceEventIds: sourceEventIds,
            Metadata: metadata);
    }

    private static OpeningActSensoryState ProjectSensoryState(IReadOnlyList<SimEvent> ordered)
    {
        var hearthState = string.Empty;
        var annaBreathState = string.Empty;
        var iiroPosture = string.Empty;
        var notebookState = string.Empty;
        var notebookFocusPage = string.Empty;
        var cameraFocusTarget = string.Empty;
        string activeAudioCue = string.Empty;
        long? firstVerbInvokedTick = null;

        foreach (var simEvent in ordered)
        {
            if (firstVerbInvokedTick is null && IsVerbInvocationBoundary(simEvent))
            {
                firstVerbInvokedTick = simEvent.Tick;
            }

            AssignIfPresent(simEvent, "hearth_state", value => hearthState = value);
            AssignIfPresent(simEvent, "anna_breath_state", value => annaBreathState = value);
            AssignIfPresent(simEvent, "iiro_posture", value => iiroPosture = value);
            AssignIfPresent(simEvent, "notebook_state", value => notebookState = value);
            AssignIfPresent(simEvent, "notebook_focus_page", value => notebookFocusPage = value);
            AssignIfPresent(simEvent, "camera_focus_target", value => cameraFocusTarget = value);
            AssignIfPresent(simEvent, "audio_cue", value => activeAudioCue = value);
        }

        return new OpeningActSensoryState(
            hearthState,
            annaBreathState,
            iiroPosture,
            notebookState,
            notebookFocusPage,
            cameraFocusTarget,
            activeAudioCue,
            firstVerbInvokedTick);
    }

    private static bool IsVerbInvocationBoundary(SimEvent simEvent)
    {
        return string.Equals(simEvent.SourceSystem, VerbInvocation.SourceSystemId, StringComparison.Ordinal)
            || simEvent.Tags.Contains("verb_invocation", StringComparer.Ordinal);
    }

    private static void AssignIfPresent(SimEvent simEvent, string key, Action<string> assign)
    {
        if (simEvent.Fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value))
        {
            assign(value);
        }
    }
}

internal sealed record OpeningActSensoryState(
    string HearthState,
    string AnnaBreathState,
    string IiroPosture,
    string NotebookState,
    string NotebookFocusPage,
    string CameraFocusTarget,
    string ActiveAudioCue,
    long? FirstVerbInvokedTick);
