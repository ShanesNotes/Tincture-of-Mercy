using Tincture.Substrate.Sim;

namespace Tincture.Tests.Sim;

public sealed class SimClockTests
{
    [Fact]
    public void SimClock_ReplaysFixedTicks()
    {
        var first = BuildTrace();
        var second = BuildTrace();

        Assert.Equal(first, second);
        Assert.Equal([1L, 2L, 3L, 4L, 5L, 6L, 7L], first);
    }

    private static IReadOnlyList<long> BuildTrace()
    {
        var clock = new SimClock(seed: 2468, tickRate: 30);
        var trace = new List<long>();
        trace.AddRange(clock.AdvanceTicks(3));
        clock.Pause();
        trace.AddRange(clock.AdvanceTicks(10));
        clock.Resume();
        clock.SetTimeScale(2.0d);
        trace.AddRange(clock.AdvanceTicks(2));
        return trace;
    }
}
