using Tincture.Substrate.Events;
using Tincture.Tests.Support;

namespace Tincture.Tests.Opening;

public sealed class OpeningActStructureTests
{
    private static readonly string[] OpeningFixtureNames =
    [
        "opening_act_water_bread_fixture.json",
        "opening_act_tincture_fixture.json",
        "opening_act_mother_witness_fixture.json",
        "opening_act_wolves_hold_line_fixture.json",
        "opening_act_wolves_kalev_falls_fixture.json",
        "opening_act_cabin_prologue_fixture.json"
    ];

    [Fact]
    public void OpeningActStructure_NoActivePorridgeInEpicC()
    {
        var files = OpeningFixtureNames
            .Select(name => Path.Combine(StructureGuard.TestsRoot, "Fixtures", name))
            .Append(Path.Combine(StructureGuard.SubstrateRoot, "Data", "ActCatalog.cs"))
            .Append(Path.Combine(StructureGuard.RepoRoot, "design_system", "v0_9_mercy_rpg_substrate", "03-opening-act-bible.md"));
        var offenders = files
            .Where(path => File.ReadAllText(path).Contains("porridge", StringComparison.OrdinalIgnoreCase))
            .Select(path => Path.GetRelativePath(StructureGuard.RepoRoot, path))
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void OpeningActStructure_NoCombatTableTypeResurrection()
    {
        var offenders = StructureGuard.FilesMatching(StructureGuard.SubstrateRoot, (_, text) =>
            text.Contains("class CombatTable", StringComparison.Ordinal)
            || text.Contains("record CombatTable", StringComparison.Ordinal)
            || text.Contains("ICombatResolver", StringComparison.Ordinal));

        Assert.Empty(offenders);
    }

    [Fact]
    public void OpeningActStructure_OnlyRuntimeOrEstablishedSystemsAppendEvents()
    {
        var allowed = new HashSet<string>(StringComparer.Ordinal)
        {
            Path.Combine("Rules", "VerbInvocation.cs"),
            Path.Combine("Combat", "EncounterAiSystem.cs"),
            Path.Combine("Economy", "LootSystem.cs"),
            Path.Combine("Events", "SimEventStream.cs")
        };
        var offenders = StructureGuard.FilesMatching(StructureGuard.SubstrateRoot, (relativePath, text) =>
            text.Contains("AppendBatch", StringComparison.Ordinal) && !allowed.Contains(relativePath));

        Assert.Empty(offenders);
    }

    [Fact]
    public void OpeningActStructure_FixturesUseStableJsonArrayShape()
    {
        foreach (var fixtureName in OpeningFixtureNames)
        {
            var path = Path.Combine(StructureGuard.TestsRoot, "Fixtures", fixtureName);
            var json = File.ReadAllText(path);
            var events = SimEventJson.DeserializeEvents(json);

            Assert.NotEmpty(events);
            Assert.Equal(json, SimEventJson.SerializeEvents(events));
            Assert.All(events, simEvent => Assert.StartsWith("evt-", simEvent.Id, StringComparison.Ordinal));
        }
    }

    [Fact]
    public void OpeningActStructure_AudioCueEventsHaveDeclaredHooks()
    {
        var declared = new SortedSet<string>(StringComparer.Ordinal)
        {
            "long_morning_start",
            "yard_holds_start",
            "yard_holds_resolve_safe",
            "yard_holds_resolve_fallen",
            "long_pour_start",
            "long_pour_resolve"
        };
        var observed = new SortedSet<string>(OpeningFixtureNames
            .SelectMany(fixtureName => SimEventJson.DeserializeEvents(File.ReadAllText(Path.Combine(StructureGuard.TestsRoot, "Fixtures", fixtureName))))
            .Select(simEvent => simEvent.Fields.TryGetValue("audio_cue", out var cue) ? cue : string.Empty)
            .Where(cue => !string.IsNullOrWhiteSpace(cue)), StringComparer.Ordinal);
        var undeclared = observed.Except(declared, StringComparer.Ordinal).ToList();

        Assert.Empty(undeclared);
        Assert.True(declared.IsSubsetOf(observed));
    }

    [Fact]
    public void OpeningActStructure_GodotAdaptersDoNotOwnCanonState()
    {
        var godotRoots = new[] { "scripts", "scenes" }
            .Select(relative => Path.Combine(StructureGuard.RepoRoot, relative))
            .Where(Directory.Exists);
        var blocked = new[]
        {
            "authoritative_inventory",
            "authoritative_patient_condition",
            "authoritative_recognition",
            "authoritative_loot_eligibility",
            "authoritative_threat_state",
            "new OutcomeResolver",
            "CombatTable"
        };
        var offenders = godotRoots
            .SelectMany(root => Directory.EnumerateFiles(root, "*.cs", SearchOption.AllDirectories)
                .Select(path => new { root, path, text = File.ReadAllText(path) }))
            .SelectMany(file => blocked
                .Where(pattern => file.text.Contains(pattern, StringComparison.Ordinal))
                .Select(pattern => $"{Path.GetRelativePath(StructureGuard.RepoRoot, file.path)} contains {pattern}"))
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(offenders);
    }
}
