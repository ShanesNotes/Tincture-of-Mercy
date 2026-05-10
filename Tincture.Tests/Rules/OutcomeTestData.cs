using Tincture.Substrate.Data;
using Tincture.Substrate.Rules;

namespace Tincture.Tests.Rules;

internal static class OutcomeTestData
{
    public static OutcomeTable TinctureTable() => new()
    {
        TableId = "care.tincture.v1",
        RollStreamId = "care_tincture",
        Entries =
        [
            new OutcomeTableEntry
            {
                EntryId = "bitter_worsen",
                OutcomeKey = "tincture_worsens",
                MinimumTotal = 0,
                Succeeded = false,
                ResultFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    ["pressure_delta"] = "1"
                },
                Tags = ["tincture", "cost"]
            },
            new OutcomeTableEntry
            {
                EntryId = "steady_administer",
                OutcomeKey = "tincture_stabilizes",
                MinimumTotal = 50,
                Succeeded = true,
                ResultFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    ["comfort_delta"] = "1",
                    ["pressure_delta"] = "-1"
                },
                Tags = ["tincture", "care"]
            },
            new OutcomeTableEntry
            {
                EntryId = "clear_reading",
                OutcomeKey = "tincture_clear_reading",
                MinimumTotal = 80,
                Succeeded = true,
                ResultFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    ["comfort_delta"] = "2",
                    ["recollection_seed"] = "1"
                },
                Tags = ["tincture", "recognition"]
            }
        ]
    };

    public static OutcomeTable WolfAttackTable() => new()
    {
        TableId = "combat.wolf_attack.v1",
        RollStreamId = "wolf_attack",
        Entries =
        [
            new OutcomeTableEntry
            {
                EntryId = "snap_miss",
                OutcomeKey = "wolf_snap_miss",
                MinimumTotal = 0,
                Succeeded = false,
                ResultFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    ["damage"] = "0",
                    ["threat_delta"] = "1"
                },
                Tags = ["wolf", "combat"]
            },
            new OutcomeTableEntry
            {
                EntryId = "bite",
                OutcomeKey = "wolf_bite",
                MinimumTotal = 45,
                Succeeded = true,
                ResultFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    ["damage"] = "3",
                    ["threat_delta"] = "2"
                },
                Tags = ["wolf", "combat", "damage"]
            },
            new OutcomeTableEntry
            {
                EntryId = "maul",
                OutcomeKey = "wolf_maul",
                MinimumTotal = 85,
                Succeeded = true,
                ResultFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    ["damage"] = "7",
                    ["threat_delta"] = "3"
                },
                Tags = ["wolf", "combat", "danger"]
            }
        ]
    };

    public static ReceptivityProfile BethanyReceptivity() => new()
    {
        ProfileId = "bethany.hunger_fear.v1",
        ActorId = "bethany",
        NeedTags = ["cold", "hungry"],
        FearTags = ["stranger", "wolf_howl"],
        ComfortTags = ["bread", "name_spoken", "quiet_presence"],
        PathFit = new SortedDictionary<LatentPath, int>
        {
            [LatentPath.Apothecary] = 2,
            [LatentPath.Hesychasm] = 1,
            [LatentPath.Iconographic] = 0
        },
        RegisterFit = new SortedDictionary<VoiceRegister, int>
        {
            [VoiceRegister.Folk] = 7,
            [VoiceRegister.Sanctioned] = 1,
            [VoiceRegister.Sacred] = -2
        },
        RefusalTriggers = ["case_language", "too_fast"],
        RecognitionHooks = ["bread_received", "name_spoken"]
    };

    public static OutcomeModifier SteadyHandsModifier(int amount = 5) => new()
    {
        ModifierId = "steady_hands",
        SourceId = "actor_state",
        SourceEventId = "evt-00000009",
        Kind = OutcomeModifierKind.Generic,
        Amount = amount,
        Metadata = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["stat_key"] = "steady"
        }
    };
}
