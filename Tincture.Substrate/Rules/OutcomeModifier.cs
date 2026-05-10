using Tincture.Substrate.Events;

namespace Tincture.Substrate.Rules;

public enum OutcomeModifierKind
{
    Generic,
    Aura,
    Receptivity,
    RegisterMatch,
    Disparity,
    Scripted
}

public static class OutcomeModifierKindExtensions
{
    public static string ToId(this OutcomeModifierKind kind) => kind switch
    {
        OutcomeModifierKind.Generic => "generic",
        OutcomeModifierKind.Aura => "aura",
        OutcomeModifierKind.Receptivity => "receptivity",
        OutcomeModifierKind.RegisterMatch => "register_match",
        OutcomeModifierKind.Disparity => "disparity",
        OutcomeModifierKind.Scripted => "scripted",
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown outcome modifier kind.")
    };

    public static OutcomeModifierKind FromId(string id) => id switch
    {
        "generic" => OutcomeModifierKind.Generic,
        "aura" => OutcomeModifierKind.Aura,
        "receptivity" => OutcomeModifierKind.Receptivity,
        "register_match" => OutcomeModifierKind.RegisterMatch,
        "disparity" => OutcomeModifierKind.Disparity,
        "scripted" => OutcomeModifierKind.Scripted,
        _ => throw new ArgumentOutOfRangeException(nameof(id), id, "Unknown outcome modifier kind id.")
    };
}

public sealed record OutcomeModifier
{
    public string ModifierId { get; init; } = string.Empty;

    public string SourceId { get; init; } = string.Empty;

    public string? SourceEventId { get; init; }

    public OutcomeModifierKind Kind { get; init; } = OutcomeModifierKind.Generic;

    public int Amount { get; init; }

    public SortedDictionary<string, string> Metadata { get; init; } = new(StringComparer.Ordinal);

    public OutcomeModifier Normalize()
    {
        if (string.IsNullOrWhiteSpace(ModifierId))
        {
            throw new InvalidOperationException("OutcomeModifier.ModifierId must be non-blank.");
        }

        if (string.IsNullOrWhiteSpace(SourceId))
        {
            throw new InvalidOperationException("OutcomeModifier.SourceId must be non-blank.");
        }

        return this with { Metadata = SimEvent.StableDictionary(Metadata) };
    }
}
