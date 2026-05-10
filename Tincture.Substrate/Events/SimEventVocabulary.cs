using Tincture.Substrate.Actors;
using Tincture.Substrate.Combat;
using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Economy;
using Tincture.Substrate.Rules;
using Tincture.Substrate.Sim.Timers;

namespace Tincture.Substrate.Events;

public static class SimEventVocabulary
{
    private static readonly IReadOnlyList<SimEventVocabularyEntry> Entries =
    [
        Entry(VerbInvocation.CompletedEventType, VerbInvocation.SourceSystemId, "Rules/VerbInvocation.cs", "Verb invocation completed."),
        Entry(VerbInvocation.RejectedEventType, VerbInvocation.SourceSystemId, "Rules/VerbInvocation.cs", "Verb invocation rejected."),
        Entry(CostLedger.ResourceChangedEventType, CostLedger.SourceSystemId, "Rules/CostLedger.cs", "Resource changed."),
        Entry(CostLedger.CostRejectedEventType, CostLedger.SourceSystemId, "Rules/CostLedger.cs", "Cost rejected."),
        Entry(OutcomeResolver.ResolvedEventType, OutcomeResolver.ResolverId, "Rules/OutcomeResolver.cs", "Outcome resolved."),
        Entry(AuraSystem.AppliedEventType, AuraSystem.SourceSystemId, "Actors/AuraSystem.cs", "Aura applied."),
        Entry(AuraSystem.StackedEventType, AuraSystem.SourceSystemId, "Actors/AuraSystem.cs", "Aura stacked."),
        Entry(AuraSystem.RefreshedEventType, AuraSystem.SourceSystemId, "Actors/AuraSystem.cs", "Aura refreshed."),
        Entry(AuraSystem.ExpiredEventType, AuraSystem.SourceSystemId, "Actors/AuraSystem.cs", "Aura expired."),
        Entry(CooldownSystem.ReadyEventType, CooldownSystem.SourceSystemId, "Actors/CooldownSystem.cs", "Cooldown ready."),
        Entry(CooldownSystem.StartedEventType, CooldownSystem.SourceSystemId, "Actors/CooldownSystem.cs", "Cooldown started."),
        Entry(CooldownSystem.UnavailableEventType, CooldownSystem.SourceSystemId, "Actors/CooldownSystem.cs", "Cooldown unavailable."),
        Entry(TimerSystem.StartedEventType, TimerSystem.SourceSystemId, "Sim/Timers/TimerSystem.cs", "Timer started."),
        Entry(TimerSystem.TickEventType, TimerSystem.SourceSystemId, "Sim/Timers/TimerSystem.cs", "Timer tick."),
        Entry(TimerSystem.CompletedEventType, TimerSystem.SourceSystemId, "Sim/Timers/TimerSystem.cs", "Timer completed."),
        Entry(TimerSystem.InterruptedEventType, TimerSystem.SourceSystemId, "Sim/Timers/TimerSystem.cs", "Timer interrupted."),
        Entry(DeathFrictionSystem.DiedEventType, DeathFrictionSystem.SourceSystemId, "Consequences/DeathFriction/DeathFrictionSystem.cs", "Actor died."),
        Entry(DeathFrictionSystem.DownedEventType, DeathFrictionSystem.SourceSystemId, "Consequences/DeathFriction/DeathFrictionSystem.cs", "Actor downed."),
        Entry(DeathFrictionSystem.RecoveredEventType, DeathFrictionSystem.SourceSystemId, "Consequences/DeathFriction/DeathFrictionSystem.cs", "Actor recovered."),
        Entry(DeathFrictionSystem.WitnessHookRecordedEventType, DeathFrictionSystem.SourceSystemId, "Consequences/DeathFriction/DeathFrictionSystem.cs", "Witness hook recorded."),
        Entry(DeathFrictionSystem.MoralDeathEventType, DeathFrictionSystem.SourceSystemId, "Consequences/DeathFriction/DeathFrictionSystem.cs", "Moral death recorded."),
        Entry(EncounterAiSystem.SpatialBandChangedEventType, EncounterAiSystem.SourceSystemId, "Combat/EncounterAiSystem.cs", "Spatial band changed."),
        Entry(EncounterAiSystem.ThreatTargetChangedEventType, EncounterAiSystem.SourceSystemId, "Combat/EncounterAiSystem.cs", "Threat target changed."),
        Entry(EncounterAiSystem.AggroEnteredEventType, EncounterAiSystem.SourceSystemId, "Combat/EncounterAiSystem.cs", "Aggro entered."),
        Entry(EncounterAiSystem.AggroExitedEventType, EncounterAiSystem.SourceSystemId, "Combat/EncounterAiSystem.cs", "Aggro exited."),
        Entry(EncounterAiSystem.PackCallEmittedEventType, EncounterAiSystem.SourceSystemId, "Combat/EncounterAiSystem.cs", "Pack call emitted."),
        Entry(EncounterAiSystem.FleeInitiatedEventType, EncounterAiSystem.SourceSystemId, "Combat/EncounterAiSystem.cs", "Flee initiated."),
        Entry(EncounterAiSystem.LeashTriggeredEventType, EncounterAiSystem.SourceSystemId, "Combat/EncounterAiSystem.cs", "Leash triggered."),
        Entry(EncounterAiSystem.RouteNodeReachedEventType, EncounterAiSystem.SourceSystemId, "Combat/EncounterAiSystem.cs", "Route node reached."),
        Entry(EncounterAiSystem.EncounterFrictionRequestedEventType, EncounterAiSystem.SourceSystemId, "Combat/EncounterAiSystem.cs", "Encounter friction requested."),
        Entry(EncounterAiSystem.EncounterRespawnResetEventType, EncounterAiSystem.SourceSystemId, "Combat/EncounterAiSystem.cs", "Encounter respawn reset."),
        Entry(LootSystem.EligibilityRecordedEventType, LootSystem.SourceSystemId, "Economy/LootSystem.cs", "Loot eligibility recorded."),
        Entry(LootSystem.MaterialOutcomeEventType, LootSystem.SourceSystemId, "Economy/LootSystem.cs", "Material outcome emitted.")
    ];

    public static IReadOnlyList<SimEventVocabularyEntry> All => Entries;

    public static SimEventVocabularyEntry? Find(string eventType)
    {
        if (string.IsNullOrWhiteSpace(eventType))
        {
            throw new ArgumentException("Event type must be non-blank.", nameof(eventType));
        }

        return Entries.SingleOrDefault(entry => string.Equals(entry.EventType, eventType, StringComparison.Ordinal));
    }

    public static IReadOnlyList<SimEventVocabularyEntry> ForSourceSystem(string sourceSystem)
    {
        if (string.IsNullOrWhiteSpace(sourceSystem))
        {
            throw new ArgumentException("Source system must be non-blank.", nameof(sourceSystem));
        }

        return Entries
            .Where(entry => string.Equals(entry.SourceSystem, sourceSystem, StringComparison.Ordinal))
            .OrderBy(entry => entry.EventType, StringComparer.Ordinal)
            .ToList()
            .AsReadOnly();
    }

    private static SimEventVocabularyEntry Entry(string eventType, string sourceSystem, string ownerPath, string description) =>
        new SimEventVocabularyEntry(eventType, sourceSystem, ownerPath, description).Validate();
}

public sealed record SimEventVocabularyEntry(
    string EventType,
    string SourceSystem,
    string OwnerPath,
    string Description)
{
    public SimEventVocabularyEntry Validate()
    {
        RequireNonBlank(EventType, nameof(EventType));
        RequireNonBlank(SourceSystem, nameof(SourceSystem));
        RequireNonBlank(OwnerPath, nameof(OwnerPath));
        RequireNonBlank(Description, nameof(Description));
        if (EventType.Contains('.', StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Sim event vocabulary entries must use snake_case event types, not dotted ids.");
        }

        return this;
    }

    private static void RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"SimEventVocabularyEntry.{name} must be non-blank.");
        }
    }
}
