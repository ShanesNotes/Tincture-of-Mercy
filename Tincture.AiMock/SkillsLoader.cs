#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

namespace Tincture.AiMock;

/// <summary>
/// Parses a character's skills.md. Each skill is a `## verb_name` section with
/// `key: value` lines. Multi-clause keys (preconds, effects, cost) split on `;`.
/// Intentionally tolerant — unknown keys are ignored, missing optional keys
/// default to empty.
/// </summary>
public static class SkillsLoader
{
    public static IReadOnlyList<SkillSpec> Load(string skillsMdPath)
    {
        var lines = File.ReadAllLines(skillsMdPath);
        var skills = new List<SkillSpec>();
        string? currentVerb = null;
        var pairs = new Dictionary<string, string>(StringComparer.Ordinal);

        void Flush()
        {
            if (currentVerb is null) return;
            skills.Add(BuildSpec(currentVerb, pairs));
            pairs.Clear();
        }

        foreach (var rawLine in lines)
        {
            var line = rawLine.TrimEnd();
            if (string.IsNullOrWhiteSpace(line)) continue;
            if (line.StartsWith("# ", StringComparison.Ordinal)) continue;
            if (line.StartsWith("## ", StringComparison.Ordinal))
            {
                Flush();
                currentVerb = line[3..].Trim();
                continue;
            }
            var colon = line.IndexOf(':');
            if (colon <= 0) continue;
            var key = line[..colon].Trim();
            var value = line[(colon + 1)..].Trim();
            pairs[key] = value;
        }
        Flush();

        return skills;
    }

    private static SkillSpec BuildSpec(string verb, IReadOnlyDictionary<string, string> p)
    {
        var preconds = ParsePreconds(p.GetValueOrDefault("preconds", string.Empty));
        var targets = SplitClauses(p.GetValueOrDefault("targets", string.Empty), ',');
        var effects = ParseEffects(p.GetValueOrDefault("effects", string.Empty));
        var costs = ParseEffects(p.GetValueOrDefault("cost", string.Empty));
        var arguments = ParseArguments(p.GetValueOrDefault("arguments", string.Empty));
        var animation = p.TryGetValue("animation", out var a) && !string.IsNullOrWhiteSpace(a) ? a : null;
        return new SkillSpec(verb, preconds, targets, effects, costs, arguments, animation);
    }

    private static IReadOnlyList<Precondition> ParsePreconds(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return Array.Empty<Precondition>();
        var clauses = SplitClauses(raw, ';');
        var result = new List<Precondition>(clauses.Count);
        foreach (var clause in clauses)
        {
            var (path, op, value) = SplitCompare(clause);
            if (op is null)
            {
                result.Add(new FlagPrecond(clause, clause));
            }
            else
            {
                result.Add(new ComparePrecond(path, op, value, clause));
            }
        }
        return result;
    }

    private static IReadOnlyList<EffectExpr> ParseEffects(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return Array.Empty<EffectExpr>();
        var clauses = SplitClauses(raw, ';');
        var result = new List<EffectExpr>(clauses.Count);
        foreach (var clause in clauses)
        {
            // Order matters: ":=" before "+=" before "-=" so the longer tokens win.
            if (TrySplit(clause, ":=", out var p, out var v))
            {
                if (p.EndsWith(".append", StringComparison.Ordinal))
                {
                    result.Add(new EffectExpr(p[..^".append".Length], EffectOp.Append, v));
                }
                else
                {
                    result.Add(new EffectExpr(p, EffectOp.Assign, v));
                }
            }
            else if (TrySplit(clause, "+=", out p, out v))
            {
                result.Add(new EffectExpr(p, EffectOp.Increment, v));
            }
            else if (TrySplit(clause, "-=", out p, out v))
            {
                result.Add(new EffectExpr(p, EffectOp.Decrement, v));
            }
        }
        return result;
    }

    private static IReadOnlyDictionary<string, ArgumentSpec> ParseArguments(string raw)
    {
        var dict = new Dictionary<string, ArgumentSpec>(StringComparer.Ordinal);
        if (string.IsNullOrWhiteSpace(raw)) return dict;
        foreach (var clause in SplitClauses(raw, ','))
        {
            var colon = clause.IndexOf(':');
            if (colon <= 0) continue;
            var name = clause[..colon].Trim();
            var rest = clause[(colon + 1)..].Trim();
            var enumStart = rest.IndexOf('[');
            if (rest.StartsWith("enum", StringComparison.Ordinal) && enumStart > 0 && rest.EndsWith("]", StringComparison.Ordinal))
            {
                var inner = rest[(enumStart + 1)..^1];
                var values = inner.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).ToList();
                dict[name] = new ArgumentSpec(name, "enum", values);
            }
            else
            {
                dict[name] = new ArgumentSpec(name, rest, Array.Empty<string>());
            }
        }
        return dict;
    }

    private static (string Path, string? Op, string Value) SplitCompare(string clause)
    {
        foreach (var op in new[] { "==", "<=", ">=", "<", ">" })
        {
            var idx = clause.IndexOf(op, StringComparison.Ordinal);
            if (idx > 0)
            {
                var path = clause[..idx].Trim();
                var val = clause[(idx + op.Length)..].Trim();
                return (path, op, val);
            }
        }
        return (clause, null, string.Empty);
    }

    private static bool TrySplit(string clause, string op, out string path, out string value)
    {
        var idx = clause.IndexOf(op, StringComparison.Ordinal);
        if (idx <= 0) { path = string.Empty; value = string.Empty; return false; }
        path = clause[..idx].Trim();
        value = clause[(idx + op.Length)..].Trim();
        return true;
    }

    private static IReadOnlyList<string> SplitClauses(string raw, char sep)
    {
        return raw.Split(sep, StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).ToList();
    }
}
