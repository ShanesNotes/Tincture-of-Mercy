using Tincture.Substrate.Economy;
using Tincture.Substrate.Progression;

namespace Tincture.Substrate.ReadModels;

public sealed record OpeningActSnapshot(
    long Tick,
    string LastEventId,
    int EventCount,
    string HearthState,
    string AnnaBreathState,
    string IiroPosture,
    string NotebookState,
    string NotebookFocusPage,
    string CameraFocusTarget,
    long? FirstVerbInvokedTick,
    InventorySnapshot Inventory,
    ProgressionSnapshot Progression,
    RecognitionSeedSnapshot RecognitionSeeds,
    IReadOnlyList<string> SourceEventIds,
    IReadOnlyDictionary<string, string> Metadata);
