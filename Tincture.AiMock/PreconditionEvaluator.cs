#nullable enable
using System.Collections.Generic;
using System.Globalization;

namespace Tincture.AiMock;

/// <summary>
/// Evaluates a SkillSpec's preconditions against MockWorldState. Returns
/// the list of clauses that failed (empty list = all satisfied).
/// </summary>
public static class PreconditionEvaluator
{
    public static IReadOnlyList<string> Failed(MockWorldState state, IReadOnlyList<Precondition> preconds)
    {
        var failed = new List<string>();
        foreach (var p in preconds)
        {
            if (!Holds(state, p)) failed.Add(p.Raw);
        }
        return failed;
    }

    private static bool Holds(MockWorldState state, Precondition p) => p switch
    {
        FlagPrecond f => state.Flags.Contains(f.Flag),
        ComparePrecond c => CompareHolds(state, c),
        _ => false,
    };

    private static bool CompareHolds(MockWorldState state, ComparePrecond c)
    {
        if (state.Numbers.TryGetValue(c.Path, out var lhsNum)
            && double.TryParse(c.Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var rhsNum))
        {
            return c.Op switch
            {
                "<" => lhsNum < rhsNum,
                ">" => lhsNum > rhsNum,
                "<=" => lhsNum <= rhsNum,
                ">=" => lhsNum >= rhsNum,
                "==" => lhsNum == rhsNum,
                _ => false,
            };
        }

        if (state.Strings.TryGetValue(c.Path, out var lhsStr) && c.Op == "==")
        {
            return string.Equals(lhsStr, c.Value, System.StringComparison.Ordinal);
        }

        return false;
    }
}
