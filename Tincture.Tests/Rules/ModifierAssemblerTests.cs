using Tincture.Substrate.Rules;

namespace Tincture.Tests.Rules;

public sealed class ModifierAssemblerTests
{
    [Fact]
    public void ModifierAssembler_ComposesInStableOrder()
    {
        var assembler = new ModifierAssembler();
        var modifiers = assembler.Assemble(
            new[]
            {
                Modifier("z_last", "evt-00000002", 1),
                Modifier("a_second", "evt-00000002", 2)
            },
            new[]
            {
                Modifier("m_first", "evt-00000001", 3),
                Modifier("root_before_events", null, 4)
            });

        Assert.Equal(
            ["root_before_events", "m_first", "a_second", "z_last"],
            modifiers.Select(modifier => modifier.ModifierId));
        Assert.Equal(10, modifiers.Sum(modifier => modifier.Amount));
    }

    private static OutcomeModifier Modifier(string id, string? sourceEventId, int amount) => new()
    {
        ModifierId = id,
        SourceId = "test",
        SourceEventId = sourceEventId,
        Amount = amount
    };
}
