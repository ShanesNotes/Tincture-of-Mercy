using System.Globalization;

namespace Tincture.Substrate.World;

public readonly record struct GridCoord(int X, int Y)
{
    public int ManhattanDistanceTo(GridCoord other) => Math.Abs(X - other.X) + Math.Abs(Y - other.Y);

    public double DistanceTo(GridCoord other)
    {
        var dx = X - other.X;
        var dy = Y - other.Y;
        return Math.Sqrt((dx * dx) + (dy * dy));
    }

    public string ToId() => string.Create(CultureInfo.InvariantCulture, $"{X},{Y}");
}

public enum SpatialBand
{
    Close,
    Near,
    Far,
    Distant
}

public static class SpatialBandExtensions
{
    public static string ToId(this SpatialBand band) => band switch
    {
        SpatialBand.Close => "close",
        SpatialBand.Near => "near",
        SpatialBand.Far => "far",
        SpatialBand.Distant => "distant",
        _ => throw new ArgumentOutOfRangeException(nameof(band), band, "Unknown spatial band.")
    };

    public static SpatialBand FromId(string id) => id switch
    {
        "close" => SpatialBand.Close,
        "near" => SpatialBand.Near,
        "far" => SpatialBand.Far,
        "distant" => SpatialBand.Distant,
        _ => throw new ArgumentOutOfRangeException(nameof(id), id, "Unknown spatial band id.")
    };
}

public sealed record SpatialActorSnapshot
{
    public string ActorId { get; init; } = string.Empty;

    public GridCoord Position { get; init; }

    public string ZoneId { get; init; } = string.Empty;

    public int Noise { get; init; }

    public IReadOnlyList<string> Tags { get; init; } = [];

    public SpatialActorSnapshot Validate()
    {
        RequireNonBlank(ActorId, nameof(ActorId));
        RequireNonBlank(ZoneId, nameof(ZoneId));
        if (Noise < 0)
        {
            throw new InvalidOperationException("SpatialActorSnapshot.Noise must be non-negative.");
        }

        return this with
        {
            Tags = Tags
                .Where(tag => !string.IsNullOrWhiteSpace(tag))
                .Select(tag => tag.Trim())
                .Distinct(StringComparer.Ordinal)
                .Order(StringComparer.Ordinal)
                .ToList()
                .AsReadOnly()
        };
    }

    private static void RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{name} must be non-blank.");
        }
    }
}

public sealed record SpatialRouteNode
{
    public string NodeId { get; init; } = string.Empty;

    public GridCoord Position { get; init; }

    public string ZoneId { get; init; } = string.Empty;

    public SpatialRouteNode Validate()
    {
        if (string.IsNullOrWhiteSpace(NodeId))
        {
            throw new InvalidOperationException("SpatialRouteNode.NodeId must be non-blank.");
        }

        if (string.IsNullOrWhiteSpace(ZoneId))
        {
            throw new InvalidOperationException("SpatialRouteNode.ZoneId must be non-blank.");
        }

        return this;
    }
}
