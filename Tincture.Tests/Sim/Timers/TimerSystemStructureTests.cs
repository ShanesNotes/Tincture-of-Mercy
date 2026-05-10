namespace Tincture.Tests.Sim.Timers;

public sealed class TimerSystemStructureTests
{
    private static string RepoRoot => Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void TimerSystemStructure_OnlyTimerSystemEmitsTimerEvents()
    {
        var sourceRoot = Path.Combine(RepoRoot, "Tincture.Substrate");
        var allowed = Path.Combine("Sim", "Timers", "TimerSystem.cs");
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
                file.text.Contains("EventType = \"timer_", StringComparison.Ordinal)
                || file.text.Contains("EventType = TimerSystem.", StringComparison.Ordinal))
            .Select(file => file.relativePath)
            .OrderBy(path => path, StringComparer.Ordinal)
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
