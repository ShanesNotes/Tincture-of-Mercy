using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Events;

namespace Tincture.Tests.Consequences.DeathFriction;

public sealed class DeathFrictionTests
{
    private static string FixturePath(string fixtureName) => Path.Combine(AppContext.BaseDirectory, "Fixtures", fixtureName);

    [Fact]
    public void DeathFriction_MotherFixedDeathWitnessFixtureReplay()
    {
        var system = new DeathFrictionSystem();
        var stream = new SimEventStream();
        var death = stream.AppendBatch([system.DeclareDeath(new DeathFrictionRequest
        {
            RequestId = "death-mother-001",
            ActorId = "mother",
            TargetId = "kalev",
            VerbId = "death.mother",
            Domain = SimDomain.Witness,
            Tick = 410,
            Kind = DeathFrictionKind.FixedDeath,
            Cause = "act4_fading_fixture",
            Recoverable = false,
            BodyEligibility = BodyEligibility.NotRecoverable,
            WitnessHook = "witness.kalev",
            FrictionRuleId = "friction.mother_fixed.v1",
            ConsequenceTags = ["act4", "gravity_encounter", "mother", "witnessed"],
            ContextFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["comfort_tags"] = "held_hand,name_spoken",
                ["fixed_outcome"] = "true"
            }
        })]).Single();
        stream.AppendBatch([system.RecordWitness(new WitnessHookRequest
        {
            RequestId = "witness-kalev-mother-001",
            ActorId = "kalev",
            TargetId = "mother",
            VerbId = "witness.kalev",
            Domain = SimDomain.Witness,
            Tick = 411,
            SourceEventId = death.Id,
            WitnessHook = "witness.kalev",
            ConsequenceTags = ["burden", "mother", "recollection_seed", "witnessed"],
            ContextFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["burden_delta"] = "3",
                ["recollection_seed"] = "mother_name_witnessed"
            }
        })]);

        var json = stream.ToStableJson();
        var replay = SimEventStream.FromStableJson(json);
        var projected = system.Project(replay.Events);

        Assert.Equal(File.ReadAllText(FixturePath("death_friction_mother_fixed_witness_fixture.json")), json);
        Assert.True(projected["mother"].IsDead);
        Assert.Equal(DeathFrictionKind.FixedDeath, projected["mother"].CurrentKind);
        Assert.Equal("witness.kalev", projected["mother"].WitnessHook);
        Assert.All(replay.Events, simEvent => Assert.Contains(simEvent.Domain.ToId(), simEvent.Tags));
        Assert.Contains(replay.Events, simEvent => simEvent.EventType == DeathFrictionSystem.WitnessHookRecordedEventType
            && simEvent.Fields["source_event_id"] == death.Id
            && simEvent.Fields["recollection_seed"] == "mother_name_witnessed");
    }

    [Fact]
    public void DeathFriction_KalevDownAndRecoveryFixtureReplay()
    {
        var system = new DeathFrictionSystem();
        var stream = new SimEventStream();
        var downed = stream.AppendBatch([system.MarkDowned(new DeathFrictionRequest
        {
            RequestId = "kalev-downed-001",
            ActorId = "kalev",
            TargetId = "wolf_alpha",
            VerbId = "combat.kalev.downed",
            Domain = SimDomain.Combat,
            Tick = 92,
            Kind = DeathFrictionKind.Downed,
            Cause = "wolf_bite_overwhelm",
            CauseEventId = "evt-combat-hit-001",
            Recoverable = true,
            BodyEligibility = BodyEligibility.NotApplicable,
            WitnessHook = "progression.protection",
            FrictionRuleId = "friction.kalev_downed.recoverable.v1",
            ConsequenceTags = ["boy_protected", "combat", "kalev", "recovery_window"],
            ContextFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["boy_safety_state"] = "behind_kalev",
                ["remaining_recovery_ticks"] = "12"
            }
        })]).Single();
        stream.AppendBatch([system.Recover(new DeathRecoveryRequest
        {
            RequestId = "kalev-recovered-001",
            ActorId = "kalev",
            TargetId = "wolf_alpha",
            VerbId = "combat.kalev.recover",
            Domain = SimDomain.Combat,
            Tick = 104,
            SourceDownedEventId = downed.Id,
            RecoveryPolicy = "recover_after_safe_window",
            FrictionRuleId = "friction.kalev_downed.recoverable.v1",
            ConsequenceTags = ["combat", "kalev", "recovered"],
            ContextFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["health_floor"] = "1"
            }
        })]);

        var json = stream.ToStableJson();
        var replay = SimEventStream.FromStableJson(json);
        var projected = system.Project(replay.Events)["kalev"];

        Assert.Equal(File.ReadAllText(FixturePath("death_friction_kalev_down_recovery_fixture.json")), json);
        Assert.False(projected.IsDowned);
        Assert.False(projected.IsDead);
        Assert.Equal("evt-00000002", projected.LastEventId);
        Assert.All(replay.Events, simEvent => Assert.Contains(simEvent.Domain.ToId(), simEvent.Tags));
        Assert.Contains(replay.Events, simEvent => simEvent.EventType == DeathFrictionSystem.DownedEventType
            && simEvent.Fields["recoverable"] == "true"
            && simEvent.Fields["body_eligible"] == "false"
            && simEvent.Fields["body_eligibility"] == "not_applicable");
    }

    [Fact]
    public void DeathFriction_WolfDeathRecoverableBodyEligibilityReplay()
    {
        var system = new DeathFrictionSystem();
        var stream = new SimEventStream();
        stream.AppendBatch([system.DeclareDeath(new DeathFrictionRequest
        {
            RequestId = "wolf-death-001",
            ActorId = "wolf_alpha",
            TargetId = "kalev",
            VerbId = "combat.wolf.death_or_flee",
            Domain = SimDomain.Combat,
            Tick = 128,
            Kind = DeathFrictionKind.BiologicalDeath,
            Cause = "combat.attack.resolve",
            CauseEventId = "evt-00000077",
            Recoverable = false,
            BodyEligibility = BodyEligibility.RecoverableBody,
            WitnessHook = "progression.protection",
            FrictionRuleId = "friction.wolf_body.recoverable.v1",
            ConsequenceTags = ["body_recoverable", "combat", "material_consequence", "wolf"],
            ContextFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["body_eligibility_reason"] = "wolf_killed_in_reachable_zone",
                // B3.5 exposes the body/material seam for B5c; it does not emit loot events.
                ["loot_hook"] = "loot.wolf.material"
            }
        })]);

        var json = stream.ToStableJson();
        var replay = SimEventStream.FromStableJson(json);
        var projected = system.Project(replay.Events)["wolf_alpha"];
        var death = replay.Events.Single();

        Assert.Equal(File.ReadAllText(FixturePath("death_friction_wolf_body_eligibility_fixture.json")), json);
        Assert.True(projected.IsDead);
        Assert.False(projected.Recoverable);
        Assert.True(projected.BodyEligible);
        Assert.Equal("true", death.Fields["body_eligible"]);
        Assert.Equal("recoverable_body", death.Fields["body_eligibility"]);
        Assert.Equal("dead", death.Results["mortality_state"]);
        Assert.Equal("loot.wolf.material", death.Fields["loot_hook"]);
        Assert.Contains(death.Domain.ToId(), death.Tags);
        Assert.DoesNotContain(replay.Events, simEvent => simEvent.EventType.StartsWith("loot_", StringComparison.Ordinal));
    }

    [Fact]
    public void DeathFriction_MoralDeathEventShapeExists()
    {
        var system = new DeathFrictionSystem();
        var stream = new SimEventStream();
        var moralDeath = stream.AppendBatch([system.RecordMoralDeath(new DeathFrictionRequest
        {
            RequestId = "moral-death-001",
            ActorId = "kalev",
            TargetId = "boy",
            VerbId = "death.moral.protection_failure",
            Domain = SimDomain.Witness,
            Tick = 155,
            Kind = DeathFrictionKind.MoralDeath,
            Cause = "protection_abandoned",
            CauseEventId = "evt-boy-endangered-001",
            Recoverable = false,
            BodyEligibility = BodyEligibility.NotApplicable,
            WitnessHook = "witness.kalev",
            FrictionRuleId = "friction.moral_death.named_shape.v1",
            ConsequenceTags = ["boy", "moral_death", "protection_failure", "witness"],
            ContextFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["tuning_status"] = "shape_only"
            }
        })]).Single();

        var projected = system.Project(stream.Events)["kalev"];

        Assert.Equal(DeathFrictionSystem.MoralDeathEventType, moralDeath.EventType);
        Assert.Equal("moral_death", moralDeath.Fields["death_kind"]);
        Assert.Equal("moral_death", moralDeath.Results["mortality_state"]);
        Assert.Equal("shape_only", moralDeath.Fields["tuning_status"]);
        Assert.False(projected.IsDead);
        Assert.True(projected.IsMoralDeath);
        Assert.Throws<ArgumentOutOfRangeException>(() => ((DeathFrictionKind)999).ToId());
        Assert.Throws<ArgumentOutOfRangeException>(() => DeathFrictionKindExtensions.FromId("respawn"));
        Assert.Throws<ArgumentOutOfRangeException>(() => ((BodyEligibility)999).ToId());
        Assert.Throws<ArgumentOutOfRangeException>(() => BodyEligibilityExtensions.FromId("loot_now"));
        Assert.Throws<ArgumentOutOfRangeException>(() => ((MortalityState)999).ToId());
        Assert.Throws<ArgumentOutOfRangeException>(() => MortalityStateExtensions.FromId("respawned"));
    }

    [Fact]
    public void DeathFriction_InvalidRowsFailFast()
    {
        var system = new DeathFrictionSystem();
        var valid = new DeathFrictionRequest
        {
            RequestId = "death-valid-001",
            ActorId = "wolf_alpha",
            VerbId = "combat.wolf.death_or_flee",
            Domain = SimDomain.Combat,
            Tick = 1,
            Kind = DeathFrictionKind.BiologicalDeath,
            Cause = "combat.attack.resolve",
            FrictionRuleId = "friction.test.v1"
        };

        Assert.Throws<InvalidOperationException>(() => system.DeclareDeath(valid with { RequestId = string.Empty }));
        Assert.Throws<InvalidOperationException>(() => system.DeclareDeath(valid with { Tick = -1 }));
        Assert.Throws<InvalidOperationException>(() => system.DeclareDeath(valid with { Kind = DeathFrictionKind.Downed }));
        Assert.Throws<InvalidOperationException>(() => system.DeclareDeath(valid with
        {
            ContextFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["death_kind"] = "override"
            }
        }));
        Assert.Throws<InvalidOperationException>(() => system.RecordWitness(new WitnessHookRequest
        {
            RequestId = "witness-bad-001",
            ActorId = "kalev",
            TargetId = "mother",
            VerbId = "witness.kalev",
            Domain = SimDomain.Witness,
            Tick = 1,
            SourceEventId = string.Empty,
            WitnessHook = "witness.kalev"
        }));
        Assert.Throws<InvalidOperationException>(() => system.RecordWitness(new WitnessHookRequest
        {
            RequestId = "witness-bad-002",
            ActorId = "kalev",
            TargetId = "mother",
            VerbId = "witness.kalev",
            Domain = SimDomain.Witness,
            Tick = 1,
            SourceEventId = "evt-00000001",
            WitnessHook = "witness.kalev",
            ContextFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["actor"] = "override"
            }
        }));
    }
}
