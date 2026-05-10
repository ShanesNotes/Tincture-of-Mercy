using Tincture.Substrate.Economy;
using Tincture.Substrate.Progression;

namespace Tincture.Substrate.ReadModels;

public sealed record OpeningActSnapshot(
    long Tick,
    string LastEventId,
    int EventCount,
    InventorySnapshot Inventory,
    ProgressionSnapshot Progression,
    RecognitionSeedSnapshot RecognitionSeeds,
    IReadOnlyList<string> SourceEventIds,
    IReadOnlyDictionary<string, string> Metadata);
