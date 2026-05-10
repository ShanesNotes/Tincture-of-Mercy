using Tincture.Substrate.World;

namespace Tincture.Tests.World;

public sealed class SpatialContextTests
{
    [Fact]
    public void SpatialContext_HeadlessZonesAndNoiseFeedThreat()
    {
        var context = new SpatialContext(
        [
            Snapshot("aggressor", 0, 0, "road", noise: 2),
            Snapshot("protected", 4, 0, "road", noise: 7),
            Snapshot("protector_on_line", 2, 0, "road", noise: 1),
            Snapshot("protector_off_line", 2, 2, "road", noise: 1)
        ],
        [
            new SpatialRouteNode { NodeId = "safety_gate", Position = new GridCoord(4, 0), ZoneId = "road" }
        ]);

        Assert.True(context.SameZone("aggressor", "protected"));
        Assert.Equal(SpatialBand.Far, context.BandBetween("aggressor", "protected"));
        Assert.Equal(7, context.NoiseAt("protected"));
        Assert.True(context.IsRouteNodeReached("protected", "safety_gate"));
        Assert.True(context.IsProtectorOnLine("aggressor", "protected", "protector_on_line"));
        Assert.False(context.IsProtectorOnLine("aggressor", "protected", "protector_off_line"));
    }

    private static SpatialActorSnapshot Snapshot(string actorId, int x, int y, string zone, int noise) => new()
    {
        ActorId = actorId,
        Position = new GridCoord(x, y),
        ZoneId = zone,
        Noise = noise
    };
}
