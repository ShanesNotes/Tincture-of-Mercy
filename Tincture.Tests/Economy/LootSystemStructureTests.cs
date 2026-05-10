using Tincture.Substrate.Economy;

namespace Tincture.Tests.Economy;

public sealed class LootSystemStructureTests
{
    private static readonly string[] EconomyEventTypes =
    [
        "loot_eligibility_recorded",
        "material_outcome_emitted"
    ];

    private static string RepoRoot => Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void LootSystemStructure_OnlyLootSystemEmitsEconomyEvents()
    {
        var sourceRoot = Path.Combine(RepoRoot, "Tincture.Substrate");
        var allowed = Path.Combine("Economy", "LootSystem.cs");
        var offenders = Directory
            .EnumerateFiles(sourceRoot, "*.cs", SearchOption.AllDirectories)
            .Where(path => !IsUnderIgnoredBuildDirectory(sourceRoot, path))
            .Select(path => new
            {
                path,
                relativePath = Path.GetRelativePath(sourceRoot, path),
                text = File.ReadAllText(path)
            })
            .Where(file => !string.Equals(file.relativePath, allowed, StringComparison.Ordinal))
            .Where(file => EconomyEventTypes.Any(eventType => file.text.Contains($"\"{eventType}\"", StringComparison.Ordinal))
                || file.text.Contains("EventType = LootSystem.", StringComparison.Ordinal))
            .Select(file => file.relativePath)
            .OrderBy(path => path, StringComparer.Ordinal)
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void LootSystemStructure_NoGodotRuntimeTimersOrPrivateEntropyInEconomyCode()
    {
        var sourceRoot = Path.Combine(RepoRoot, "Tincture.Substrate", "Economy");
        var blockedPatterns = new[]
        {
            "Godot.",
            "SceneTreeTimer",
            "System.Threading.Timer",
            "Task.Delay",
            "DateTime.Now",
            "DateTime.UtcNow",
            "DateTimeOffset.Now",
            "DateTimeOffset.UtcNow",
            "Stopwatch",
            "Environment.TickCount",
            "new Random(",
            "System.Random",
            "Random.Shared",
            "Guid.NewGuid(",
            "DateTime.Today",
            "Stopwatch.GetTimestamp(",
            "Stopwatch.StartNew(",
            "new Stopwatch(",
            "RandomNumberGenerator"
        };

        var offenders = Directory
            .EnumerateFiles(sourceRoot, "*.cs", SearchOption.AllDirectories)
            .Where(path => !IsUnderIgnoredBuildDirectory(sourceRoot, path))
            .Select(path => new { path, text = File.ReadAllText(path) })
            .SelectMany(file => blockedPatterns
                .Where(pattern => file.text.Contains(pattern, StringComparison.Ordinal))
                .Select(pattern => $"{Path.GetRelativePath(sourceRoot, file.path)} contains {pattern}"))
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void LootSystemStructure_DoesNotSpendResolveOrEmitDeathEncounterEvents()
    {
        var sourceRoot = Path.Combine(RepoRoot, "Tincture.Substrate", "Economy");
        var blockedPatterns = new[]
        {
            "new OutcomeResolver",
            ".Resolve(new OutcomeRequest",
            "CostLedger",
            "EventType = \"resource_changed\"",
            "EventType = \"actor_died\"",
            "EventType = \"actor_downed\"",
            "EventType = \"actor_recovered\"",
            "EventType = \"moral_death_recorded\"",
            "EventType = \"witness_hook_recorded\"",
            "EventType = DeathFrictionSystem.",
            "EventType = EncounterAiSystem.",
            "EventType = VerbInvocation."
        };

        var offenders = Directory
            .EnumerateFiles(sourceRoot, "*.cs", SearchOption.AllDirectories)
            .Where(path => !IsUnderIgnoredBuildDirectory(sourceRoot, path))
            .Select(path => new { path, text = File.ReadAllText(path) })
            .SelectMany(file => blockedPatterns
                .Where(pattern => file.text.Contains(pattern, StringComparison.Ordinal))
                .Select(pattern => $"{Path.GetRelativePath(sourceRoot, file.path)} contains {pattern}"))
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void LootSystemStructure_EconomyUsesDeathProjectionRatherThanActorState()
    {
        var source = File.ReadAllText(Path.Combine(RepoRoot, "Tincture.Substrate", "Economy", "LootSystem.cs"));

        Assert.Contains("deathFrictionSystem.Project(request.EventStream.Events)", source, StringComparison.Ordinal);
        Assert.DoesNotContain("ActorState", source, StringComparison.Ordinal);
    }

    private static bool IsUnderIgnoredBuildDirectory(string root, string path)
    {
        var relativeParts = Path.GetRelativePath(root, path)
            .Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

        return relativeParts.Contains("bin", StringComparer.Ordinal)
            || relativeParts.Contains("obj", StringComparer.Ordinal);
    }
}
