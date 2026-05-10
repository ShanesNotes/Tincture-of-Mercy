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

    private static void RequireNonBlank(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Value must be non-blank.", name);
        }
    }
}
