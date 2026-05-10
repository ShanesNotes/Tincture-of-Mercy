namespace Tincture.Substrate.Sim;

public sealed class SimClock
{
    public SimClock(ulong seed, int tickRate = 60)
    {
        if (tickRate <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(tickRate), "Tick rate must be positive.");
        }

        Seed = seed;
        TickRate = tickRate;
    }

    public ulong Seed { get; }

    public int TickRate { get; }

    public long Tick { get; private set; }

    public bool IsPaused { get; private set; }

    public double TimeScale { get; private set; } = 1.0d;

    public void Pause() => IsPaused = true;

    public void Resume() => IsPaused = false;

    public void SetTimeScale(double timeScale)
    {
        if (double.IsNaN(timeScale) || double.IsInfinity(timeScale) || timeScale < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(timeScale), "Time scale must be finite and non-negative.");
        }

        TimeScale = timeScale;
    }

    public IReadOnlyList<long> AdvanceTicks(int baseTicks)
    {
        if (baseTicks < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(baseTicks), "Base ticks must be non-negative.");
        }

        if (IsPaused || baseTicks == 0 || TimeScale == 0)
        {
            return [];
        }

        var scaledTicks = (int)Math.Round(baseTicks * TimeScale, MidpointRounding.AwayFromZero);
        var emitted = new List<long>(scaledTicks);
        for (var i = 0; i < scaledTicks; i++)
        {
            Tick++;
            emitted.Add(Tick);
        }

        return emitted;
    }
}
