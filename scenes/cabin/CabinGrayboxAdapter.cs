using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using Tincture.Substrate.Events;
using Tincture.Substrate.Progression;
using Tincture.Substrate.ReadModels;

/// <summary>
/// C6 placeholder adapter: folds substrate OpeningActSnapshot truth into graybox labels/nodes.
/// It intentionally owns only layout and display state; event/snapshot truth remains in Tincture.Substrate.
/// </summary>
public partial class CabinGrayboxAdapter : Node2D
{
    public const string ScenePath = "res://scenes/cabin/cabin_graybox.tscn";

    [Export] public NodePath HearthLabelPath { get; set; } = "CanvasLayer/Panel/VBox/Hearth";
    [Export] public NodePath AnnaBreathLabelPath { get; set; } = "CanvasLayer/Panel/VBox/AnnaBreath";
    [Export] public NodePath IiroPostureLabelPath { get; set; } = "CanvasLayer/Panel/VBox/IiroPosture";
    [Export] public NodePath NotebookLabelPath { get; set; } = "CanvasLayer/Panel/VBox/Notebook";
    [Export] public NodePath InventoryLabelPath { get; set; } = "CanvasLayer/Panel/VBox/Inventory";
    [Export] public NodePath RecognitionLabelPath { get; set; } = "CanvasLayer/Panel/VBox/Recognition";
    [Export] public NodePath AudioCueLabelPath { get; set; } = "CanvasLayer/Panel/VBox/AudioCue";
    [Export] public NodePath VisualStateLabelPath { get; set; } = "CanvasLayer/Panel/VBox/VisualState";
    [Export] public NodePath SnapshotMetaLabelPath { get; set; } = "CanvasLayer/Panel/VBox/SnapshotMeta";

    [Export] public NodePath CameraPath { get; set; } = "MainCamera";
    [Export] public NodePath HearthBodyPath { get; set; } = "Hearth";
    [Export] public NodePath KalevActorPath { get; set; } = "Actors/Kalev";
    [Export] public NodePath AnnaActorPath { get; set; } = "Actors/Anna";
    [Export] public NodePath IiroActorPath { get; set; } = "Actors/Iiro";
    [Export] public NodePath Wolf01ActorPath { get; set; } = "Actors/Wolf01";
    [Export] public NodePath Wolf02ActorPath { get; set; } = "Actors/Wolf02";
    [Export] public NodePath Wolf03ActorPath { get; set; } = "Actors/Wolf03";

    private readonly Dictionary<string, NodePath> actorPaths = new(StringComparer.Ordinal);

    public override void _Ready()
    {
        actorPaths[OpeningActGrayboxKeys.ActorKalev] = KalevActorPath;
        actorPaths[OpeningActGrayboxKeys.ActorAnna] = AnnaActorPath;
        actorPaths[OpeningActGrayboxKeys.ActorIiro] = IiroActorPath;
        actorPaths[OpeningActGrayboxKeys.ActorWolf01] = Wolf01ActorPath;
        actorPaths[OpeningActGrayboxKeys.ActorWolf02] = Wolf02ActorPath;
        actorPaths[OpeningActGrayboxKeys.ActorWolf03] = Wolf03ActorPath;

        SetLabel(SnapshotMetaLabelPath, "C6 graybox waiting for OpeningActSnapshot");
    }

    public OpeningActSnapshot PresentEvents(IEnumerable<SimEvent> events, long tick)
    {
        ArgumentNullException.ThrowIfNull(events);
        var snapshot = new OpeningActSnapshotProjector().Project(events, tick);
        PresentSnapshot(snapshot);
        return snapshot;
    }

    public void PresentSnapshot(OpeningActSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        var visualState = new OpeningActVisualStateProjector().Project(snapshot);

        SetLabel(HearthLabelPath, $"{OpeningActGrayboxKeys.SnapshotHearthState}: {Display(snapshot.HearthState)}");
        SetLabel(AnnaBreathLabelPath, $"{OpeningActGrayboxKeys.SnapshotAnnaBreathState}: {Display(snapshot.AnnaBreathState)}");
        SetLabel(IiroPostureLabelPath, $"{OpeningActGrayboxKeys.SnapshotIiroPosture}: {Display(snapshot.IiroPosture)}");
        SetLabel(NotebookLabelPath, NotebookText(snapshot));
        SetLabel(InventoryLabelPath, InventoryText(snapshot));
        SetLabel(RecognitionLabelPath, RecognitionText(snapshot));
        SetLabel(AudioCueLabelPath, AudioCueText(snapshot));
        SetLabel(VisualStateLabelPath, VisualStateText(visualState));
        SetLabel(SnapshotMetaLabelPath, $"tick {snapshot.Tick} | events {snapshot.EventCount} | last {Display(snapshot.LastEventId)}");

        ApplyActorLabels(snapshot, visualState);
        ApplyHearthVisual(visualState.HearthLightState);
        ApplyCameraFocus(visualState.CameraFocusTarget);
    }

    private void ApplyActorLabels(OpeningActSnapshot snapshot, OpeningActVisualState visualState)
    {
        SetActorLabel(OpeningActGrayboxKeys.ActorKalev, OpeningActGrayboxKeys.ActorKalev);
        SetActorLabel(OpeningActGrayboxKeys.ActorAnna, $"{OpeningActGrayboxKeys.ActorAnna}\nbreath: {Display(snapshot.AnnaBreathState)}\nrow: {visualState.AnnaAnimationRow}");
        SetActorLabel(OpeningActGrayboxKeys.ActorIiro, $"{OpeningActGrayboxKeys.ActorIiro}\nposture: {Display(snapshot.IiroPosture)}\nrow: {visualState.IiroAnimationRow}");
        SetActorLabel(OpeningActGrayboxKeys.ActorWolf01, OpeningActGrayboxKeys.ActorWolf01);
        SetActorLabel(OpeningActGrayboxKeys.ActorWolf02, OpeningActGrayboxKeys.ActorWolf02);
        SetActorLabel(OpeningActGrayboxKeys.ActorWolf03, OpeningActGrayboxKeys.ActorWolf03);
    }

    private void ApplyHearthVisual(string hearthLightState)
    {
        var hearth = GetNodeOrNull<ColorRect>(HearthBodyPath);
        if (hearth is null)
        {
            return;
        }

        hearth.Color = hearthLightState switch
        {
            "cold" => new Color(0.19f, 0.22f, 0.25f, 1.0f),
            "banked" or "low" => new Color(0.54f, 0.28f, 0.16f, 1.0f),
            "ember" or "lit" => new Color(0.86f, 0.31f, 0.12f, 1.0f),
            _ => new Color(0.86f, 0.31f, 0.12f, 1.0f),
        };
    }

    private void ApplyCameraFocus(string focusTarget)
    {
        var camera = GetNodeOrNull<Camera2D>(CameraPath);
        if (camera is null)
        {
            return;
        }

        camera.Position = CameraFocusPosition(focusTarget);
    }

    private static Vector2 CameraFocusPosition(string focusTarget)
    {
        return focusTarget switch
        {
            OpeningActGrayboxKeys.CameraAnna => new Vector2(120, 72),
            OpeningActGrayboxKeys.CameraYard => new Vector2(320, 168),
            OpeningActGrayboxKeys.CameraThreshold => new Vector2(248, 120),
            OpeningActGrayboxKeys.CameraNotebook => new Vector2(176, 124),
            _ => new Vector2(200, 120),
        };
    }

    private void SetActorLabel(string actorId, string text)
    {
        if (!actorPaths.TryGetValue(actorId, out var path))
        {
            return;
        }

        var actor = GetNodeOrNull<Node2D>(path);
        var label = actor?.GetNodeOrNull<Label>("Label");
        if (label is not null)
        {
            label.Text = text;
        }
    }

    private void SetLabel(NodePath path, string text)
    {
        var label = GetNodeOrNull<Label>(path);
        if (label is not null)
        {
            label.Text = text;
        }
    }

    private static string NotebookText(OpeningActSnapshot snapshot)
    {
        return $"{OpeningActGrayboxKeys.SnapshotNotebookState}: {Display(snapshot.NotebookState)} | " +
            $"{OpeningActGrayboxKeys.SnapshotNotebookFocusPage}: {Display(snapshot.NotebookFocusPage)}";
    }

    private static string InventoryText(OpeningActSnapshot snapshot)
    {
        var entries = snapshot.Inventory.Entries.Values
            .OrderBy(entry => entry.ItemId, StringComparer.Ordinal)
            .Select(entry => $"{entry.ItemId} x{entry.Quantity}")
            .ToList();
        return $"{OpeningActGrayboxKeys.SnapshotInventory}: {(entries.Count == 0 ? "empty" : string.Join(", ", entries))}";
    }

    private static string RecognitionText(OpeningActSnapshot snapshot)
    {
        var seeds = snapshot.RecognitionSeeds.Seeds
            .OrderBy(seed => seed.Sequence)
            .Select(seed => $"{RecognitionSeedKindExtensions.ToId(seed.Kind)}:{seed.PersonId}:{seed.Label}")
            .ToList();
        return $"{OpeningActGrayboxKeys.SnapshotRecognitionSeeds}: {(seeds.Count == 0 ? "none" : string.Join(" | ", seeds))}";
    }

    private static string AudioCueText(OpeningActSnapshot snapshot)
    {
        snapshot.Metadata.TryGetValue(OpeningActGrayboxKeys.SnapshotActiveAudioCue, out var cue);
        return $"{OpeningActGrayboxKeys.SnapshotActiveAudioCue}: {Display(cue ?? string.Empty)}";
    }

    private static string VisualStateText(OpeningActVisualState visualState)
    {
        return $"visual rows: anna={visualState.AnnaAnimationRow} iiro={visualState.IiroAnimationRow} | " +
            $"hearth={Display(visualState.HearthLightState)} | camera={Display(visualState.CameraFocusTarget)}";
    }

    private static string Display(string value) => string.IsNullOrWhiteSpace(value) ? "unset" : value;
}
