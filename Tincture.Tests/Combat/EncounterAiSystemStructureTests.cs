namespace Tincture.Tests.Combat;

public sealed class EncounterAiSystemStructureTests
{
    private static readonly string[] B4EventTypes =
    [
        "spatial_band_changed",
        "threat_target_changed",
        "aggro_entered",
        "aggro_exited",
        "pack_call_emitted",
        "flee_initiated",
        "leash_triggered",
        "route_node_reached",
        "encounter_friction_requested",
        "encounter_respawn_reset"
    ];

    private static string RepoRoot => Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void EncounterAiSystemStructure_OnlyEncounterAiSystemEmitsB4Events()
    {
        var sourceRoot = Path.Combine(RepoRoot, "Tincture.Substrate");
        var allowed = Path.Combine("Combat", "EncounterAiSystem.cs");
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
            .Where(file => B4EventTypes.Any(eventType => file.text.Contains($"EventType = \"{eventType}\"", StringComparison.Ordinal))
                || file.text.Contains("EventType = EncounterAiSystem.", StringComparison.Ordinal))
            .Select(file => file.relativePath)
            .OrderBy(path => path, StringComparer.Ordinal)
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void EncounterAiSystemStructure_NoGodotOrRuntimeTimersInB4Code()
    {
        var sourceRoots = new[]
        {
            Path.Combine(RepoRoot, "Tincture.Substrate", "Combat"),
            Path.Combine(RepoRoot, "Tincture.Substrate", "World")
        };
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
            "Environment.TickCount"
        };

        var offenders = sourceRoots
            .SelectMany(root => Directory.EnumerateFiles(root, "*.cs", SearchOption.AllDirectories)
                .Where(path => !IsUnderIgnoredBuildDirectory(root, path))
                .Select(path => new { root, path, text = File.ReadAllText(path) }))
            .SelectMany(file => blockedPatterns
                .Where(pattern => file.text.Contains(pattern, StringComparison.Ordinal))
                .Select(pattern => $"{Path.GetRelativePath(file.root, file.path)} contains {pattern}"))
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void EncounterAiSystemStructure_NoPrivateEntropyInB4Code()
    {
        var sourceRoots = new[]
        {
            Path.Combine(RepoRoot, "Tincture.Substrate", "Combat"),
            Path.Combine(RepoRoot, "Tincture.Substrate", "World")
        };
        var blockedPatterns = new[]
        {
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

        var offenders = sourceRoots
            .SelectMany(root => Directory.EnumerateFiles(root, "*.cs", SearchOption.AllDirectories)
                .Where(path => !IsUnderIgnoredBuildDirectory(root, path))
                .Select(path => new { root, path, text = File.ReadAllText(path) }))
            .SelectMany(file => blockedPatterns
                .Where(pattern => file.text.Contains(pattern, StringComparison.Ordinal))
                .Select(pattern => $"{Path.GetRelativePath(file.root, file.path)} contains {pattern}"))
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void EncounterAiSystemStructure_DoesNotCallOutcomeResolverOrEmitForbiddenConsequenceEvents()
    {
        var sourceRoot = Path.Combine(RepoRoot, "Tincture.Substrate", "Combat");
        var blockedPatterns = new[]
        {
            "new OutcomeResolver",
            ".Resolve(new OutcomeRequest",
            "EventType = \"resource_changed\"",
            "EventType = \"actor_died\"",
            "EventType = \"actor_downed\"",
            "EventType = \"actor_recovered\"",
            "EventType = \"moral_death_recorded\"",
            "EventType = \"witness_hook_recorded\"",
            "EventType = DeathFrictionSystem."
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
    public void EncounterAiSystemStructure_NoDottedB4EventTypesOrFixtureIdBranchesInProduction()
    {
        var sourceRoots = new[]
        {
            Path.Combine(RepoRoot, "Tincture.Substrate", "Combat"),
            Path.Combine(RepoRoot, "Tincture.Substrate", "World")
        };
        var blockedIdBranches = new[] { "kalev", "boy", "wolf" };

        var offenders = sourceRoots
            .SelectMany(root => Directory.EnumerateFiles(root, "*.cs", SearchOption.AllDirectories)
                .Where(path => !IsUnderIgnoredBuildDirectory(root, path))
                .Select(path => new { root, path, text = File.ReadAllText(path) }))
            .SelectMany(file => B4EventTypes
                .Where(eventType => file.text.Contains($"EventType = \"{eventType.Replace('_', '.')}\"", StringComparison.Ordinal))
                .Select(eventType => $"{Path.GetRelativePath(file.root, file.path)} contains dotted event type for {eventType}")
                .Concat(blockedIdBranches
                    .Where(blocked => file.text.Contains(blocked, StringComparison.OrdinalIgnoreCase))
                    .Select(blocked => $"{Path.GetRelativePath(file.root, file.path)} contains fixture id branch token {blocked}")))
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void EncounterAiSystemStructure_DeathDrivenFrictionAndRespawnRequireSourceDeathEventId()
    {
        var source = File.ReadAllText(Path.Combine(RepoRoot, "Tincture.Substrate", "Combat", "EncounterAiSystem.cs"));

        Assert.Contains("source_death_event_id", source, StringComparison.Ordinal);
        Assert.Contains("Death-driven encounter friction/respawn events require source_death_event_id", source, StringComparison.Ordinal);
    }

    private static bool IsUnderIgnoredBuildDirectory(string root, string path)
    {
        var relativeParts = Path.GetRelativePath(root, path)
            .Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

        return relativeParts.Contains("bin", StringComparer.Ordinal)
            || relativeParts.Contains("obj", StringComparer.Ordinal);
    }
}
