using Tincture.Substrate.Consequences.DeathFriction;

namespace Tincture.Tests.Consequences.DeathFriction;

public sealed class DeathFrictionStructureTests
{
    private static string RepoRoot => Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void DeathFrictionStructure_OnlyDeathFrictionSystemEmitsDeathFrictionEvents()
    {
        var sourceRoot = Path.Combine(RepoRoot, "Tincture.Substrate");
        var allowed = Path.Combine("Consequences", "DeathFriction", "DeathFrictionSystem.cs");
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
            .Where(file =>
                file.text.Contains("EventType = \"actor_died\"", StringComparison.Ordinal)
                || file.text.Contains("EventType = \"actor_downed\"", StringComparison.Ordinal)
                || file.text.Contains("EventType = \"actor_recovered\"", StringComparison.Ordinal)
                || file.text.Contains("EventType = \"witness_hook_recorded\"", StringComparison.Ordinal)
                || file.text.Contains("EventType = \"moral_death_recorded\"", StringComparison.Ordinal)
                || file.text.Contains("EventType = DeathFrictionSystem.", StringComparison.Ordinal))
            .Select(file => file.relativePath)
            .OrderBy(path => path, StringComparer.Ordinal)
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void DeathFrictionStructure_NoGodotOrRuntimeTimersInDeathFriction()
    {
        var sourceRoot = Path.Combine(RepoRoot, "Tincture.Substrate", "Consequences", "DeathFriction");
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
        var offenders = Directory
            .EnumerateFiles(sourceRoot, "*.cs", SearchOption.AllDirectories)
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
