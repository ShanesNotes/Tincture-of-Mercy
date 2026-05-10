namespace Tincture.Substrate.Actors;

public sealed record StatBlock
{
    public int Body { get; init; } = 1;

    public int Spirit { get; init; } = 1;

    public int Care { get; init; } = 1;

    public int Nerve { get; init; } = 1;

    public int Attention { get; init; } = 1;
}
