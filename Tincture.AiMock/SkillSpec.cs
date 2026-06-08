#nullable enable
using System.Collections.Generic;

namespace Tincture.AiMock;

public sealed record SkillSpec(
    string Verb,
    IReadOnlyList<Precondition> Preconds,
    IReadOnlyList<string> Targets,
    IReadOnlyList<EffectExpr> Effects,
    IReadOnlyList<EffectExpr> Costs,
    IReadOnlyDictionary<string, ArgumentSpec> Arguments,
    string? Animation);

public sealed record ArgumentSpec(string Name, string Kind, IReadOnlyList<string> EnumValues);

public enum EffectOp { Increment, Decrement, Assign, Append }

public sealed record EffectExpr(string Path, EffectOp Op, string ValueExpr);

public abstract record Precondition(string Raw);
public sealed record FlagPrecond(string Flag, string Raw) : Precondition(Raw);
public sealed record ComparePrecond(string Path, string Op, string Value, string Raw) : Precondition(Raw);
