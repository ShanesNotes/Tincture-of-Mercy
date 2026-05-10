namespace Tincture.Substrate.Consequences.DeathFriction;

public enum BodyEligibility
{
    NotApplicable,
    NotRecoverable,
    RecoverableBody
}

public static class BodyEligibilityExtensions
{
    public static string ToId(this BodyEligibility eligibility) => eligibility switch
    {
        BodyEligibility.NotApplicable => "not_applicable",
        BodyEligibility.NotRecoverable => "not_recoverable",
        BodyEligibility.RecoverableBody => "recoverable_body",
        _ => throw new ArgumentOutOfRangeException(nameof(eligibility), eligibility, "Unknown body eligibility.")
    };

    public static BodyEligibility FromId(string id) => id switch
    {
        "not_applicable" => BodyEligibility.NotApplicable,
        "not_recoverable" => BodyEligibility.NotRecoverable,
        "recoverable_body" => BodyEligibility.RecoverableBody,
        _ => throw new ArgumentOutOfRangeException(nameof(id), id, "Unknown body eligibility id.")
    };
}
