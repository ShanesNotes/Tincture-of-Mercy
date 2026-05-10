namespace Tincture.Tests.Presentation;

public sealed class PresentationStructuralGuardTests
{
    private static string RepoRoot => Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void PresentationStructure_NoGodotRuntimeTimersOrPrivateEntropy()
    {
        var blockedPatterns = new[]
        {
            "Godot",
            "SceneTreeTimer",
            "System.Threading.Timer",
            "Task.Delay",
            "DateTime.Now",
            "DateTime.UtcNow",
            "DateTimeOffset.Now",
            "DateTimeOffset.UtcNow",
            "DateTime.Today",
            "Stopwatch",
            "Environment.TickCount",
            "Guid.NewGuid(",
            "new Random(",
            "System.Random",
            "Random.Shared",
            "RandomNumberGenerator",
            "SeededRng"
        };

        AssertNoBlockedProductionPatterns(blockedPatterns);
    }

    [Fact]
    public void PresentationStructure_DoesNotReferenceGameplayMutatorsOrResolvers()
    {
        var blockedPatterns = new[]
        {
            "ActorState",
            "CostLedger",
            "OutcomeResolver",
            "IOutcomeResolver",
            "VerbInvocation",
            "ConsequenceApplier",
            "TimerSystem"
        };

        AssertNoBlockedProductionPatterns(blockedPatterns);
    }

    [Fact]
    public void PresentationStructure_DoesNotAppendEventsOrEmitSimulationTruth()
    {
        var blockedPatterns = new[]
        {
            "AppendBatch",
            "EventType = \"",
            "SourceSystem = \""
        };

        AssertNoBlockedProductionPatterns(blockedPatterns);
    }


    [Fact]
    public void PresentationStructure_OnlyPresentationEventUsesRawSimEventIngress()
    {
        var sourceRoot = Path.Combine(RepoRoot, "Tincture.Substrate", "Presentation");
        var offenders = Directory
            .EnumerateFiles(sourceRoot, "*.cs", SearchOption.AllDirectories)
            .Where(path => !IsUnderIgnoredBuildDirectory(sourceRoot, path))
            .Select(path => new
            {
                path,
                relativePath = Path.GetRelativePath(sourceRoot, path),
                text = File.ReadAllText(path)
            })
            .Where(file => !string.Equals(file.relativePath, "PresentationEvent.cs", StringComparison.Ordinal))
            .Where(file => file.text.Contains("SimEvent", StringComparison.Ordinal))
            .Select(file => file.relativePath)
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(offenders);
    }

    private static void AssertNoBlockedProductionPatterns(IEnumerable<string> blockedPatterns)
    {
        var sourceRoot = Path.Combine(RepoRoot, "Tincture.Substrate", "Presentation");
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
