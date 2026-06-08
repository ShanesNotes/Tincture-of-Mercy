#nullable enable
using System.Collections.Generic;
using System.Linq;

namespace Tincture.AiMock;

public sealed record DispatchResult(
    bool Accepted,
    string Verb,
    string Reason,
    IReadOnlyList<string> FailedPreconds,
    IReadOnlyList<string> AppliedEffects,
    IReadOnlyList<string> AppliedCosts,
    string? Animation);

/// <summary>
/// The mock dispatcher: takes a parsed NpcResponse, looks up the verb in the
/// loaded skills.md, validates preconditions against MockWorldState, applies
/// effects and costs, and returns a DispatchResult for logging.
///
/// Production-equivalent: this method calls into Tincture.Substrate.Rules.
/// VerbInvocation.Invoke with a fully-populated VerbInvocationRequest. The
/// LLM never sees timer/cooldown/outcome-table machinery — it only proposes
/// the verb id, target, and arguments.
/// </summary>
public sealed class IntentDispatcher
{
    private readonly IReadOnlyDictionary<string, SkillSpec> skills;

    public IntentDispatcher(IReadOnlyList<SkillSpec> skills)
    {
        this.skills = skills.ToDictionary(s => s.Verb, System.StringComparer.Ordinal);
    }

    public DispatchResult Dispatch(MockWorldState state, ProposedIntent? intent)
    {
        if (intent is null)
        {
            return new DispatchResult(false, "(none)", "no_intent_proposed",
                System.Array.Empty<string>(), System.Array.Empty<string>(), System.Array.Empty<string>(), null);
        }

        if (!skills.TryGetValue(intent.Verb, out var spec))
        {
            return new DispatchResult(false, intent.Verb, "unknown_verb",
                System.Array.Empty<string>(), System.Array.Empty<string>(), System.Array.Empty<string>(), null);
        }

        var failed = PreconditionEvaluator.Failed(state, spec.Preconds);
        if (failed.Count > 0)
        {
            return new DispatchResult(false, intent.Verb, "precondition_failed",
                failed, System.Array.Empty<string>(), System.Array.Empty<string>(), spec.Animation);
        }

        var args = intent.Arguments;
        var appliedCosts = EffectApplier.Apply(state, spec.Costs, args);
        var appliedEffects = EffectApplier.Apply(state, spec.Effects, args);
        return new DispatchResult(true, intent.Verb, "ok",
            System.Array.Empty<string>(), appliedEffects, appliedCosts, spec.Animation);
    }
}
