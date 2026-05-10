using System.Globalization;
using Tincture.Substrate.Rules;

namespace Tincture.Substrate.Combat;

public sealed class DisparityService
{
    public const string SourceSystemId = "disparity_service.v1";
    public const string RuleId = "disparity.power_delta.v1";

    public OutcomeModifier CreateModifier(DisparityRequest request)
    {
        request.Validate();
        var disparity = request.ActorPower - request.TargetPower;
        var amount = Math.Clamp(disparity / request.PowerPerModifier, request.MinimumModifier, request.MaximumModifier);

        return new OutcomeModifier
        {
            ModifierId = request.ModifierId,
            SourceId = SourceSystemId,
            SourceEventId = request.SourceEventId,
            Kind = OutcomeModifierKind.Disparity,
            Amount = amount,
            Metadata = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["disparity_actor_id"] = request.ActorId,
                ["disparity_actor_power"] = request.ActorPower.ToString(CultureInfo.InvariantCulture),
                ["disparity_amount"] = amount.ToString(CultureInfo.InvariantCulture),
                ["disparity_rule_id"] = RuleId,
                ["disparity_target_id"] = request.TargetId,
                ["disparity_target_power"] = request.TargetPower.ToString(CultureInfo.InvariantCulture)
            }
        }.Normalize();
    }
}

public sealed record DisparityRequest
{
    public string ModifierId { get; init; } = "disparity.power_delta";

    public string ActorId { get; init; } = string.Empty;

    public string TargetId { get; init; } = string.Empty;

    public string? SourceEventId { get; init; }

    public int ActorPower { get; init; }

    public int TargetPower { get; init; }

    public int PowerPerModifier { get; init; } = 5;

    public int MinimumModifier { get; init; } = -20;

    public int MaximumModifier { get; init; } = 20;

    public void Validate()
    {
        RequireNonBlank(ModifierId, nameof(ModifierId));
        RequireNonBlank(ActorId, nameof(ActorId));
        RequireNonBlank(TargetId, nameof(TargetId));
        if (PowerPerModifier <= 0)
        {
            throw new InvalidOperationException("DisparityRequest.PowerPerModifier must be positive.");
        }

        if (MinimumModifier > MaximumModifier)
        {
            throw new InvalidOperationException("DisparityRequest.MinimumModifier must be <= MaximumModifier.");
        }
    }

    private static void RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{name} must be non-blank.");
        }
    }
}
