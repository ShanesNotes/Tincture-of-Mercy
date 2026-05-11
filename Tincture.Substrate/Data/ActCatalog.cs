using System.Collections.Immutable;
using Tincture.Substrate.Events;

namespace Tincture.Substrate.Data;

public sealed class ActCatalog
{
    private readonly ImmutableSortedDictionary<string, ActDef> acts;

    public ActCatalog(IEnumerable<ActDef> acts)
    {
        ArgumentNullException.ThrowIfNull(acts);
        var normalized = acts.Select(ActCatalogValidator.ValidateAct).ToList();
        if (normalized.Count == 0)
        {
            throw new InvalidOperationException("ActCatalog requires at least one act.");
        }

        if (normalized.Select(act => act.ActId).Distinct(StringComparer.Ordinal).Count() != normalized.Count)
        {
            throw new InvalidOperationException("ActCatalog act ids must be unique.");
        }

        this.acts = normalized.ToImmutableSortedDictionary(act => act.ActId, act => act, StringComparer.Ordinal);
    }

    public IReadOnlyList<ActDef> AllActs => acts.Values.ToList().AsReadOnly();

    public ActDef GetAct(string actId)
    {
        RequireNonBlank(actId, nameof(actId));
        return acts.TryGetValue(actId, out var act)
            ? act
            : throw new KeyNotFoundException($"Act '{actId}' was not found in the act catalog.");
    }

    public ActBeatDef GetBeat(string actId, string beatId)
    {
        RequireNonBlank(beatId, nameof(beatId));
        var act = GetAct(actId);
        return act.Beats.SingleOrDefault(beat => string.Equals(beat.BeatId, beatId, StringComparison.Ordinal))
            ?? throw new KeyNotFoundException($"Beat '{beatId}' was not found in act '{actId}'.");
    }

    public static ActCatalog PreludeArchitectureCatalog() => new(
    [
        new ActDef
        {
            ActId = "architecture_prelude",
            TitleKey = "act.architecture_prelude.title",
            Beats =
            [
                new ActBeatDef
                {
                    BeatId = "runtime_catalog_smoke",
                    RuntimeKey = "runtime.tick.catalog_smoke",
                    Domain = SimDomain.Care,
                    SortOrder = 10,
                    Tags = ["architecture_prelude", "runtime"]
                },
                new ActBeatDef
                {
                    BeatId = "ledger_material_smoke",
                    RuntimeKey = "runtime.tick.ledger_smoke",
                    Domain = SimDomain.Economy,
                    SortOrder = 20,
                    RequiredItemIds = ["bread"],
                    Tags = ["architecture_prelude", "ledger"]
                }
            ],
            Metadata = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["content_status"] = "architecture_test_rows_only",
                ["prelude_gate"] = "post_b0"
            },
            Tags = ["architecture_prelude"]
        }
    ]);

    public static ActCatalog OpeningCabinPrologueCatalog() => new(
    [
        new ActDef
        {
            ActId = "opening.cabin_prologue",
            TitleKey = "act.opening.cabin_prologue.title",
            Beats =
            [
                OpeningBeat("act.cinematic_two_breaths", "opening.seed.two_breaths", SimDomain.Debug, 0, [], ["cinematic", "two_breaths"]),
                OpeningBeat("act.water", "opening.verb.water", SimDomain.Care, 10, ["water_supply"], ["care", "long_morning"]),
                OpeningBeat("act.bread", "opening.verb.bread", SimDomain.Care, 20, ["bread"], ["bread", "care", "ordinary_mercy"]),
                OpeningBeat("act.tincture", "opening.verb.tincture", SimDomain.Craft, 30, ["tincture_dose"], ["apothecary", "tincture"]),
                OpeningBeat("act.wolves_hold_line", "opening.encounter.wolves_yard", SimDomain.Combat, 40, ["cudgel"], ["combat", "iiro_escape", "yard_holds"]),
                OpeningBeat("act.mother_witness", "opening.verb.anna_witness", SimDomain.Witness, 50, [], ["anna", "hesychasm", "long_pour", "witness"]),
                OpeningBeat("act.borrowed_mercy_depart", "opening.verb.borrowed_mercy_depart", SimDomain.Care, 60, ["tincture_dose_remaining"], ["borrowed_mercy", "iconographic", "threshold"])
            ],
            Metadata = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["actor_ids"] = "kalev,anna,iiro,wolf_01,wolf_02,wolf_03",
                ["anna_motif_id"] = "anna.d_phrygian_solo_female",
                ["audio_cues"] = "long_morning_start,yard_holds_start,yard_holds_resolve_safe,yard_holds_resolve_fallen,long_pour_start,long_pour_resolve",
                ["chronology_note"] = "bible_act_numbering_is_narrative_weight_not_replay_order",
                ["content_status"] = "epic_c_headless_fixture_rows",
                ["event_families"] = "care,economy,resolver,witness,death_friction,combat,route,loot,progression,notebook,audio_cue,sensory_snapshot",
                ["required_item_ids"] = "water_supply,bread,tincture_dose,tincture_dose_remaining,cudgel,wolf_material",
                ["threshold_verb_id"] = "world.cross_threshold"
            },
            Tags = ["anna", "bread", "epic_c", "iiro", "opening_act"]
        }
    ]);

    private static ActBeatDef OpeningBeat(
        string beatId,
        string runtimeKey,
        SimDomain domain,
        long sortOrder,
        List<string> requiredItemIds,
        List<string> tags) => new()
        {
            BeatId = beatId,
            RuntimeKey = runtimeKey,
            Domain = domain,
            SortOrder = sortOrder,
            RequiredItemIds = requiredItemIds,
            Tags = tags
        };

    private static void RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Value must be non-blank.", name);
        }
    }
}
