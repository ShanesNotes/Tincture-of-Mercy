namespace Tincture.Substrate.Rules;

public sealed class ModifierAssembler
{
    public IReadOnlyList<OutcomeModifier> Assemble(params IEnumerable<OutcomeModifier>[] modifierGroups)
    {
        return modifierGroups
            .Where(group => group is not null)
            .SelectMany(group => group)
            .Select(modifier => modifier.Normalize())
            .OrderBy(modifier => modifier.SourceEventId ?? string.Empty, StringComparer.Ordinal)
            .ThenBy(modifier => modifier.ModifierId, StringComparer.Ordinal)
            .ThenBy(modifier => modifier.SourceId, StringComparer.Ordinal)
            .ToList()
            .AsReadOnly();
    }
}
