using System.Globalization;
using Tincture.Substrate.Actors;
using Tincture.Substrate.Events;

namespace Tincture.Substrate.Rules;

public sealed class CostLedger
{
    public const string SourceSystemId = "cost_ledger.v1";

    public CostLedgerResult ApplyCosts(ActorState actor, CostRequest request)
    {
        ArgumentNullException.ThrowIfNull(actor);
        request.Validate(actor.ActorId);

        var normalizedCosts = request.ResourceCosts
            .Where(pair => pair.Value != 0)
            .OrderBy(pair => pair.Key)
            .ToList();

        var insufficient = normalizedCosts
            .Where(pair => actor.Resource(pair.Key) - pair.Value < actor.Profile(pair.Key).Min)
            .Select(pair => pair.Key)
            .ToList();

        if (insufficient.Count > 0)
        {
            return new CostLedgerResult(false, [BuildRejectedEvent(actor, request, insufficient)]);
        }

        var events = normalizedCosts
            .Select(pair => BuildResourceChangedEvent(actor, request, pair.Key, -pair.Value))
            .ToList()
            .AsReadOnly();

        return new CostLedgerResult(true, events);
    }

    private static SimEvent BuildResourceChangedEvent(ActorState actor, CostRequest request, ResourceKey key, int delta)
    {
        var oldValue = actor.Resource(key);
        var newValue = actor.Profile(key).Clamp(oldValue + delta);
        var resourceId = key.ToId();

        return new SimEvent
        {
            Tick = request.Tick,
            ActorId = actor.ActorId,
            VerbId = request.VerbId,
            Domain = request.Domain,
            SourceSystem = SourceSystemId,
            EventType = "resource_changed",
            Fields = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["cause"] = request.Cause,
                ["cost_ledger_request_id"] = request.RequestId,
                ["delta"] = delta.ToString(CultureInfo.InvariantCulture),
                ["new_value"] = newValue.ToString(CultureInfo.InvariantCulture),
                ["old_value"] = oldValue.ToString(CultureInfo.InvariantCulture),
                ["resource_key"] = resourceId
            }),
            Costs = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                [resourceId] = Math.Abs(delta).ToString(CultureInfo.InvariantCulture)
            }),
            Results = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                [resourceId] = newValue.ToString(CultureInfo.InvariantCulture)
            }),
            Tags = SimEvent.StableTags(["cost", "resource", request.Domain.ToString().ToLowerInvariant()])
        };
    }

    private static SimEvent BuildRejectedEvent(ActorState actor, CostRequest request, IReadOnlyList<ResourceKey> insufficient)
    {
        return new SimEvent
        {
            Tick = request.Tick,
            ActorId = actor.ActorId,
            VerbId = request.VerbId,
            Domain = request.Domain,
            SourceSystem = SourceSystemId,
            EventType = "cost_rejected",
            Fields = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["cost_ledger_request_id"] = request.RequestId,
                ["insufficient_resources"] = string.Join(",", insufficient.Select(key => key.ToId()))
            }),
            Costs = SimEvent.StableDictionary(request.ResourceCosts.ToDictionary(
                pair => pair.Key.ToId(),
                pair => pair.Value.ToString(CultureInfo.InvariantCulture),
                StringComparer.Ordinal)),
            Tags = SimEvent.StableTags(["cost", "rejected", request.Domain.ToString().ToLowerInvariant()])
        };
    }
}

public sealed record CostRequest
{
    public string RequestId { get; init; } = string.Empty;

    public string ActorId { get; init; } = string.Empty;

    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public long Tick { get; init; }

    public string Cause { get; init; } = string.Empty;

    public SortedDictionary<ResourceKey, int> ResourceCosts { get; init; } = new();

    public void Validate(string expectedActorId)
    {
        if (string.IsNullOrWhiteSpace(RequestId))
        {
            throw new InvalidOperationException("CostRequest.RequestId must be non-blank.");
        }

        if (!string.Equals(ActorId, expectedActorId, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("CostRequest.ActorId must match actor state.");
        }

        if (string.IsNullOrWhiteSpace(VerbId))
        {
            throw new InvalidOperationException("CostRequest.VerbId must be non-blank.");
        }

        if (Tick < 0)
        {
            throw new InvalidOperationException("CostRequest.Tick must be non-negative.");
        }

        foreach (var (key, amount) in ResourceCosts)
        {
            _ = key.ToId();
            if (amount < 0)
            {
                throw new InvalidOperationException("CostRequest resource costs must be non-negative.");
            }
        }
    }
}

public sealed record CostLedgerResult(bool Succeeded, IReadOnlyList<SimEvent> Events);
