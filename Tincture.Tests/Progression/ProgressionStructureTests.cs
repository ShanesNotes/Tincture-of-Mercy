namespace Tincture.Tests.Progression;

public sealed class ProgressionStructureTests
{
    private static string RepoRoot => Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void ProgressionStructure_NoGodotRuntimeTimersOrPrivateEntropy()
    {
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
            "RandomNumberGenerator",
            "SeededRng"
        };

        AssertNoBlockedProductionPatterns(blockedPatterns);
    }

    [Fact]
    public void ProgressionStructure_IsReadOnlyProjectionAndDoesNotMutateOrEmitSimulationTruth()
    {
        var blockedPatterns = new[]
        {
            "AppendBatch",
            "EventType = \"",
            "SourceSystem = \"",
            "CostLedger",
            "OutcomeResolver",
            "IOutcomeResolver",
            "VerbInvocation",
            "ConsequenceApplier",
            "TimerSystem",
            "ActorState"
        };

        AssertNoBlockedProductionPatterns(blockedPatterns);
    }

    private static void AssertNoBlockedProductionPatterns(IEnumerable<string> blockedPatterns)
    {
        var sourceRoot = Path.Combine(RepoRoot, "Tincture.Substrate", "Progression");
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

    private static bool IsUnderIgnoredBuildDirectory(string root, string path)
    {
        var relativeParts = Path.GetRelativePath(root, path)
            .Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

        return relativeParts.Contains("bin", StringComparer.Ordinal)
            || relativeParts.Contains("obj", StringComparer.Ordinal);
    }
}
