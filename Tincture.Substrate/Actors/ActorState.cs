using System.Globalization;
using System.Collections.ObjectModel;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;

namespace Tincture.Substrate.Actors;

public sealed class ActorState
{
    private readonly SortedDictionary<ResourceKey, ResourceProfile> resourceProfiles;
    private readonly SortedDictionary<ResourceKey, int> resources;
    private readonly SortedDictionary<string, ActiveAura> activeAuras;
    private readonly SortedDictionary<string, CooldownState> cooldowns;

    private ActorState(
        string actorId,
        StatBlock baseStats,
        SortedDictionary<ResourceKey, ResourceProfile> resourceProfiles,
        SortedDictionary<ResourceKey, int> resources,
        SortedDictionary<string, ActiveAura> activeAuras,
        SortedDictionary<string, CooldownState> cooldowns)
    {
        ActorId = actorId;
        BaseStats = baseStats;
        this.resourceProfiles = resourceProfiles;
        this.resources = resources;
        this.activeAuras = activeAuras;
        this.cooldowns = cooldowns;
    }

    public string ActorId { get; }

    public StatBlock BaseStats { get; }

    public IReadOnlyDictionary<ResourceKey, ResourceProfile> ResourceProfiles => new ReadOnlyDictionary<ResourceKey, ResourceProfile>(resourceProfiles);

    public IReadOnlyDictionary<ResourceKey, int> Resources => new ReadOnlyDictionary<ResourceKey, int>(resources);

    public IReadOnlyDictionary<string, ActiveAura> ActiveAuras => new ReadOnlyDictionary<string, ActiveAura>(activeAuras);

    public IReadOnlyDictionary<string, CooldownState> Cooldowns => new ReadOnlyDictionary<string, CooldownState>(cooldowns);

    public DerivedStats DerivedStats => DerivedStats.From(BaseStats, activeAuras.Values);

    public static ActorState Create(
        string actorId,
        StatBlock? baseStats = null,
        IEnumerable<ResourceProfile>? profiles = null)
    {
        if (string.IsNullOrWhiteSpace(actorId))
        {
            throw new ArgumentException("Actor id must be non-blank.", nameof(actorId));
        }

        var profileMap = new SortedDictionary<ResourceKey, ResourceProfile>();
        foreach (var profile in profiles ?? ResourceProfile.OpeningDefaults().Values)
        {
            profileMap[profile.Key] = profile.Validate();
        }

        foreach (var requiredKey in Enum.GetValues<ResourceKey>())
        {
            if (!profileMap.ContainsKey(requiredKey))
            {
                throw new InvalidOperationException($"ActorState requires a resource profile for {requiredKey}.");
            }
        }

        var resourceMap = new SortedDictionary<ResourceKey, int>(
            profileMap.ToDictionary(pair => pair.Key, pair => pair.Value.StartingValue));

        return new ActorState(
            actorId,
            baseStats ?? new StatBlock(),
            profileMap,
            resourceMap,
            new SortedDictionary<string, ActiveAura>(StringComparer.Ordinal),
            new SortedDictionary<string, CooldownState>(StringComparer.Ordinal));
    }

    public int Resource(ResourceKey key) => resources[key];

    public ResourceProfile Profile(ResourceKey key) => resourceProfiles[key];

    public ActorState Apply(IEnumerable<SimEvent> events)
    {
        return events
            .OrderBy(simEvent => simEvent.Sequence)
            .Aggregate(this, (state, simEvent) => state.Apply(simEvent));
    }

    public ActorState Apply(SimEvent simEvent)
    {
        if (!string.Equals(simEvent.ActorId, ActorId, StringComparison.Ordinal))
        {
            return this;
        }

        return simEvent.EventType switch
        {
            CostLedger.ResourceChangedEventType => ApplyResourceChanged(simEvent),
            AuraSystem.AppliedEventType or AuraSystem.RefreshedEventType or AuraSystem.StackedEventType => UpsertAura(simEvent),
            AuraSystem.ExpiredEventType => RemoveAura(simEvent),
            CooldownSystem.StartedEventType => UpsertCooldown(simEvent),
            CooldownSystem.ReadyEventType => MarkCooldownReady(simEvent),
            // Death/friction state is a sideband consequence projection; see ADR 0014 and DeathFrictionSystem.Project.
            _ => this
        };
    }

    private ActorState ApplyResourceChanged(SimEvent simEvent)
    {
        if (!string.Equals(simEvent.SourceSystem, CostLedger.SourceSystemId, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("resource_changed events must originate from the cost ledger.");
        }

        var key = ResourceKeyExtensions.FromId(Required(simEvent.Fields, "resource_key"));
        var newValue = int.Parse(Required(simEvent.Fields, "new_value"), CultureInfo.InvariantCulture);
        var profile = resourceProfiles[key];
        var nextResources = Clone(resources);
        nextResources[key] = profile.Clamp(newValue);
        return With(resources: nextResources);
    }

    private ActorState UpsertAura(SimEvent simEvent)
    {
        var aura = ActiveAura.FromEvent(simEvent);
        var nextAuras = Clone(activeAuras);
        nextAuras[aura.AuraId] = aura;
        return With(activeAuras: nextAuras);
    }

    private ActorState RemoveAura(SimEvent simEvent)
    {
        var auraId = Required(simEvent.Fields, "aura_id");
        var nextAuras = Clone(activeAuras);
        nextAuras.Remove(auraId);
        return With(activeAuras: nextAuras);
    }

    private ActorState UpsertCooldown(SimEvent simEvent)
    {
        var cooldown = CooldownState.FromStartedEvent(simEvent);
        var nextCooldowns = Clone(cooldowns);
        nextCooldowns[cooldown.CooldownId] = cooldown;
        return With(cooldowns: nextCooldowns);
    }

    private ActorState MarkCooldownReady(SimEvent simEvent)
    {
        var cooldownId = Required(simEvent.Fields, "cooldown_id");
        if (!cooldowns.TryGetValue(cooldownId, out var cooldown))
        {
            return this;
        }

        var nextCooldowns = Clone(cooldowns);
        nextCooldowns[cooldownId] = cooldown with { ReadyEmitted = true };
        return With(cooldowns: nextCooldowns);
    }

    private ActorState With(
        SortedDictionary<ResourceKey, int>? resources = null,
        SortedDictionary<string, ActiveAura>? activeAuras = null,
        SortedDictionary<string, CooldownState>? cooldowns = null)
    {
        return new ActorState(
            ActorId,
            BaseStats,
            Clone(resourceProfiles),
            resources ?? Clone(this.resources),
            activeAuras ?? Clone(this.activeAuras),
            cooldowns ?? Clone(this.cooldowns));
    }

    private static SortedDictionary<TKey, TValue> Clone<TKey, TValue>(SortedDictionary<TKey, TValue> source)
        where TKey : notnull
    {
        return new SortedDictionary<TKey, TValue>(source, source.Comparer);
    }

    private static string Required(IReadOnlyDictionary<string, string> fields, string key)
    {
        return fields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : throw new InvalidOperationException($"Actor event is missing {key}.");
    }
}
