namespace Tincture.Substrate.World;

public sealed class SpatialContext
{
    private readonly SortedDictionary<string, SpatialActorSnapshot> snapshots;
    private readonly SortedDictionary<string, SpatialRouteNode> routeNodes;

    public SpatialContext(
        IEnumerable<SpatialActorSnapshot> snapshots,
        IEnumerable<SpatialRouteNode>? routeNodes = null)
    {
        ArgumentNullException.ThrowIfNull(snapshots);
        this.snapshots = new SortedDictionary<string, SpatialActorSnapshot>(StringComparer.Ordinal);
        foreach (var snapshot in snapshots.Select(snapshot => snapshot.Validate()))
        {
            this.snapshots[snapshot.ActorId] = snapshot;
        }

        this.routeNodes = new SortedDictionary<string, SpatialRouteNode>(StringComparer.Ordinal);
        foreach (var routeNode in (routeNodes ?? []).Select(node => node.Validate()))
        {
            this.routeNodes[routeNode.NodeId] = routeNode;
        }
    }

    public IReadOnlyDictionary<string, SpatialActorSnapshot> Snapshots => snapshots;

    public SpatialActorSnapshot Snapshot(string actorId)
    {
        if (!snapshots.TryGetValue(actorId, out var snapshot))
        {
            throw new InvalidOperationException($"SpatialContext is missing actor '{actorId}'.");
        }

        return snapshot;
    }

    public SpatialRouteNode RouteNode(string nodeId)
    {
        if (!routeNodes.TryGetValue(nodeId, out var node))
        {
            throw new InvalidOperationException($"SpatialContext is missing route node '{nodeId}'.");
        }

        return node;
    }

    public int ManhattanDistance(string actorId, string otherActorId) =>
        Snapshot(actorId).Position.ManhattanDistanceTo(Snapshot(otherActorId).Position);

    public SpatialBand BandBetween(string actorId, string otherActorId) => BandForDistance(ManhattanDistance(actorId, otherActorId));

    public static SpatialBand BandForDistance(int distance)
    {
        if (distance < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(distance), "Distance must be non-negative.");
        }

        return distance switch
        {
            <= 1 => SpatialBand.Close,
            <= 3 => SpatialBand.Near,
            <= 6 => SpatialBand.Far,
            _ => SpatialBand.Distant
        };
    }

    public bool SameZone(string actorId, string otherActorId) =>
        string.Equals(Snapshot(actorId).ZoneId, Snapshot(otherActorId).ZoneId, StringComparison.Ordinal);

    public int NoiseAt(string actorId) => Snapshot(actorId).Noise;

    public bool IsRouteNodeReached(string actorId, string nodeId, int reachDistance = 0) =>
        Snapshot(actorId).Position.ManhattanDistanceTo(RouteNode(nodeId).Position) <= reachDistance;

    public bool IsProtectorOnLine(string aggressorId, string protectedId, string protectorId, double tolerance = 0.75)
    {
        var aggressor = Snapshot(aggressorId).Position;
        var protectedActor = Snapshot(protectedId).Position;
        var protector = Snapshot(protectorId).Position;

        if (protector.Equals(aggressor) || protector.Equals(protectedActor))
        {
            return false;
        }

        var total = aggressor.DistanceTo(protectedActor);
        if (total <= 0)
        {
            return false;
        }

        var viaProtector = aggressor.DistanceTo(protector) + protector.DistanceTo(protectedActor);
        if (Math.Abs(viaProtector - total) > tolerance)
        {
            return false;
        }

        return IsBetween(aggressor.X, protectedActor.X, protector.X)
            && IsBetween(aggressor.Y, protectedActor.Y, protector.Y);
    }

    private static bool IsBetween(int a, int b, int value) => value >= Math.Min(a, b) && value <= Math.Max(a, b);
}
