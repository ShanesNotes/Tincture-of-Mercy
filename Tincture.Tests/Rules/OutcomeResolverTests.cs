using Tincture.Substrate.Data;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;
using Tincture.Substrate.Sim;

namespace Tincture.Tests.Rules;

public sealed class OutcomeResolverTests
{
    [Fact]
    public void OutcomeResolver_CareAndCombatSharePath()
    {
        var resolver = new OutcomeResolver();
        var care = resolver.Resolve(new OutcomeRequest
        {
            RequestId = "care-shared-path",
            ActorId = "kalev",
            TargetId = "mother",
            VerbId = "administer_tincture",
            Domain = SimDomain.Care,
            Tick = 20,
            Table = OutcomeTestData.TinctureTable(),
            ScriptedRollValue = 61,
            ScriptedFixtureId = "care_shared_path"
        });
        var combat = resolver.Resolve(new OutcomeRequest
        {
            RequestId = "combat-shared-path",
            ActorId = "wolf",
            TargetId = "kalev",
            VerbId = "bite",
            Domain = SimDomain.Combat,
            Tick = 21,
            Table = OutcomeTestData.WolfAttackTable(),
            ScriptedRollValue = 61,
            ScriptedFixtureId = "combat_shared_path"
        });

        Assert.Equal(OutcomeResolver.ResolverId, care.ResolverId);
        Assert.Equal(OutcomeResolver.ResolverId, combat.ResolverId);
        Assert.Equal("outcome_resolved", care.Events.Single().EventType);
        Assert.Equal("outcome_resolved", combat.Events.Single().EventType);
        Assert.Equal(OutcomeResolver.ResolverId, care.Events.Single().SourceSystem);
        Assert.Equal(OutcomeResolver.ResolverId, combat.Events.Single().SourceSystem);
    }

    [Fact]
    public void OutcomeResolver_ScriptedTinctureFixtureStable()
    {
        var resolver = new OutcomeResolver();
        var outcome = resolver.Resolve(new OutcomeRequest
        {
            RequestId = "tincture-scripted-001",
            ActorId = "kalev",
            TargetId = "mother",
            VerbId = "administer_tincture",
            Domain = SimDomain.Care,
            Tick = 42,
            Table = OutcomeTestData.TinctureTable(),
            Modifiers = [OutcomeTestData.SteadyHandsModifier()],
            ScriptedRollValue = 64,
            ScriptedFixtureId = "act3_tincture_teaching_fixture"
        });

        Assert.Equal("tincture_stabilizes", outcome.OutcomeKey);
        AssertStableFixture("outcome_tincture_scripted_fixture.json", outcome.Events);
    }

    [Fact]
    public void OutcomeResolver_SeededWolfAttackFixtureStable()
    {
        var resolver = new OutcomeResolver();
        var outcome = resolver.Resolve(new OutcomeRequest
        {
            RequestId = "wolf-attack-001",
            ActorId = "wolf_alpha",
            TargetId = "kalev",
            VerbId = "bite",
            Domain = SimDomain.Combat,
            Tick = 77,
            Table = OutcomeTestData.WolfAttackTable(),
            Modifiers =
            [
                new OutcomeModifier
                {
                    ModifierId = "pack_pressure",
                    SourceId = "threat_table",
                    SourceEventId = "evt-00000040",
                    Kind = OutcomeModifierKind.Disparity,
                    Amount = 8,
                    Metadata = new SortedDictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["disparity_kind"] = "pack_pressure"
                    }
                }
            ],
            Rng = SeededRng.FromRoot(1234567UL).Fork("wolf_attack")
        });

        Assert.Equal(SimDomain.Combat, outcome.Events.Single().Domain);
        AssertStableFixture("outcome_wolf_seeded_fixture.json", outcome.Events);
    }

    [Fact]
    public void OutcomeResolver_RecordsTypedReceptivityModifier()
    {
        var profile = OutcomeTestData.BethanyReceptivity();
        var registerMatch = RegisterMatchModifier.FromProfile(
            path: LatentPath.Apothecary,
            voiceRegister: VoiceRegister.Folk,
            profile,
            pathStateTags: ["bread_received"],
            sceneTags: ["bread", "hungry"],
            priorTags: ["name_spoken"],
            sourceEventId: "evt-00000014");

        var resolver = new OutcomeResolver();
        var outcome = resolver.Resolve(new OutcomeRequest
        {
            RequestId = "bethany-register-001",
            ActorId = "kalev",
            TargetId = "bethany",
            VerbId = "offer_bread",
            Domain = SimDomain.Care,
            Tick = 33,
            Table = OutcomeTestData.TinctureTable(),
            Modifiers = [registerMatch.ToOutcomeModifier()],
            ScriptedRollValue = 45,
            ScriptedFixtureId = "bethany_receptivity_fixture"
        });

        var fields = outcome.Events.Single().Fields;
        Assert.Equal("apothecary", fields["path_id"]);
        Assert.Equal("folk", fields["voice_register"]);
        Assert.Equal(profile.ProfileId, fields["receptivity_profile_id"]);
        Assert.Equal("bethany", fields["receptivity_actor_id"]);
        Assert.Equal("2", fields["path_fit"]);
        Assert.Equal("7", fields["register_fit"]);
        Assert.Equal("11", fields["register_match_modifier"]);
        Assert.Equal("cold,hungry", fields["need_tags"]);
        Assert.Equal("stranger,wolf_howl", fields["fear_tags"]);
        Assert.Equal("bread,name_spoken,quiet_presence", fields["comfort_tags"]);
        Assert.Equal("case_language,too_fast", fields["refusal_triggers"]);
        Assert.Equal("bread_received,name_spoken", fields["recognition_hooks"]);
        Assert.Equal("hungry", fields["matched_need_tags"]);
        Assert.Equal(string.Empty, fields["matched_fear_tags"]);
        Assert.Equal("bread,name_spoken", fields["matched_comfort_tags"]);
        Assert.Equal(string.Empty, fields["matched_refusal_triggers"]);
        Assert.Equal("bread_received,name_spoken", fields["matched_recognition_hooks"]);
        Assert.Contains("register_match:apothecary:folk:bethany.hunger_fear.v1", fields["modifier_ids"]);
    }

    private static void AssertStableFixture(string fixtureName, IReadOnlyList<SimEvent> proposedEvents)
    {
        var stream = new SimEventStream();
        stream.AppendBatch(proposedEvents);
        var json = stream.ToStableJson();
        var fixture = File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures", fixtureName));
        Assert.Equal(fixture, json);
    }
}
