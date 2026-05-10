using Tincture.Substrate.ReadModels;
using Tincture.Tests.Economy;
using Tincture.Tests.Support;

namespace Tincture.Tests.ReadModels;

public sealed class OpeningActSnapshotProjectorTests
{
    [Fact]
    public void OpeningActSnapshot_ProjectsCrossModuleAggregateOnly()
    {
        var stream = ItemLedgerTests.BreadWolfLedgerStream();
        var snapshot = new OpeningActSnapshotProjector().Project(stream.Events, tick: 20);

        Assert.Equal(20, snapshot.Tick);
        Assert.Equal(3, snapshot.EventCount);
        Assert.Equal("evt-00000003", snapshot.LastEventId);
        Assert.Equal(2, snapshot.Inventory.QuantityOf("wolf_pelt"));
        Assert.Equal(3, snapshot.SourceEventIds.Count);
        Assert.Equal("opening_act_snapshot_projector.v1", snapshot.Metadata["projector_id"]);
    }

    [Fact]
    public void ReadModelsStructure_AdaptersDoNotOwnSnapshots()
    {
        var presentationRoot = Path.Combine(StructureGuard.SubstrateRoot, "Presentation");
        var offenders = StructureGuard.FilesContainingAny(presentationRoot, ["OpeningActSnapshot", "OpeningActSnapshotProjector", "InventorySnapshot"]);

        Assert.Empty(offenders);
        Assert.True(File.Exists(Path.Combine(StructureGuard.SubstrateRoot, "ReadModels", "OpeningActSnapshot.cs")));
        Assert.True(File.Exists(Path.Combine(StructureGuard.SubstrateRoot, "ReadModels", "OpeningActSnapshotProjector.cs")));
        Assert.True(File.Exists(Path.Combine(StructureGuard.SubstrateRoot, "Progression", "ProgressionSnapshot.cs")));
        Assert.True(File.Exists(Path.Combine(StructureGuard.SubstrateRoot, "World", "SpatialTypes.cs")));
    }
}
