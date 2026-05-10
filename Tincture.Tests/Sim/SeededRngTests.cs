using Tincture.Substrate.Sim;

namespace Tincture.Tests.Sim;

public sealed class SeededRngTests
{
    [Fact]
    public void SeededRng_SubSeedsReplayAcrossSystems()
    {
        var firstRoot = SeededRng.FromRoot(8675309UL);
        var secondRoot = SeededRng.FromRoot(8675309UL);

        var firstCareRolls = RollThree(firstRoot.Fork("care"));
        var secondCareRolls = RollThree(secondRoot.Fork("care"));
        var combatRolls = RollThree(firstRoot.Fork("combat"));

        Assert.Equal(firstCareRolls.Select(roll => roll.Value), secondCareRolls.Select(roll => roll.Value));
        Assert.NotEqual(firstCareRolls.Select(roll => roll.Value), combatRolls.Select(roll => roll.Value));
        Assert.All(firstCareRolls, roll => Assert.Equal("care", roll.StreamId));
        Assert.Equal([1UL, 2UL, 3UL], firstCareRolls.Select(roll => roll.Step));
    }

    private static IReadOnlyList<RollResult> RollThree(SeededRng rng) =>
    [
        rng.RollInclusive("one", 1, 100),
        rng.RollInclusive("two", 1, 100),
        rng.RollInclusive("three", 1, 100)
    ];
}
