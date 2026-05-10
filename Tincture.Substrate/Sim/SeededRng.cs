namespace Tincture.Substrate.Sim;

public sealed class SeededRng
{
    private ulong state;

    private SeededRng(ulong rootSeed, ulong streamSeed, string streamId)
    {
        RootSeed = rootSeed;
        StreamSeed = streamSeed == 0 ? 0x9E3779B97F4A7C15UL : streamSeed;
        StreamId = streamId;
        state = StreamSeed;
    }

    public ulong RootSeed { get; }

    public ulong StreamSeed { get; }

    public string StreamId { get; }

    public ulong Step { get; private set; }

    public static SeededRng FromRoot(ulong rootSeed, string streamId = "root")
    {
        return new SeededRng(rootSeed, DeriveSeed(rootSeed, streamId), streamId);
    }

    public SeededRng Fork(string streamId)
    {
        if (string.IsNullOrWhiteSpace(streamId))
        {
            throw new ArgumentException("Stream id must be non-blank.", nameof(streamId));
        }

        return new SeededRng(RootSeed, DeriveSeed(RootSeed, streamId), streamId);
    }

    public ulong NextUInt64()
    {
        Step++;
        state += 0x9E3779B97F4A7C15UL;
        var z = state;
        z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9UL;
        z = (z ^ (z >> 27)) * 0x94D049BB133111EBUL;
        return z ^ (z >> 31);
    }

    public int NextInt(int minInclusive, int maxExclusive)
    {
        if (minInclusive >= maxExclusive)
        {
            throw new ArgumentOutOfRangeException(nameof(maxExclusive), "Maximum must be greater than minimum.");
        }

        var range = (ulong)(maxExclusive - minInclusive);
        var rejectionThreshold = (0UL - range) % range;
        ulong candidate;
        do
        {
            candidate = NextUInt64();
        }
        while (candidate < rejectionThreshold);

        return minInclusive + (int)(candidate % range);
    }

    public RollResult RollInclusive(string rollId, int minInclusive, int maxInclusive)
    {
        if (minInclusive > maxInclusive)
        {
            throw new ArgumentOutOfRangeException(nameof(maxInclusive), "Maximum must be greater than or equal to minimum.");
        }

        var value = NextInt(minInclusive, maxInclusive + 1);
        return new RollResult(
            rollId,
            StreamId,
            RootSeed,
            StreamSeed,
            Step,
            minInclusive,
            maxInclusive,
            value);
    }

    private static ulong DeriveSeed(ulong rootSeed, string streamId)
    {
        var hash = 1469598103934665603UL;
        foreach (var character in streamId)
        {
            hash ^= character;
            hash *= 1099511628211UL;
        }

        return Mix(rootSeed ^ hash);
    }

    private static ulong Mix(ulong value)
    {
        value += 0x9E3779B97F4A7C15UL;
        value = (value ^ (value >> 30)) * 0xBF58476D1CE4E5B9UL;
        value = (value ^ (value >> 27)) * 0x94D049BB133111EBUL;
        return value ^ (value >> 31);
    }
}

public sealed record RollResult(
    string RollId,
    string StreamId,
    ulong RootSeed,
    ulong StreamSeed,
    ulong Step,
    int MinInclusive,
    int MaxInclusive,
    int Value);
