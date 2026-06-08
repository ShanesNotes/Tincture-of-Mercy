#nullable enable
using System.Collections.Generic;
using System.Globalization;
using System.Text.RegularExpressions;

namespace Tincture.AiMock;

/// <summary>
/// Applies SkillSpec effects (and costs) to MockWorldState. Returns a
/// human-readable list of changes for logging / display in the REPL.
/// In production this is replaced by appending real SimEvents through
/// VerbInvocation; effects fall out of OutcomeResolver instead.
/// </summary>
public static class EffectApplier
{
    private static readonly Regex Placeholder = new(@"\{(?<name>\w+)\}", RegexOptions.Compiled);

    public static IReadOnlyList<string> Apply(
        MockWorldState state,
        IReadOnlyList<EffectExpr> effects,
        IReadOnlyDictionary<string, string>? arguments)
    {
        var applied = new List<string>();
        foreach (var e in effects)
        {
            var resolvedValue = Resolve(e.ValueExpr, arguments);
            switch (e.Op)
            {
                case EffectOp.Increment:
                case EffectOp.Decrement:
                    if (double.TryParse(resolvedValue, NumberStyles.Float, CultureInfo.InvariantCulture, out var delta))
                    {
                        var signed = e.Op == EffectOp.Increment ? delta : -delta;
                        var prev = state.Numbers.GetValueOrDefault(e.Path);
                        var next = prev + signed;
                        state.Numbers[e.Path] = next;
                        applied.Add($"{e.Path}: {prev:0.##} -> {next:0.##}");
                    }
                    break;
                case EffectOp.Assign:
                    if (double.TryParse(resolvedValue, NumberStyles.Float, CultureInfo.InvariantCulture, out var num))
                    {
                        state.Numbers[e.Path] = num;
                        applied.Add($"{e.Path} := {num:0.##}");
                    }
                    else
                    {
                        state.Strings[e.Path] = resolvedValue;
                        applied.Add($"{e.Path} := \"{resolvedValue}\"");
                    }
                    break;
                case EffectOp.Append:
                    if (e.Path.Equals("notebook", System.StringComparison.Ordinal))
                    {
                        state.NotebookEntries.Add(resolvedValue);
                        applied.Add($"notebook << \"{resolvedValue}\"");
                    }
                    break;
            }
        }
        return applied;
    }

    private static string Resolve(string expr, IReadOnlyDictionary<string, string>? arguments)
    {
        if (arguments is null || arguments.Count == 0) return expr;
        return Placeholder.Replace(expr, m =>
            arguments.TryGetValue(m.Groups["name"].Value, out var v) ? v : m.Value);
    }
}
