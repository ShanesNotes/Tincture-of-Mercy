using System.Globalization;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;

namespace Tincture.Substrate.Actors;

public sealed class AuraSystem
{
    public const string SourceSystemId = "aura_system.v1";
    public const string AppliedEventType = "aura_applied";
    public const string StackedEventType = "aura_stacked";
    public const string RefreshedEventType = "aura_refreshed";
    public const string ExpiredEventType = "aura_expired";

    private readonly ModifierAssembler modifierAssembler;

    public AuraSystem(ModifierAssembler? modifierAssembler = null)
    {
        this.modifierAssembler = modifierAssembler ?? new ModifierAssembler();
    }

    public SimEvent ApplyAura(
        ActorState actor,
        AuraDefinition definition,
        long tick,
        string verbId,
        SimDomain domain,
        string? sourceEventId = null)
    {
        definition = definition.Validate();
        var existing = actor.ActiveAuras.TryGetValue(definition.AuraId, out var active) && !active.IsExpiredAt(tick)
            ? active
            : null;
        var stackCount = existing is null ? 1 : Math.Min(existing.StackCount + 1, definition.MaxStacks);
        var eventType = existing is null
            ? AppliedEventType
            : stackCount > existing.StackCount ? StackedEventType : RefreshedEventType;

        return BuildAuraEvent(actor.ActorId, definition, tick, tick + definition.DurationTicks, stackCount, eventType, verbId, domain, sourceEventId);
    }

    public IReadOnlyList<SimEvent> ExpireByTick(ActorState actor, long tick, string verbId = "aura.expire")
    {
        return actor.ActiveAuras.Values
            .Where(aura => aura.IsExpiredAt(tick))
            .OrderBy(aura => aura.SourceEventId, StringComparer.Ordinal)
            .ThenBy(aura => aura.AuraId, StringComparer.Ordinal)
            .Select(aura => new SimEvent
            {
                Tick = tick,
                ActorId = actor.ActorId,
                VerbId = verbId,
                Domain = aura.Domain,
                SourceSystem = SourceSystemId,
                EventType = ExpiredEventType,
                Fields = SimEvent.StableDictionary(new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    ["aura_id"] = aura.AuraId,
                    ["expired_tick"] = tick.ToString(CultureInfo.InvariantCulture),
                    ["source_event_id"] = aura.SourceEventId
                }),
                Tags = SimEvent.StableTags(["aura", "expired", aura.Domain.ToId()])
            })
            .ToList()
            .AsReadOnly();
    }

    public IReadOnlyList<OutcomeModifier> AssembleModifiers(ActorState actor, long tick)
    {
        var activeModifiers = actor.ActiveAuras.Values
            .Where(aura => !aura.IsExpiredAt(tick))
            .Select(aura => aura.ToOutcomeModifier());

        return modifierAssembler.Assemble(activeModifiers);
    }

    private static SimEvent BuildAuraEvent(
        string actorId,
        AuraDefinition definition,
        long startedTick,
        long expiresTick,
        int stackCount,
        string eventType,
        string verbId,
        SimDomain domain,
        string? sourceEventId)
    {
        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["aura_id"] = definition.AuraId,
            ["duration_ticks"] = definition.DurationTicks.ToString(CultureInfo.InvariantCulture),
            ["expires_tick"] = expiresTick.ToString(CultureInfo.InvariantCulture),
            ["max_stacks"] = definition.MaxStacks.ToString(CultureInfo.InvariantCulture),
            ["modifier_amount"] = definition.ModifierAmount.ToString(CultureInfo.InvariantCulture),
            ["modifier_id"] = definition.ModifierId,
            ["modifier_kind"] = definition.ModifierKind.ToId(),
            ["stack_count"] = stackCount.ToString(CultureInfo.InvariantCulture),
            ["started_tick"] = startedTick.ToString(CultureInfo.InvariantCulture)
        };

        if (sourceEventId is not null)
        {
            fields["source_event_id"] = sourceEventId;
        }

        if (definition.DerivedStatKey is { } derivedStatKey)
        {
            fields["derived_stat_key"] = derivedStatKey.ToId();
            fields["derived_stat_delta"] = definition.DerivedStatDelta.ToString(CultureInfo.InvariantCulture);
        }

        return new SimEvent
        {
            Tick = startedTick,
            ActorId = actorId,
            VerbId = verbId,
            Domain = domain,
            SourceSystem = SourceSystemId,
            EventType = eventType,
            Fields = SimEvent.StableDictionary(fields),
            Tags = SimEvent.StableTags(["aura", "modifier", domain.ToId()])
        };
    }
}
