namespace Tincture.Substrate.Rules;

public interface IOutcomeResolver
{
    ResolvedOutcome Resolve(OutcomeRequest request);
}
