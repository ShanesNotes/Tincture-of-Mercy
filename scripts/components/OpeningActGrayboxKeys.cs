using System.Collections.Generic;

/// <summary>
/// Source-testable contract for the C6 Godot graybox adapter.
/// These are presentation lookup keys only; canonical state remains in substrate snapshots/events.
/// </summary>
public static class OpeningActGrayboxKeys
{
    public const string ActorKalev = "kalev";
    public const string ActorAnna = "anna";
    public const string ActorIiro = "iiro";
    public const string ActorWolf01 = "wolf_01";
    public const string ActorWolf02 = "wolf_02";
    public const string ActorWolf03 = "wolf_03";

    public const string SnapshotHearthState = "hearth_state";
    public const string SnapshotAnnaBreathState = "anna_breath_state";
    public const string SnapshotIiroPosture = "iiro_posture";
    public const string SnapshotNotebookState = "notebook_state";
    public const string SnapshotNotebookFocusPage = "notebook_focus_page";
    public const string SnapshotCameraFocusTarget = "camera_focus_target";
    public const string SnapshotInventory = "inventory";
    public const string SnapshotRecognitionSeeds = "recognition_seeds";
    public const string SnapshotActiveAudioCue = "active_audio_cue";

    public const string InventoryWaterSupply = "water_supply";
    public const string InventoryBread = "bread";
    public const string InventoryTinctureDose = "tincture_dose";
    public const string InventoryWolfHide = "wolf_hide";

    public const string CameraWide = "wide";
    public const string CameraAnna = "anna";
    public const string CameraYard = "yard";
    public const string CameraThreshold = "threshold";
    public const string CameraNotebook = "notebook";

    public static IReadOnlyList<string> ActorIds { get; } =
    [
        ActorKalev,
        ActorAnna,
        ActorIiro,
        ActorWolf01,
        ActorWolf02,
        ActorWolf03
    ];

    public static IReadOnlyList<string> SnapshotFieldKeys { get; } =
    [
        SnapshotHearthState,
        SnapshotAnnaBreathState,
        SnapshotIiroPosture,
        SnapshotNotebookState,
        SnapshotNotebookFocusPage,
        SnapshotCameraFocusTarget,
        SnapshotInventory,
        SnapshotRecognitionSeeds,
        SnapshotActiveAudioCue
    ];
}
