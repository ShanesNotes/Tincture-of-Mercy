using System.Globalization;
using Tincture.Substrate.Economy;
using Tincture.Substrate.Events;
using Tincture.Substrate.Progression;

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

        return new OpeningActSnapshot(
            Tick: tick,
            LastEventId: ordered.LastOrDefault()?.Id ?? string.Empty,
            EventCount: ordered.Count,
            Inventory: itemLedger.Project(ordered),
            Progression: progressionProjector.Project(ordered),
            RecognitionSeeds: recognitionSeedProjector.Project(ordered),
            SourceEventIds: sourceEventIds,
            Metadata: metadata);
    }
}
